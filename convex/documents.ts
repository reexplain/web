import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const chunk = v.object({
  sequence: v.number(),
  pageStart: v.number(),
  pageEnd: v.number(),
  text: v.string(),
  tokenCount: v.number(),
  contentHash: v.string(),
});

const chunkEmbedding = v.object({
  chunkId: v.id("documentChunks"),
  embedding: v.array(v.float64()),
});

export const generateUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

export const beginIngestion = internalMutation({
  args: {
    ownerId: v.string(),
    filename: v.string(),
    contentType: v.string(),
    sizeBytes: v.number(),
    storageId: v.id("_storage"),
    contentHash: v.string(),
    pageCount: v.number(),
    extractionVersion: v.string(),
  },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    return ctx.db.insert("documents", {
      ...args,
      status: "extracting",
      updatedAt: Date.now(),
    });
  },
});

export const appendChunks = internalMutation({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
    chunks: v.array(chunk),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);

    if (!document || document.ownerId !== args.ownerId) {
      throw new Error("Document not found.");
    }

    if (document.status !== "extracting") {
      throw new Error("Document is not accepting chunks.");
    }

    for (const documentChunk of args.chunks) {
      await ctx.db.insert("documentChunks", {
        documentId: args.documentId,
        ...documentChunk,
      });
    }

    return null;
  },
});

export const completeIngestion = internalMutation({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
    questionModel: v.string(),
    promptVersion: v.string(),
  },
  returns: v.id("learningSessions"),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);

    if (!document || document.ownerId !== args.ownerId) {
      throw new Error("Document not found.");
    }

    if (document.status !== "extracting") {
      throw new Error("Document ingestion is not in progress.");
    }

    const now = Date.now();
    await ctx.db.patch("documents", args.documentId, {
      status: "embedding",
      updatedAt: now,
    });

    return ctx.db.insert("learningSessions", {
      ownerId: args.ownerId,
      documentId: args.documentId,
      status: "active",
      demonstratedConceptCount: 0,
      totalConceptCount: 0,
      questionModel: args.questionModel,
      promptVersion: args.promptVersion,
      startedAt: now,
      updatedAt: now,
    });
  },
});

export const listEmbeddingInputs = internalQuery({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
    afterSequence: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.id("documentChunks"),
      sequence: v.number(),
      text: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);
    if (!document || document.ownerId !== args.ownerId) {
      throw new Error("Document not found.");
    }
    if (document.status !== "embedding") {
      throw new Error("Document is not accepting embeddings.");
    }

    const chunks = await ctx.db
      .query("documentChunks")
      .withIndex("by_documentId_and_sequence", (query) => {
        const documentQuery = query.eq("documentId", args.documentId);
        return args.afterSequence === undefined
          ? documentQuery
          : documentQuery.gt("sequence", args.afterSequence);
      })
      .order("asc")
      .take(20);

    return chunks.map((documentChunk) => ({
      id: documentChunk._id,
      sequence: documentChunk.sequence,
      text: documentChunk.text,
    }));
  },
});

export const appendEmbeddings = internalMutation({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
    model: v.string(),
    embeddings: v.array(chunkEmbedding),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);
    if (!document || document.ownerId !== args.ownerId) {
      throw new Error("Document not found.");
    }
    if (document.status !== "embedding") {
      throw new Error("Document is not accepting embeddings.");
    }

    for (const item of args.embeddings) {
      if (item.embedding.length !== 1536) {
        throw new Error("Embedding dimensions are invalid.");
      }
      const documentChunk = await ctx.db.get("documentChunks", item.chunkId);
      if (!documentChunk || documentChunk.documentId !== args.documentId) {
        throw new Error("Document chunk not found.");
      }
      const existing = await ctx.db
        .query("chunkEmbeddings")
        .withIndex("by_chunkId", (query) => query.eq("chunkId", item.chunkId))
        .unique();
      if (!existing) {
        await ctx.db.insert("chunkEmbeddings", {
          documentId: args.documentId,
          chunkId: item.chunkId,
          model: args.model,
          embedding: item.embedding,
          createdAt: Date.now(),
        });
      }
    }

    return null;
  },
});

export const completeEmbeddings = internalMutation({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);
    if (!document || document.ownerId !== args.ownerId) {
      throw new Error("Document not found.");
    }
    if (document.status !== "embedding") {
      throw new Error("Document embedding is not in progress.");
    }

    const [chunks, embeddings] = await Promise.all([
      ctx.db
        .query("documentChunks")
        .withIndex("by_documentId_and_sequence", (query) =>
          query.eq("documentId", args.documentId),
        )
        .collect(),
      ctx.db
        .query("chunkEmbeddings")
        .withIndex("by_documentId_and_model", (query) =>
          query.eq("documentId", args.documentId),
        )
        .collect(),
    ]);
    if (chunks.length === 0 || chunks.length !== embeddings.length) {
      throw new Error("Document embeddings are incomplete.");
    }

    await ctx.db.patch("documents", args.documentId, {
      status: "ready",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const failIngestion = internalMutation({
  args: {
    ownerId: v.string(),
    documentId: v.id("documents"),
    failureMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const document = await ctx.db.get("documents", args.documentId);

    if (document?.ownerId === args.ownerId) {
      await ctx.db.patch("documents", args.documentId, {
        status: "failed",
        failureMessage: args.failureMessage,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const listForOwner = internalQuery({
  args: {
    ownerId: v.string(),
  },
  returns: v.array(
    v.object({
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
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_ownerId_and_updatedAt", (query) =>
        query.eq("ownerId", args.ownerId),
      )
      .order("desc")
      .take(20);

    return documents.map((document) => ({
      id: document._id,
      filename: document.filename,
      pageCount: document.pageCount,
      status: document.status,
      updatedAt: document.updatedAt,
    }));
  },
});

export const cleanupOrphanedDocuments = internalMutation({
  args: {},
  returns: v.object({
    documents: v.number(),
    chunks: v.number(),
    embeddings: v.number(),
  }),
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").take(50);
    const staleBefore = Date.now() - 30 * 60 * 1000;
    let deletedDocuments = 0;
    let deletedChunks = 0;
    let deletedEmbeddings = 0;

    for (const document of documents) {
      const isTerminal = document.status === "ready" || document.status === "failed";
      if (!isTerminal && document.updatedAt >= staleBefore) continue;

      const session = await ctx.db
        .query("learningSessions")
        .withIndex("by_documentId_and_updatedAt", (query) =>
          query.eq("documentId", document._id),
        )
        .first();
      if (session) continue;

      const [chunks, embeddings] = await Promise.all([
        ctx.db
          .query("documentChunks")
          .withIndex("by_documentId_and_sequence", (query) =>
            query.eq("documentId", document._id),
          )
          .collect(),
        ctx.db
          .query("chunkEmbeddings")
          .withIndex("by_documentId_and_model", (query) =>
            query.eq("documentId", document._id),
          )
          .collect(),
      ]);

      await Promise.all([
        ...embeddings.map((embedding) =>
          ctx.db.delete("chunkEmbeddings", embedding._id),
        ),
        ...chunks.map((chunk) => ctx.db.delete("documentChunks", chunk._id)),
      ]);
      if (document.storageId) await ctx.storage.delete(document.storageId);
      await ctx.db.delete("documents", document._id);
      deletedDocuments += 1;
      deletedChunks += chunks.length;
      deletedEmbeddings += embeddings.length;
    }

    return {
      documents: deletedDocuments,
      chunks: deletedChunks,
      embeddings: deletedEmbeddings,
    };
  },
});