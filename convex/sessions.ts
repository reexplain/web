import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  getGraphForOwner,
  masteryGraph,
  retractSessionContributions,
} from "./mastery";

const persistedTurn = v.object({
  id: v.id("sessionTurns"),
  sequence: v.number(),
  role: v.union(v.literal("learner"), v.literal("assistant")),
  interactionType: v.optional(
    v.union(
      v.literal("explain"),
      v.literal("probe"),
      v.literal("why"),
      v.literal("connect"),
      v.literal("apply"),
      v.literal("challenge"),
      v.literal("hint"),
      v.literal("answer"),
    ),
  ),
  content: v.string(),
  createdAt: v.number(),
});

const conceptAssessment = v.object({
  name: v.string(),
  description: v.string(),
  state: v.union(
    v.literal("unexplored"),
    v.literal("developing"),
    v.literal("demonstrated"),
  ),
  score: v.number(),
});

const evidenceAssessment = v.object({
  conceptName: v.string(),
  kind: v.union(
    v.literal("supports"),
    v.literal("contradicts"),
    v.literal("uncertain"),
  ),
  claim: v.string(),
  rationale: v.string(),
  strength: v.number(),
});

const openQuestionAssessment = v.object({
  conceptName: v.optional(v.string()),
  text: v.string(),
  priority: v.number(),
});

const practiceExcerpt = v.object({
  id: v.string(),
  excerpt: v.string(),
  sequence: v.number(),
});

const practiceBatch = v.object({
  id: v.id("learningSessions"),
  documentId: v.id("documents"),
  filename: v.string(),
  generatedAt: v.number(),
  excerpts: v.array(practiceExcerpt),
});

const savedSession = v.object({
  id: v.id("learningSessions"),
  documentId: v.id("documents"),
  filename: v.string(),
  pageCount: v.optional(v.number()),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("abandoned"),
  ),
  documentStatus: v.union(
    v.literal("uploading"),
    v.literal("extracting"),
    v.literal("embedding"),
    v.literal("ready"),
    v.literal("failed"),
  ),
  understandingScore: v.optional(v.number()),
  conceptCount: v.number(),
  summary: v.optional(v.string()),
  concepts: v.array(
    v.object({
      name: v.string(),
      state: v.union(
        v.literal("unexplored"),
        v.literal("developing"),
        v.literal("demonstrated"),
      ),
      score: v.number(),
    }),
  ),
  updatedAt: v.number(),
});

const normalizeConceptName = (name: string) => name.trim().toLocaleLowerCase();
const PRACTICE_CONCEPT_LIMIT = 7;
const DOCUMENT_STRUCTURE_CONCEPT_PATTERN = /\b(?:appendix|chapter|exercise|figure|lesson|page|section|table|unit)\b/i;
const getLatestConceptSet = <Concept extends { sequence: number; updatedAt: number }>(
  concepts: Concept[],
  totalConceptCount: number,
) => [...concepts]
  .sort((left, right) => right.updatedAt - left.updatedAt)
  .slice(0, totalConceptCount)
  .sort((left, right) => left.sequence - right.sequence);

const getPracticeBatch = async (
  ctx: QueryCtx,
  ownerId: string,
  session: Doc<"learningSessions">,
) => {
  if (!session.masteryProcessedAt) return null;
  const [document, concepts] = await Promise.all([
    ctx.db.get("documents", session.documentId),
    ctx.db
      .query("concepts")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", session._id),
      )
      .order("asc")
      .take(50),
  ]);
  if (!document || document.ownerId !== ownerId) return null;

  const latestConcepts = getLatestConceptSet(concepts, session.totalConceptCount);
  const seenConcepts = new Set<string>();
  const excerpts = latestConcepts.flatMap((concept) => {
    const name = concept.name.trim();
    const description = concept.description?.trim();
    const content = description ? `${name}: ${description}` : name;
    const key = normalizeConceptName(name);

    if (
      !name ||
      !description ||
      seenConcepts.has(key) ||
      DOCUMENT_STRUCTURE_CONCEPT_PATTERN.test(content)
    ) {
      return [];
    }

    seenConcepts.add(key);
    return [{
      id: String(concept._id),
      excerpt: content,
      sequence: concept.sequence,
    }];
  }).slice(0, PRACTICE_CONCEPT_LIMIT);

  if (excerpts.length === 0) return null;
  return {
    id: session._id,
    documentId: document._id,
    filename: document.filename,
    generatedAt: session.masteryProcessedAt,
    excerpts,
  };
};

const getSessionsForOwner = async (ctx: QueryCtx, ownerId: string) => {
  const sessions = await ctx.db
    .query("learningSessions")
    .withIndex("by_ownerId_and_updatedAt", (query) =>
      query.eq("ownerId", ownerId),
    )
    .order("desc")
    .take(12);
  const sessionsWithDetails = await Promise.all(
    sessions.map(async (session) => {
      const [document, concepts, latestSnapshot] = await Promise.all([
        ctx.db.get("documents", session.documentId),
        ctx.db
          .query("concepts")
          .withIndex("by_sessionId_and_sequence", (query) =>
            query.eq("sessionId", session._id),
          )
          .order("asc")
          .take(50),
        ctx.db
          .query("sessionSnapshots")
          .withIndex("by_sessionId_and_createdAt", (query) =>
            query.eq("sessionId", session._id),
          )
          .order("desc")
          .first(),
      ]);

      return {
        concepts: getLatestConceptSet(concepts, session.totalConceptCount),
        document,
        latestSnapshot,
        session,
      };
    }),
  );

  return sessionsWithDetails.flatMap(({ concepts, document, latestSnapshot, session }) =>
    document && document.ownerId === ownerId
      ? [
          {
            id: session._id,
            documentId: document._id,
            filename: document.filename,
            pageCount: document.pageCount,
            status:
              session.status === "completed" &&
              session.totalConceptCount > 0 &&
              session.demonstratedConceptCount >= session.totalConceptCount
                ? "completed" as const
                : "active" as const,
            documentStatus: document.status,
            understandingScore: session.understandingScore,
            conceptCount: session.totalConceptCount,
            summary: latestSnapshot?.summary,
            concepts: concepts.map((concept) => ({
              name: concept.name,
              state: concept.state,
              score: concept.score,
            })),
            updatedAt: session.updatedAt,
          },
        ]
      : [],
  );
};

export const listForOwner = internalQuery({
  args: {
    ownerId: v.string(),
  },
  returns: v.array(savedSession),
  handler: async (ctx, args) => getSessionsForOwner(ctx, args.ownerId),
});

export const listCurrentUser = query({
  args: {},
  returns: v.array(savedSession),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");
    return getSessionsForOwner(ctx, identity.subject);
  },
});

const getPracticeForUser = async (ctx: QueryCtx, ownerId: string) => {
  const sessions = await ctx.db
    .query("learningSessions")
    .withIndex("by_ownerId_and_updatedAt", (query) => query.eq("ownerId", ownerId))
    .order("desc")
    .take(12);
  const seenDocumentIds = new Set<string>();
  for (const session of sessions) {
    if (seenDocumentIds.has(session.documentId)) continue;
    const batch = await getPracticeBatch(ctx, ownerId, session);
    if (!batch) continue;
    seenDocumentIds.add(batch.documentId);
    return batch.excerpts;
  }

  return [];
};

const getPracticeHistoryForUser = async (ctx: QueryCtx, ownerId: string) => {
  const sessions = await ctx.db
    .query("learningSessions")
    .withIndex("by_ownerId_and_updatedAt", (query) => query.eq("ownerId", ownerId))
    .collect();
  const generatedSessions = sessions
    .filter((session) => session.masteryProcessedAt !== undefined)
    .sort(
      (left, right) =>
        (right.masteryProcessedAt ?? 0) - (left.masteryProcessedAt ?? 0),
    );
  const batches = await Promise.all(
    generatedSessions.map((session) => getPracticeBatch(ctx, ownerId, session)),
  );
  return batches.flatMap((batch) => batch ? [batch] : []);
};

export const getPracticeForOwner = internalQuery({
  args: {
    ownerId: v.string(),
  },
  returns: v.array(practiceExcerpt),
  handler: async (ctx, args) => getPracticeForUser(ctx, args.ownerId),
});

export const getPracticeCurrentUser = query({
  args: {},
  returns: v.array(practiceExcerpt),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");
    return getPracticeForUser(ctx, identity.subject);
  },
});

export const getPracticeHistoryForOwner = internalQuery({
  args: { ownerId: v.string() },
  returns: v.array(practiceBatch),
  handler: async (ctx, args) => getPracticeHistoryForUser(ctx, args.ownerId),
});

const dashboardSnapshot = v.object({
  sessions: v.array(savedSession),
  practiceExcerpts: v.array(practiceExcerpt),
  masteryGraph,
});

const getDashboardSnapshot = async (ctx: QueryCtx, ownerId: string) => {
  const [sessions, practiceExcerpts, graph] = await Promise.all([
    getSessionsForOwner(ctx, ownerId),
    getPracticeForUser(ctx, ownerId),
    getGraphForOwner(ctx, ownerId),
  ]);
  return { sessions, practiceExcerpts, masteryGraph: graph };
};

export const getDashboardForOwner = internalQuery({
  args: { ownerId: v.string() },
  returns: dashboardSnapshot,
  handler: async (ctx, args) => getDashboardSnapshot(ctx, args.ownerId),
});

export const getDashboardCurrentUser = query({
  args: {},
  returns: dashboardSnapshot,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required.");
    return getDashboardSnapshot(ctx, identity.subject);
  },
});

export const getWorkspace = internalQuery({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      status: v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("abandoned"),
      ),
      activeDurationMs: v.optional(v.number()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      document: v.object({
        id: v.id("documents"),
        filename: v.string(),
        pageCount: v.optional(v.number()),
        status: v.union(
          v.literal("uploading"),
          v.literal("extracting"),
          v.literal("embedding"),
          v.literal("ready"),
          v.literal("failed"),
        ),
      }),
      turns: v.array(persistedTurn),
      activeConceptName: v.optional(v.string()),
      understandingScore: v.optional(v.number()),
      confidenceScore: v.optional(v.number()),
      concepts: v.array(
        v.object({
          id: v.id("concepts"),
          name: v.string(),
          description: v.optional(v.string()),
          state: v.union(
            v.literal("unexplored"),
            v.literal("developing"),
            v.literal("demonstrated"),
          ),
          score: v.number(),
        }),
      ),
      openQuestions: v.array(
        v.object({
          id: v.id("openQuestions"),
          text: v.string(),
          priority: v.number(),
        }),
      ),
      evidence: v.array(
        v.object({
          id: v.id("evidence"),
          conceptName: v.string(),
          kind: v.union(
            v.literal("supports"),
            v.literal("contradicts"),
            v.literal("uncertain"),
          ),
          claim: v.string(),
          rationale: v.string(),
          strength: v.number(),
          createdAt: v.number(),
        }),
      ),
      summary: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);

    if (!session || session.ownerId !== args.ownerId) {
      return null;
    }

    const document = await ctx.db.get("documents", session.documentId);
    if (!document || document.ownerId !== args.ownerId) {
      return null;
    }

    const turns = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .take(200);
    const concepts = await ctx.db
      .query("concepts")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .take(50);
    const latestSnapshot = await ctx.db
      .query("sessionSnapshots")
      .withIndex("by_sessionId_and_createdAt", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .first();
    const openQuestions = await ctx.db
      .query("openQuestions")
      .withIndex("by_sessionId_and_status", (query) =>
        query.eq("sessionId", args.sessionId).eq("status", "open"),
      )
      .take(20);
    const evidence = await ctx.db
      .query("evidence")
      .withIndex("by_sessionId_and_createdAt", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .take(100);
    const latestConcepts = getLatestConceptSet(concepts, session.totalConceptCount);
    const conceptNamesById = new Map(
      latestConcepts.map((concept) => [concept._id, concept.name]),
    );

    return {
      status: session.status,
      activeDurationMs: session.activeDurationMs,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      document: {
        id: document._id,
        filename: document.filename,
        pageCount: document.pageCount,
        status: document.status,
      },
      turns: turns.map((turn) => ({
        id: turn._id,
        sequence: turn.sequence,
        role: turn.role,
        interactionType: turn.interactionType,
        content: turn.content,
        createdAt: turn.createdAt,
      })),
      activeConceptName: session.activeConceptName,
      understandingScore: session.understandingScore,
      confidenceScore: session.confidenceScore,
      concepts: latestConcepts.map((concept) => ({
        id: concept._id,
        name: concept.name,
        description: concept.description,
        state: concept.state,
        score: concept.score,
      })),
      openQuestions: openQuestions
        .sort((left, right) => right.priority - left.priority)
        .map((question) => ({
          id: question._id,
          text: question.text,
          priority: question.priority,
        })),
      evidence: evidence.flatMap((item) => {
        const conceptName = conceptNamesById.get(item.conceptId);
        return conceptName
          ? [{
              id: item._id,
              conceptName,
              kind: item.kind,
              claim: item.claim,
              rationale: item.rationale,
              strength: item.strength,
              createdAt: item.createdAt,
            }]
          : [];
      }),
      summary: latestSnapshot?.summary,
    };
  },
});

export const getGenerationContext = internalQuery({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
  },
  returns: v.union(
    v.null(),
    v.object({
      documentChunks: v.array(v.string()),
      history: v.array(
        v.object({
          role: v.union(v.literal("learner"), v.literal("assistant")),
          content: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId || session.status !== "active") {
      return null;
    }

    const document = await ctx.db.get("documents", session.documentId);
    if (!document || document.ownerId !== args.ownerId) {
      return null;
    }

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_documentId_and_sequence", (query) =>
        query.eq("documentId", document._id),
      )
      .order("asc")
      .take(100);
    const recentTurns = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .take(40);

    const documentChunks: string[] = [];
    let documentCharacterCount = 0;
    for (const chunk of chunks) {
      if (documentCharacterCount + chunk.text.length > 80_000) {
        break;
      }
      documentChunks.push(chunk.text);
      documentCharacterCount += chunk.text.length;
    }
    const boundedHistory = [];
    let historyCharacterCount = 0;
    for (const turn of recentTurns) {
      if (historyCharacterCount + turn.content.length > 60_000) {
        break;
      }
      boundedHistory.push(turn);
      historyCharacterCount += turn.content.length;
    }

    return {
      documentChunks,
      history: boundedHistory.reverse().map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
    };
  },
});

export const getAssistantForRequest = internalQuery({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    requestId: v.string(),
  },
  returns: v.union(v.null(), persistedTurn),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      return null;
    }

    const turn = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_requestId", (query) =>
        query
          .eq("sessionId", args.sessionId)
          .eq("requestId", `${args.requestId}:assistant`),
      )
      .unique();
    if (!turn) {
      return null;
    }

    return {
      id: turn._id,
      sequence: turn.sequence,
      role: turn.role,
      interactionType: turn.interactionType,
      content: turn.content,
      createdAt: turn.createdAt,
    };
  },
});

export const appendLearnerTurn = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    content: v.string(),
    requestId: v.string(),
  },
  returns: persistedTurn,
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);

    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }

    if (session.status !== "active") {
      throw new Error("Session is not active.");
    }

    const existing = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_requestId", (query) =>
        query.eq("sessionId", args.sessionId).eq("requestId", args.requestId),
      )
      .unique();

    if (existing) {
      return {
        id: existing._id,
        sequence: existing.sequence,
        role: existing.role,
        interactionType: existing.interactionType,
        content: existing.content,
        createdAt: existing.createdAt,
      };
    }

    const latestTurn = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .first();
    const createdAt = Date.now();
    const sequence = (latestTurn?.sequence ?? -1) + 1;
    const id = await ctx.db.insert("sessionTurns", {
      sessionId: args.sessionId,
      sequence,
      role: "learner",
      content: args.content,
      status: "complete",
      requestId: args.requestId,
      createdAt,
    });

    await ctx.db.patch("learningSessions", args.sessionId, {
      updatedAt: createdAt,
    });

    return {
      id,
      sequence,
      role: "learner" as const,
      content: args.content,
      createdAt,
    };
  },
});

export const applyModelResult = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    requestId: v.string(),
    content: v.string(),
    interactionType: v.union(
      v.literal("explain"),
      v.literal("probe"),
      v.literal("why"),
      v.literal("connect"),
      v.literal("apply"),
      v.literal("challenge"),
    ),
    activeConcept: v.string(),
    concepts: v.array(conceptAssessment),
    evidence: v.array(evidenceAssessment),
    openQuestions: v.array(openQuestionAssessment),
    understandingScore: v.number(),
    summary: v.string(),
  },
  returns: persistedTurn,
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }
    if (session.status !== "active") {
      throw new Error("Session is not active.");
    }

    const assistantRequestId = `${args.requestId}:assistant`;
    const existingTurn = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_requestId", (query) =>
        query.eq("sessionId", args.sessionId).eq("requestId", assistantRequestId),
      )
      .unique();
    if (existingTurn) {
      return {
        id: existingTurn._id,
        sequence: existingTurn.sequence,
        role: existingTurn.role,
        interactionType: existingTurn.interactionType,
        content: existingTurn.content,
        createdAt: existingTurn.createdAt,
      };
    }

    const latestTurn = await ctx.db
      .query("sessionTurns")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .order("desc")
      .first();
    const createdAt = Date.now();
    const turnId = await ctx.db.insert("sessionTurns", {
      sessionId: args.sessionId,
      sequence: (latestTurn?.sequence ?? -1) + 1,
      role: "assistant",
      interactionType: args.interactionType,
      content: args.content,
      status: "complete",
      requestId: assistantRequestId,
      model: session.questionModel,
      createdAt,
    });

    const existingConcepts = await ctx.db
      .query("concepts")
      .withIndex("by_sessionId_and_sequence", (query) =>
        query.eq("sessionId", args.sessionId),
      )
      .take(50);
    const conceptsByName = new Map(
      existingConcepts.map((concept) => [normalizeConceptName(concept.name), concept]),
    );
    const conceptIdsByName = new Map(
      existingConcepts.map((concept) => [normalizeConceptName(concept.name), concept._id]),
    );

    for (const [sequence, assessment] of args.concepts.entries()) {
      const normalizedName = normalizeConceptName(assessment.name);
      const existingConcept = conceptsByName.get(normalizedName);
      if (existingConcept) {
        await ctx.db.patch("concepts", existingConcept._id, {
          description: assessment.description,
          sequence,
          state: assessment.state,
          score: assessment.score,
          updatedAt: createdAt,
        });
      } else {
        const conceptId = await ctx.db.insert("concepts", {
          sessionId: args.sessionId,
          name: assessment.name,
          description: assessment.description,
          sequence,
          state: assessment.state,
          score: assessment.score,
          evidenceCount: 0,
          updatedAt: createdAt,
        });
        conceptIdsByName.set(normalizedName, conceptId);
      }
    }

    const evidenceCounts = new Map<string, number>();
    for (const assessment of args.evidence) {
      const requestedName = normalizeConceptName(assessment.conceptName);
      const activeName = normalizeConceptName(args.activeConcept);
      const conceptId =
        conceptIdsByName.get(requestedName) ??
        conceptIdsByName.get(activeName) ??
        conceptIdsByName.values().next().value;
      if (!conceptId) {
        continue;
      }
      await ctx.db.insert("evidence", {
        sessionId: args.sessionId,
        turnId: latestTurn?.role === "learner" ? latestTurn._id : turnId,
        conceptId,
        kind: assessment.kind,
        claim: assessment.claim,
        rationale: assessment.rationale,
        strength: assessment.strength,
        createdAt,
      });
      evidenceCounts.set(
        requestedName,
        (evidenceCounts.get(requestedName) ?? 0) + 1,
      );
    }
    for (const [conceptName, count] of evidenceCounts) {
      const existingConcept = conceptsByName.get(conceptName);
      const conceptId = conceptIdsByName.get(conceptName);
      if (conceptId) {
        await ctx.db.patch("concepts", conceptId, {
          evidenceCount: (existingConcept?.evidenceCount ?? 0) + count,
        });
      }
    }

    const existingOpenQuestions = await ctx.db
      .query("openQuestions")
      .withIndex("by_sessionId_and_status", (query) =>
        query.eq("sessionId", args.sessionId).eq("status", "open"),
      )
      .take(20);
    for (const question of existingOpenQuestions) {
      await ctx.db.patch("openQuestions", question._id, {
        status: "dismissed",
        updatedAt: createdAt,
      });
    }
    for (const question of args.openQuestions) {
      await ctx.db.insert("openQuestions", {
        sessionId: args.sessionId,
        conceptId: question.conceptName
          ? conceptIdsByName.get(normalizeConceptName(question.conceptName))
          : undefined,
        sourceTurnId: turnId,
        text: question.text,
        status: "open",
        priority: question.priority,
        createdAt,
        updatedAt: createdAt,
      });
    }

    const demonstratedConceptCount = args.concepts.filter(
      (concept) => concept.state === "demonstrated",
    ).length;
    await ctx.db.patch("learningSessions", args.sessionId, {
      activeConceptName: args.activeConcept,
      demonstratedConceptCount,
      totalConceptCount: args.concepts.length,
      understandingScore: args.understandingScore,
      updatedAt: createdAt,
    });
    await ctx.db.insert("sessionSnapshots", {
      sessionId: args.sessionId,
      sourceTurnId: turnId,
      understandingScore: args.understandingScore,
      confidenceScore: session.confidenceScore,
      demonstratedConceptCount,
      totalConceptCount: args.concepts.length,
      summary: args.summary,
      model: session.questionModel,
      promptVersion: session.promptVersion,
      createdAt,
    });

    return {
      id: turnId,
      sequence: (latestTurn?.sequence ?? -1) + 1,
      role: "assistant" as const,
      interactionType: args.interactionType,
      content: args.content,
      createdAt,
    };
  },
});

export const updateConfidence = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    confidenceScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }
    if (!Number.isInteger(args.confidenceScore) || args.confidenceScore < 0 || args.confidenceScore > 10) {
      throw new Error("Confidence score is invalid.");
    }

    await ctx.db.patch("learningSessions", args.sessionId, {
      confidenceScore: args.confidenceScore,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const resumeLegacySession = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }
    const hasFullCoverage =
      session.totalConceptCount > 0 &&
      session.demonstratedConceptCount >= session.totalConceptCount;
    if (session.status === "abandoned" || (session.status === "completed" && !hasFullCoverage)) {
      await retractSessionContributions(ctx, args.sessionId);
      await ctx.db.patch("learningSessions", args.sessionId, {
        status: "active",
        completedAt: undefined,
        masteryProcessedAt: undefined,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const completeSession = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }
    if (session.status === "completed") return null;

    const completedAt = Date.now();
    await ctx.db.patch("learningSessions", args.sessionId, {
      status: "completed",
      completedAt,
      updatedAt: completedAt,
    });
    return null;
  },
});

export const deleteSession = internalMutation({
  args: {
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get("learningSessions", args.sessionId);
    if (!session || session.ownerId !== args.ownerId) {
      throw new Error("Session not found.");
    }

    await retractSessionContributions(ctx, args.sessionId);

    const [turns, concepts, evidence, openQuestions, snapshots, retakes, documentSessions] =
      await Promise.all([
        ctx.db
          .query("sessionTurns")
          .withIndex("by_sessionId_and_sequence", (query) =>
            query.eq("sessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("concepts")
          .withIndex("by_sessionId_and_sequence", (query) =>
            query.eq("sessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("evidence")
          .withIndex("by_sessionId_and_createdAt", (query) =>
            query.eq("sessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("openQuestions")
          .withIndex("by_sessionId_and_updatedAt", (query) =>
            query.eq("sessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("sessionSnapshots")
          .withIndex("by_sessionId_and_createdAt", (query) =>
            query.eq("sessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("learningSessions")
          .withIndex("by_retakeOfSessionId", (query) =>
            query.eq("retakeOfSessionId", args.sessionId),
          )
          .collect(),
        ctx.db
          .query("learningSessions")
          .withIndex("by_documentId_and_updatedAt", (query) =>
            query.eq("documentId", session.documentId),
          )
          .collect(),
      ]);

    const deleteDocument = documentSessions.every(
      (documentSession) => documentSession._id === args.sessionId,
    );
    const [document, chunks, embeddings] = deleteDocument
      ? await Promise.all([
          ctx.db.get("documents", session.documentId),
          ctx.db
            .query("documentChunks")
            .withIndex("by_documentId_and_sequence", (query) =>
              query.eq("documentId", session.documentId),
            )
            .collect(),
          ctx.db
            .query("chunkEmbeddings")
            .withIndex("by_documentId_and_model", (query) =>
              query.eq("documentId", session.documentId),
            )
            .collect(),
        ])
      : [null, [], []];

    await Promise.all([
      ...evidence.map((item) => ctx.db.delete("evidence", item._id)),
      ...openQuestions.map((question) =>
        ctx.db.delete("openQuestions", question._id),
      ),
      ...snapshots.map((snapshot) =>
        ctx.db.delete("sessionSnapshots", snapshot._id),
      ),
      ...turns.map((turn) => ctx.db.delete("sessionTurns", turn._id)),
      ...concepts.map((concept) => ctx.db.delete("concepts", concept._id)),
      ...retakes.map((retake) =>
        ctx.db.patch("learningSessions", retake._id, {
          retakeOfSessionId: undefined,
        }),
      ),
      ...embeddings.map((embedding) =>
        ctx.db.delete("chunkEmbeddings", embedding._id),
      ),
      ...chunks.map((chunk) => ctx.db.delete("documentChunks", chunk._id)),
    ]);
    await ctx.db.delete("learningSessions", args.sessionId);
    if (document) {
      if (document.storageId) await ctx.storage.delete(document.storageId);
      await ctx.db.delete("documents", document._id);
    }
    return null;
  },
});
