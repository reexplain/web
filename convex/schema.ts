import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const documentStatus = v.union(
  v.literal("uploading"),
  v.literal("extracting"),
  v.literal("embedding"),
  v.literal("ready"),
  v.literal("failed"),
);

const sessionStatus = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("abandoned"),
);

const turnStatus = v.union(
  v.literal("pending"),
  v.literal("complete"),
  v.literal("failed"),
);

const interactionType = v.union(
  v.literal("explain"),
  v.literal("probe"),
  v.literal("why"),
  v.literal("connect"),
  v.literal("apply"),
  v.literal("challenge"),
  v.literal("hint"),
  v.literal("answer"),
);

const conceptState = v.union(
  v.literal("unexplored"),
  v.literal("developing"),
  v.literal("demonstrated"),
);

export default defineSchema({
  documents: defineTable({
    ownerId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    storageId: v.optional(v.id("_storage")),
    contentHash: v.string(),
    pageCount: v.optional(v.number()),
    status: documentStatus,
    extractionVersion: v.string(),
    failureMessage: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_ownerId_and_updatedAt", ["ownerId", "updatedAt"])
    .index("by_ownerId_and_contentHash", ["ownerId", "contentHash"])
    .index("by_status_and_updatedAt", ["status", "updatedAt"]),

  documentChunks: defineTable({
    documentId: v.id("documents"),
    sequence: v.number(),
    pageStart: v.number(),
    pageEnd: v.number(),
    text: v.string(),
    tokenCount: v.number(),
    contentHash: v.string(),
  })
    .index("by_documentId_and_sequence", ["documentId", "sequence"])
    .index("by_documentId_and_contentHash", ["documentId", "contentHash"]),

  chunkEmbeddings: defineTable({
    documentId: v.id("documents"),
    chunkId: v.id("documentChunks"),
    model: v.string(),
    embedding: v.array(v.float64()),
    createdAt: v.number(),
  })
    .index("by_chunkId", ["chunkId"])
    .index("by_documentId_and_model", ["documentId", "model"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["documentId"],
    }),

  learningSessions: defineTable({
    ownerId: v.string(),
    documentId: v.id("documents"),
    status: sessionStatus,
    activeConceptName: v.optional(v.string()),
    demonstratedConceptCount: v.number(),
    totalConceptCount: v.number(),
    understandingScore: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    retakeOfSessionId: v.optional(v.id("learningSessions")),
    questionModel: v.string(),
    promptVersion: v.string(),
    startedAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    masteryProcessedAt: v.optional(v.number()),
  })
    .index("by_ownerId_and_updatedAt", ["ownerId", "updatedAt"])
    .index("by_ownerId_and_status_and_updatedAt", ["ownerId", "status", "updatedAt"])
    .index("by_documentId_and_updatedAt", ["documentId", "updatedAt"])
    .index("by_retakeOfSessionId", ["retakeOfSessionId"]),

  sessionTurns: defineTable({
    sessionId: v.id("learningSessions"),
    sequence: v.number(),
    role: v.union(v.literal("learner"), v.literal("assistant")),
    interactionType: v.optional(interactionType),
    content: v.string(),
    status: turnStatus,
    requestId: v.optional(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sessionId_and_sequence", ["sessionId", "sequence"])
    .index("by_sessionId_and_requestId", ["sessionId", "requestId"]),

  concepts: defineTable({
    sessionId: v.id("learningSessions"),
    parentConceptId: v.optional(v.id("concepts")),
    name: v.string(),
    description: v.optional(v.string()),
    sequence: v.number(),
    state: conceptState,
    score: v.number(),
    evidenceCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId_and_sequence", ["sessionId", "sequence"])
    .index("by_sessionId_and_state", ["sessionId", "state"]),

  evidence: defineTable({
    sessionId: v.id("learningSessions"),
    turnId: v.id("sessionTurns"),
    conceptId: v.id("concepts"),
    kind: v.union(
      v.literal("supports"),
      v.literal("contradicts"),
      v.literal("uncertain"),
    ),
    claim: v.string(),
    rationale: v.string(),
    strength: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionId_and_createdAt", ["sessionId", "createdAt"])
    .index("by_conceptId_and_createdAt", ["conceptId", "createdAt"])
    .index("by_turnId", ["turnId"]),

  openQuestions: defineTable({
    sessionId: v.id("learningSessions"),
    conceptId: v.optional(v.id("concepts")),
    sourceTurnId: v.optional(v.id("sessionTurns")),
    resolvedTurnId: v.optional(v.id("sessionTurns")),
    text: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("dismissed"),
    ),
    priority: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId_and_status", ["sessionId", "status"])
    .index("by_sessionId_and_updatedAt", ["sessionId", "updatedAt"]),

  sessionSnapshots: defineTable({
    sessionId: v.id("learningSessions"),
    sourceTurnId: v.optional(v.id("sessionTurns")),
    understandingScore: v.number(),
    confidenceScore: v.optional(v.number()),
    demonstratedConceptCount: v.number(),
    totalConceptCount: v.number(),
    summary: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    createdAt: v.number(),
  }).index("by_sessionId_and_createdAt", ["sessionId", "createdAt"]),

  masteryConcepts: defineTable({
    ownerId: v.string(),
    canonicalKey: v.string(),
    name: v.string(),
    description: v.string(),
    embedding: v.array(v.float64()),
    confidenceScore: v.number(),
    weightedScoreSum: v.number(),
    totalWeight: v.number(),
    evidenceCount: v.number(),
    sessionCount: v.number(),
    sourceDocumentIds: v.array(v.id("documents")),
    lastPracticedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId_and_updatedAt", ["ownerId", "updatedAt"])
    .index("by_ownerId_and_canonicalKey", ["ownerId", "canonicalKey"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["ownerId"],
    }),

  masteryEdges: defineTable({
    ownerId: v.string(),
    sourceConceptId: v.id("masteryConcepts"),
    targetConceptId: v.id("masteryConcepts"),
    relationship: v.literal("related"),
    similarity: v.number(),
    strength: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_sourceConceptId", ["sourceConceptId"])
    .index("by_targetConceptId", ["targetConceptId"])
    .index("by_sourceConceptId_and_targetConceptId", ["sourceConceptId", "targetConceptId"]),

  masteryContributions: defineTable({
    ownerId: v.string(),
    sessionId: v.id("learningSessions"),
    masteryConceptId: v.id("masteryConcepts"),
    sourceDocumentId: v.id("documents"),
    score: v.number(),
    weight: v.number(),
    evidenceCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_masteryConceptId", ["masteryConceptId"])
    .index("by_ownerId", ["ownerId"]),
});