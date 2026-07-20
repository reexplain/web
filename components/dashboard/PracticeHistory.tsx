import { BookOpenCheck } from "lucide-react";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import PracticeActivityPair from "@/components/dashboard/PracticeActivityPair";
import { PRACTICE_GENERATED_AT_FORMATTER } from "@/constants/dashboard";
import type { PracticeHistoryProps } from "@/types/dashboard";
import { getLearningItemCount } from "@/utils/practice/get-learning-item-count";

const PracticeHistory = ({ batches }: PracticeHistoryProps) => {
  const orderedBatches = [...batches].sort(
    (left, right) => right.generatedAt - left.generatedAt,
  );

  if (orderedBatches.length === 0) {
    return (
      <DashboardEmptyState
        description="Save a learning session to generate your first practice activities."
        icon={BookOpenCheck}
        title="No practice concepts yet"
      />
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {orderedBatches.map((batch) => {
        const headingId = `practice-batch-${batch.id}`;
        const generatedAt = new Date(batch.generatedAt);
        const learningItemCount = getLearningItemCount(batch.excerpts.length);

        return (
          <section aria-labelledby={headingId} className="flex flex-col gap-5" key={batch.id}>
            <header className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-500">
                  {learningItemCount} {learningItemCount === 1 ? "learning item" : "learning items"}
                </p>
                <h2 className="truncate font-secondary text-2xl font-medium" id={headingId}>
                  {batch.filename}
                </h2>
              </div>
              <time
                className="shrink-0 text-sm text-foreground/50"
                dateTime={generatedAt.toISOString()}
              >
                Generated {PRACTICE_GENERATED_AT_FORMATTER.format(generatedAt)}
              </time>
            </header>
            <PracticeActivityPair excerpts={batch.excerpts} />
          </section>
        );
      })}
    </div>
  );
};

export default PracticeHistory;
