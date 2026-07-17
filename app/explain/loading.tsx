import { LoaderCircle } from "lucide-react";

const ExplainLoading = () => (
    <main className="flex h-full m-auto items-center justify-center font-medium gap-2" role="status">
        <LoaderCircle
            aria-label="Loading explanation"
            className="size-9 animate-spin text-emerald-500 motion-reduce:animate-none"
            strokeWidth={1.7}
        />
        Loading...
    </main>
);

export default ExplainLoading;
