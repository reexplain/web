"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import PracticeActivityPair from "@/components/dashboard/PracticeActivityPair";
import { Button } from "@/components/ui/button";
import { PRACTICE_ROUTE } from "@/constants/routes";
import type { PracticeConceptsProps } from "@/types/dashboard";

const PracticeConcepts = ({ excerpts }: PracticeConceptsProps) => {
  return (
    <section className="flex scroll-mt-40 flex-col gap-5 lg:scroll-mt-8" id="practice">
      <div className="flex flex-col items-start justify-between gap-1 border-b pb-4 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            Learning lab
          </p>
          <h2 className="font-secondary text-3xl font-medium">Practice concepts</h2>
        </div>
        <p className="py-1 text-sm text-foreground/55">Test your knowledge</p>
      </div>

      {excerpts.length > 0 ? (
        <div className="flex flex-col gap-4">
          <PracticeActivityPair excerpts={excerpts} />
          <div className="flex justify-end">
            <Button asChild variant="outline">
              <Link href={PRACTICE_ROUTE}>
                Show all
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <DashboardEmptyState
          description="Save a session after discussing a concept to create practice from it."
          icon={BookOpenCheck}
          title="Discuss a concept to unlock practice"
        />
      )}
    </section>
  );
};

export default PracticeConcepts;
