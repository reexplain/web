import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { auth } from "@/lib/auth";
import { mutateConvexInternal, queryConvexInternal } from "@/lib/convex-server";
import {
  callReExplainApi,
  isEmbeddingResult,
  isLearningTurnResult,
  ReExplainApiError,
} from "@/lib/reexplain-api";
import { MAX_PDF_SIZE_BYTES, PDF_CONTENT_TYPE } from "@/constants/pdf";

const EXTRACTION_VERSION = "pypdf-pages-v1";
const PROMPT_VERSION = "learning-session-v1";
const MAX_CHUNK_CHARACTERS = 12_000;
const CHUNK_BATCH_SIZE = 20;

type ExtractedPage = {
  page_number: number;
  text: string;
};

type ExtractedPdf = {
  filename: string;
  page_count: number;
  pages: ExtractedPage[];
};

type PersistedChunk = {
  sequence: number;
  pageStart: number;
  pageEnd: number;
  text: string;
  tokenCount: number;
  contentHash: string;
};

export const runtime = "nodejs";

const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

const splitPageText = (text: string) => {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > MAX_CHUNK_CHARACTERS) {
    const candidate = remaining.slice(0, MAX_CHUNK_CHARACTERS);
    const breakAt = Math.max(candidate.lastIndexOf("\n"), candidate.lastIndexOf(" "));
    const chunkEnd = breakAt > 0 ? breakAt : MAX_CHUNK_CHARACTERS;
    chunks.push(remaining.slice(0, chunkEnd).trim());
    remaining = remaining.slice(chunkEnd).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
};

const buildChunks = (pages: ExtractedPage[]): PersistedChunk[] => {
  let sequence = 0;

  return pages.flatMap((page) =>
    splitPageText(page.text).map((text) => ({
      sequence: sequence++,
      pageStart: page.page_number,
      pageEnd: page.page_number,
      text,
      tokenCount: Math.ceil(text.length / 4),
      contentHash: sha256(text),
    })),
  );
};

const isExtractedPdf = (value: unknown): value is ExtractedPdf => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ExtractedPdf>;
  return (
    typeof candidate.filename === "string" &&
    typeof candidate.page_count === "number" &&
    Array.isArray(candidate.pages) &&
    candidate.pages.every(
      (page) =>
        typeof page?.page_number === "number" && typeof page.text === "string",
    )
  );
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  if (file.type !== PDF_CONTENT_TYPE) {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json(
      { error: "PDF files must be 20 MB or smaller." },
      { status: 413 },
    );
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", file, file.name);

  try {
    const body = await callReExplainApi(
      "/api/v1/pdf/extract",
      {
      method: "POST",
      body: upstreamForm,
      },
      isExtractedPdf,
    );

    const ownerId = session.user.id;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadUrl = await mutateConvexInternal(
      internal.documents.generateUploadUrl,
      {},
    );
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": PDF_CONTENT_TYPE },
      body: fileBuffer,
    });
    const uploadBody: unknown = await uploadResponse.json();

    if (
      !uploadResponse.ok ||
      !uploadBody ||
      typeof uploadBody !== "object" ||
      !("storageId" in uploadBody) ||
      typeof uploadBody.storageId !== "string"
    ) {
      throw new Error("The original PDF could not be stored.");
    }

    const documentId = await mutateConvexInternal(
      internal.documents.beginIngestion,
      {
        ownerId,
        filename: body.filename,
        contentType: PDF_CONTENT_TYPE,
        sizeBytes: file.size,
        storageId: uploadBody.storageId as Id<"_storage">,
        contentHash: sha256(fileBuffer),
        pageCount: body.page_count,
        extractionVersion: EXTRACTION_VERSION,
      },
    );

    try {
      const chunks = buildChunks(body.pages);
      if (chunks.length === 0) {
        throw new ReExplainApiError("The PDF does not contain extractable text.", 422);
      }

      for (let index = 0; index < chunks.length; index += CHUNK_BATCH_SIZE) {
        await mutateConvexInternal(internal.documents.appendChunks, {
          ownerId,
          documentId,
          chunks: chunks.slice(index, index + CHUNK_BATCH_SIZE),
        });
      }

      const learningSessionId = await mutateConvexInternal(
        internal.documents.completeIngestion,
        {
          ownerId,
          documentId,
          questionModel: process.env.REEXPLAIN_QUESTION_MODEL ?? "gpt-5.4",
          promptVersion: PROMPT_VERSION,
        },
      );

      let afterSequence: number | undefined;
      while (true) {
        const embeddingInputs = await queryConvexInternal(
          internal.documents.listEmbeddingInputs,
          { ownerId, documentId, afterSequence },
        );
        if (embeddingInputs.length === 0) {
          break;
        }

        const embeddingResult = await callReExplainApi(
          "/api/v1/learning/embeddings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: embeddingInputs.map((item) => item.text) }),
          },
          isEmbeddingResult,
        );
        if (embeddingResult.embeddings.length !== embeddingInputs.length) {
          throw new ReExplainApiError(
            "The embedding service returned an invalid response.",
            502,
          );
        }

        await mutateConvexInternal(internal.documents.appendEmbeddings, {
          ownerId,
          documentId,
          model: embeddingResult.model,
          embeddings: embeddingInputs.map((item, index) => ({
            chunkId: item.id,
            embedding: embeddingResult.embeddings[index],
          })),
        });
        afterSequence = embeddingInputs.at(-1)?.sequence;
      }

      await mutateConvexInternal(internal.documents.completeEmbeddings, {
        ownerId,
        documentId,
      });

      const generationContext = await queryConvexInternal(
        internal.sessions.getGenerationContext,
        { ownerId, sessionId: learningSessionId },
      );
      if (!generationContext || generationContext.documentChunks.length === 0) {
        throw new Error("Learning context could not be prepared.");
      }

      const initialTurn = await callReExplainApi(
        "/api/v1/learning/turn",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_chunks: generationContext.documentChunks,
            history: generationContext.history,
            learner_response: null,
            safety_identifier: sha256(`reexplain:${ownerId}`),
          }),
        },
        isLearningTurnResult,
      );
      await mutateConvexInternal(internal.sessions.applyModelResult, {
        ownerId,
        sessionId: learningSessionId,
        requestId: "initial-v1",
        content: initialTurn.content,
        interactionType: initialTurn.interaction_type,
        activeConcept: initialTurn.active_concept,
        concepts: initialTurn.concepts,
        evidence: initialTurn.evidence.map((item) => ({
          conceptName: item.concept_name,
          kind: item.kind,
          claim: item.claim,
          rationale: item.rationale,
          strength: item.strength,
        })),
        openQuestions: initialTurn.open_questions.map((item) => ({
          conceptName: item.concept_name ?? undefined,
          text: item.text,
          priority: item.priority,
        })),
        understandingScore: initialTurn.understanding_score,
        summary: initialTurn.summary,
      });

      return NextResponse.json({
        filename: body.filename,
        page_count: body.page_count,
        document_id: documentId,
        learning_session_id: learningSessionId,
      });
    } catch (error) {
      await mutateConvexInternal(internal.documents.failIngestion, {
        ownerId,
        documentId,
        failureMessage: "Document ingestion did not complete.",
      }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    if (error instanceof ReExplainApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Document processing is currently unavailable." },
      { status: 503 },
    );
  }
}
