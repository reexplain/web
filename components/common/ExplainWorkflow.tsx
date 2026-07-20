"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readApiResponse } from "@/lib/api-response";
import { clearStagedPdf, getStagedPdf } from "@/lib/staged-pdf";
import SessionWorkspace from "@/components/common/SessionWorkspace";
import type { ExplainWorkflowProps, ExtractionResult } from "@/types/pdf";

const PROCESSING_STAGES = [
  "Reading your PDF",
  "Extracting document structure",
  "Extracting key concepts",
] as const;
const PROCESSING_STAGE_DURATION_MS = 3_500;
const isRejectedPdf = (message: string) =>
  message.includes("learning material") || message.includes("extractable text");

const ExplainWorkflow = ({ existingSessionId, initialView }: ExplainWorkflowProps) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [isPdfRejected, setIsPdfRejected] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);

  useEffect(() => {
    if (existingSessionId) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    const extractPdf = async () => {
      setError("");
      setIsPdfRejected(false);
      setResult(null);

      try {
        const file = await getStagedPdf();

        if (!file) {
          throw new Error("Choose a PDF from the home page to begin.");
        }

        const form = new FormData();
        form.set("file", file, file.name);

        const response = await fetch("/api/pdf/extract", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        const body = (await readApiResponse(
          response,
          "The PDF could not be extracted.",
        )) as Record<string, unknown>;

        await clearStagedPdf();

        if (active) {
          setResult({
            filename: body.filename as string,
            pageCount: body.page_count as number,
            documentId: body.document_id as string,
            learningSessionId: body.learning_session_id as string,
          });
        }
      } catch (error) {
        if (active && !controller.signal.aborted) {
          const message = error instanceof Error ? error.message : "";
          const rejectedPdf = isRejectedPdf(message);
          setIsPdfRejected(rejectedPdf);
          setError(
            rejectedPdf
              ? message
              : "Something went wrong while preparing your learning session. Please try again.",
          );
        }
      }
    };

    void extractPdf();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, existingSessionId]);

  useEffect(() => {
    if (existingSessionId || result || error) return;

    const interval = window.setInterval(() => {
      setProcessingStage((current) => (current + 1) % PROCESSING_STAGES.length);
    }, PROCESSING_STAGE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [error, existingSessionId, result]);

  if (existingSessionId) {
    return (
      <SessionWorkspace
        initialView={initialView}
        learningSessionId={existingSessionId}
      />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-5 border-l-2 border-destructive px-5 py-2 m-auto">
        <div className="flex flex-col gap-2">
          <h1 className="font-secondary text-3xl font-medium">Something went wrong</h1>
          <p className="leading-relaxed text-foreground/60" role="alert">{error}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isPdfRejected ? (
            <Button onClick={() => setAttempt((current) => current + 1)}>
              <RotateCcw aria-hidden="true" data-icon="inline-start" />
              Try again
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/">Choose another PDF</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <SessionWorkspace
        filename={result.filename}
        learningSessionId={result.learningSessionId}
        pageCount={result.pageCount}
      />
    );
  }

  return (
    <div className="flex max-w-xl items-start gap-5 m-auto" role="status">
      <span className="sr-only">
        Preparing your PDF for a learning session. This usually takes about a minute.
      </span>
      <LoaderCircle
        aria-hidden="true"
        className="size-9 shrink-0 animate-spin text-emerald-500 motion-reduce:animate-none"
        strokeWidth={1.7}
      />
      <div className="flex flex-col gap-2">
        <h1
          aria-hidden="true"
          className="font-secondary text-3xl font-medium sm:text-4xl"
        >
          {PROCESSING_STAGES[processingStage]}
        </h1>
        <p className="leading-relaxed text-foreground/60">
          Preparing your learning session. This usually takes about a minute.
        </p>
      </div>
    </div>
  );
};

export default ExplainWorkflow;
