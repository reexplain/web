import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const EMBEDDING_DIMENSIONS = 1536;
const MERGE_THRESHOLD = 0.88;
const EDGE_THRESHOLD = 0.72;
const MAX_EDGES_PER_NODE = 3;

const masteryInput = v.object({
  name: v.string(),
  description: v.string(),
  score: v.number(),
  evidenceCount: v.number(),
  embedding: v.array(v.float64()),
});

const graphNode = v.object({
  id: v.id("masteryConcepts"),
  name: v.string(),
  description: v.string(),
  confidenceScore: v.number(),
  masteryState: v.union(
    v.literal("unexplored"),
    v.literal("developing"),
    v.literal("demonstrated"),
    v.literal("mastered"),
  ),
  evidenceCount: v.number(),
  sessionCount: v.number(),
  sourceCount: v.number(),
  lastPracticedAt: v.number(),
});

const graphEdge = v.object({
  id: v.id("masteryEdges"),
  sourceConceptId: v.id("masteryConcepts"),
  targetConceptId: v.id("masteryConcepts"),
  relationship: v.literal("related"),
  similarity: v.number(),
  strength: v.number(),
});

const graph = v.object({
  nodes: v.array(graphNode),
  edges: v.array(graphEdge),
});

const normalizeName = (name: string) =>
  name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const cosineSimilarity = (left: number[], right: number[]) => {
  if (left.length !== EMBEDDING_DIMENSIONS || right.length !== EMBEDDING_DIMENSIONS) {
    return 0;
  }
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < EMBEDDING_DIMENSIONS; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return 0;
  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
};

const mergeEmbeddings = (
  current: number[],
  incoming: number[],
  currentWeight: number,
) => {
  const merged = current.map(
    (value, index) => (value * currentWeight + incoming[index]) / (currentWeight + 1),
  );
  const magnitude = Math.sqrt(merged.reduce((sum, value) => sum + value ** 2, 0));
  return magnitude === 0 ? incoming : merged.map((value) => value / magnitude);
};

const getMasteryState = (confidenceScore: number, sessionCount: number) => {
  if (confidenceScore < 20) return "unexplored" as const;
  if (confidenceScore < 70) return "developing" as const;
  if (confidenceScore < 85 || sessionCount < 2) return "demonstrated" as const;
  return "mastered" as const;
};

const getGraphForOwner = async (ctx: QueryCtx, ownerId: string) => {
  const [nodes, edges] = await Promise.all([
    ctx.db
      .query("masteryConcepts")
      .withIndex("by_ownerId_and_updatedAt", (query) => query.eq("ownerId", ownerId))
      .order("desc")
      .take(100),
    ctx.db
      .query("masteryEdges")
      .withIndex("by_ownerId", (query) => query.eq("ownerId", ownerId))
      .take(300),
  ]);
  const nodeIds = new Set(nodes.map((node) => node._id));

  return {
    nodes: nodes.map((node) => ({
      id: node._id,
      name: node.name,
      description: node.description,
      confidenceScore: node.confidenceScore,
      masteryState: getMasteryState(node.confidenceScore, node.sessionCount),
      evidenceCount: node.evidenceCount,
      sessionCount: node.sessionCount,
      sourceCount: node.sourceDocumentIds.length,
      lastPracticedAt: node.lastPracticedAt,
    })),
    edges: edges
      .filter(
        (edge) => nodeIds.has(edge.sourceConceptId) && nodeIds.has(edge.targetConceptId),
      )
      .map((edge) => ({
        id: edge._id,
        sourceConceptId: edge.sourceConceptId,
        targetConceptId: edge.targetConceptId,
        relationship: edge.relationship,
        similarity: edge.similarity,
        strength: edge.strength,
      })),
  };
};

export const getForOwner = internalQuery({
  args: { ownerId: v.string() },
  returns: graph,
  handler: async (ctx, args) => getGraphForOwner(ctx, args.ownerId),
});

export const getCurrentUser = query({
  args: {},
  returns: graph,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");
    return getGraphForOwner(ctx, identity.subject);
  },
});

export const applyCompletedSession = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    documentId: v.id("documents"),
    concepts: v.array(masteryInput),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId || session.documentId !== args.documentId) {
      throw new Error("Session not found.");
    }
    if (session.masteryProcessedAt) return null;
    if (args.concepts.some((concept) => concept.embedding.length !== EMBEDDING_DIMENSIONS)) {
      throw new Error("Concept embedding dimensions are invalid.");
    }

    const existingContributions = await ctx.db
      .query("masteryContributions")
      .withIndex("by_sessionId", (query) => query.eq("sessionId", args.sessionId))
      .first();
    if (existingContributions) {
      await ctx.db.patch("learningSessions", args.sessionId, {
        status: "completed",
        masteryProcessedAt: Date.now(),
        completedAt: session.completedAt ?? Date.now(),
        updatedAt: Date.now(),
      });
      return null;
    }

    const now = Date.now();
    const consolidatedConcepts: typeof args.concepts = [];
    for (const concept of args.concepts) {
      const key = normalizeName(concept.name);
      const duplicate = consolidatedConcepts.find(
        (candidate) =>
          normalizeName(candidate.name) === key ||
          cosineSimilarity(candidate.embedding, concept.embedding) >= MERGE_THRESHOLD,
      );
      if (!duplicate) {
        consolidatedConcepts.push({ ...concept });
        continue;
      }
      const duplicateWeight = Math.max(1, duplicate.evidenceCount);
      const conceptWeight = Math.max(1, concept.evidenceCount);
      duplicate.score = Math.round(
        (duplicate.score * duplicateWeight + concept.score * conceptWeight) /
          (duplicateWeight + conceptWeight),
      );
      duplicate.evidenceCount += concept.evidenceCount;
      duplicate.embedding = mergeEmbeddings(duplicate.embedding, concept.embedding, 1);
      if (concept.description.length > duplicate.description.length) {
        duplicate.description = concept.description;
      }
    }

    const nodes = await ctx.db
      .query("masteryConcepts")
      .withIndex("by_ownerId_and_updatedAt", (query) => query.eq("ownerId", args.ownerId))
      .take(200);
    const touchedIds = new Set<Id<"masteryConcepts">>();

    for (const concept of consolidatedConcepts) {
      const canonicalKey = normalizeName(concept.name);
      if (!canonicalKey) continue;
      const exactMatch = nodes.find((node) => node.canonicalKey === canonicalKey);
      const semanticMatch = exactMatch
        ? undefined
        : nodes
            .map((node) => ({ node, similarity: cosineSimilarity(node.embedding, concept.embedding) }))
            .filter((candidate) => candidate.similarity >= MERGE_THRESHOLD)
            .sort((left, right) => right.similarity - left.similarity)[0]?.node;
      const matchedNode = exactMatch ?? semanticMatch;
      const weight = Math.max(1, concept.evidenceCount);
      let masteryConceptId: Id<"masteryConcepts">;

      if (matchedNode) {
        const totalWeight = matchedNode.totalWeight + weight;
        const weightedScoreSum = matchedNode.weightedScoreSum + concept.score * weight;
        const sourceDocumentIds = matchedNode.sourceDocumentIds.includes(args.documentId)
          ? matchedNode.sourceDocumentIds
          : [...matchedNode.sourceDocumentIds, args.documentId];
        await ctx.db.patch("masteryConcepts", matchedNode._id, {
          name: concept.name,
          description: concept.description,
          embedding: mergeEmbeddings(
            matchedNode.embedding,
            concept.embedding,
            matchedNode.sessionCount,
          ),
          confidenceScore: Math.round(weightedScoreSum / totalWeight),
          weightedScoreSum,
          totalWeight,
          evidenceCount: matchedNode.evidenceCount + concept.evidenceCount,
          sessionCount: matchedNode.sessionCount + 1,
          sourceDocumentIds,
          lastPracticedAt: now,
          updatedAt: now,
        });
        masteryConceptId = matchedNode._id;
        Object.assign(matchedNode, {
          name: concept.name,
          description: concept.description,
          embedding: mergeEmbeddings(matchedNode.embedding, concept.embedding, matchedNode.sessionCount),
          confidenceScore: Math.round(weightedScoreSum / totalWeight),
          weightedScoreSum,
          totalWeight,
          evidenceCount: matchedNode.evidenceCount + concept.evidenceCount,
          sessionCount: matchedNode.sessionCount + 1,
          sourceDocumentIds,
          lastPracticedAt: now,
          updatedAt: now,
        });
      } else {
        masteryConceptId = await ctx.db.insert("masteryConcepts", {
          ownerId: args.ownerId,
          canonicalKey,
          name: concept.name,
          description: concept.description,
          embedding: concept.embedding,
          confidenceScore: concept.score,
          weightedScoreSum: concept.score * weight,
          totalWeight: weight,
          evidenceCount: concept.evidenceCount,
          sessionCount: 1,
          sourceDocumentIds: [args.documentId],
          lastPracticedAt: now,
          updatedAt: now,
        });
        const inserted = await ctx.db.get("masteryConcepts", masteryConceptId);
        if (inserted) nodes.push(inserted);
      }

      touchedIds.add(masteryConceptId);
      await ctx.db.insert("masteryContributions", {
        ownerId: args.ownerId,
        sessionId: args.sessionId,
        masteryConceptId,
        sourceDocumentId: args.documentId,
        score: concept.score,
        weight,
        evidenceCount: concept.evidenceCount,
        createdAt: now,
      });
    }

    for (const sourceConceptId of touchedIds) {
      const source = await ctx.db.get("masteryConcepts", sourceConceptId);
      if (!source) continue;
      const oldEdges = await ctx.db
        .query("masteryEdges")
        .withIndex("by_sourceConceptId", (query) => query.eq("sourceConceptId", sourceConceptId))
        .collect();
      await Promise.all(oldEdges.map((edge) => ctx.db.delete("masteryEdges", edge._id)));

      const neighbors = nodes
        .filter((node) => node._id !== sourceConceptId)
        .map((node) => ({ node, similarity: cosineSimilarity(source.embedding, node.embedding) }))
        .filter((candidate) => candidate.similarity >= EDGE_THRESHOLD)
        .sort((left, right) => right.similarity - left.similarity)
        .slice(0, MAX_EDGES_PER_NODE);
      for (const neighbor of neighbors) {
        await ctx.db.insert("masteryEdges", {
          ownerId: args.ownerId,
          sourceConceptId,
          targetConceptId: neighbor.node._id,
          relationship: "related",
          similarity: neighbor.similarity,
          strength: Math.round(neighbor.similarity * 100),
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch("learningSessions", args.sessionId, {
      status: "completed",
      completedAt: session.completedAt ?? now,
      masteryProcessedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const retractSessionContributions = async (
  ctx: MutationCtx,
  sessionId: Id<"learningSessions">,
) => {
  const contributions = await ctx.db
    .query("masteryContributions")
    .withIndex("by_sessionId", (query) => query.eq("sessionId", sessionId))
    .collect();

  for (const contribution of contributions) {
    const node = await ctx.db.get("masteryConcepts", contribution.masteryConceptId);
    await ctx.db.delete("masteryContributions", contribution._id);
    if (!node) continue;

    const remaining = await ctx.db
      .query("masteryContributions")
      .withIndex("by_masteryConceptId", (query) =>
        query.eq("masteryConceptId", contribution.masteryConceptId),
      )
      .collect();
    if (remaining.length === 0) {
      const [outgoing, incoming] = await Promise.all([
        ctx.db
          .query("masteryEdges")
          .withIndex("by_sourceConceptId", (query) =>
            query.eq("sourceConceptId", contribution.masteryConceptId),
          )
          .collect(),
        ctx.db
          .query("masteryEdges")
          .withIndex("by_targetConceptId", (query) =>
            query.eq("targetConceptId", contribution.masteryConceptId),
          )
          .collect(),
      ]);
      await Promise.all(
        [...outgoing, ...incoming].map((edge) => ctx.db.delete("masteryEdges", edge._id)),
      );
      await ctx.db.delete("masteryConcepts", contribution.masteryConceptId);
      continue;
    }

    const totalWeight = node.totalWeight - contribution.weight;
    const weightedScoreSum = node.weightedScoreSum - contribution.score * contribution.weight;
    const sourceDocumentIds = [
      ...new Set(remaining.map((item) => item.sourceDocumentId)),
    ];
    await ctx.db.patch("masteryConcepts", node._id, {
      confidenceScore: Math.round(weightedScoreSum / totalWeight),
      weightedScoreSum,
      totalWeight,
      evidenceCount: Math.max(0, node.evidenceCount - contribution.evidenceCount),
      sessionCount: remaining.length,
      sourceDocumentIds,
      lastPracticedAt: Math.max(...remaining.map((item) => item.createdAt)),
      updatedAt: Date.now(),
    });
  }
};