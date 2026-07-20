import type { DashboardEmptyStateProps } from "@/types/dashboard";

const DashboardEmptyState = ({
  description,
  icon: Icon,
  title,
}: DashboardEmptyStateProps) => (
  <div className="flex min-h-44 items-center gap-4 border border-dashed bg-background p-6">
    <span className="grid size-11 shrink-0 place-items-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
    </span>
    <div className="flex flex-col gap-1">
      <h3 className="font-secondary text-lg font-medium">{title}</h3>
      <p className="text-sm text-foreground/55">{description}</p>
    </div>
  </div>
);

export default DashboardEmptyState;
