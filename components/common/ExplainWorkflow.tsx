"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearStagedPdf, getStagedPdf } from "@/lib/staged-pdf";

type ExtractionResult = {
  filename: string;
  pageCount: number;
};

const ExplainWorkflow = () => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const extractPdf = async () => {
      setError("");
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
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? "The PDF could not be extracted.");
        }

        await clearStagedPdf();

        if (active) {
          setResult({ filename: body.filename, pageCount: body.page_count });
        }
      } catch (extractionError) {
        if (active && !controller.signal.aborted) {
          setError(
            extractionError instanceof Error
              ? extractionError.message
              : "The PDF could not be extracted.",
          );
        }
      }
    };

    void extractPdf();

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  if (error) {
    return (
      <div className="flex max-w-xl flex-col gap-5 border-l-2 border-destructive px-5 py-2">
        <div className="flex flex-col gap-2">
          <h1 className="font-secondary text-3xl font-medium">Extraction stopped</h1>
          <p className="leading-relaxed text-foreground/60" role="alert">{error}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setAttempt((current) => current + 1)}>
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Choose another PDF</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex max-w-2xl flex-col gap-6" aria-live="polite">
        <div className="grid size-14 place-items-center bg-emerald-500 text-white">
          <Check aria-hidden="true" className="size-7" strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase text-emerald-600">Extraction complete</p>
          <h1 className="font-secondary text-4xl font-medium sm:text-6xl">
            Your explanation workspace is next.
          </h1>
          <p className="leading-relaxed text-foreground/60">
            {result.filename} · {result.pageCount} {result.pageCount === 1 ? "page" : "pages"}
          </p>
        </div>
        <div className="border-l-2 border-emerald-500 px-5 py-2 text-foreground/60">
          The extracted document is ready. The explanation interface will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-xl items-start gap-5" role="status" aria-live="polite">
      <LoaderCircle
        aria-hidden="true"
        className="size-9 shrink-0 animate-spin text-emerald-500 motion-reduce:animate-none"
        strokeWidth={1.7}
      />
      <div className="flex flex-col gap-2">
        <h1 className="font-secondary text-3xl font-medium sm:text-4xl">
          Reading your PDF
        </h1>
        <p className="leading-relaxed text-foreground/60">
          Extracting the document text and page structure.
        </p>
      </div>
    </div>
  );
};

export default ExplainWorkflow;
