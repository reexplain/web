import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ExplainWorkflow from "@/components/common/ExplainWorkflow";
import TopBar from "@/components/common/TopBar";
import { auth } from "@/lib/auth";
import { AUTH_REDIRECT_QUERY_PARAM, EXPLAIN_ROUTE } from "@/utils/constants";
import { LoaderCircle } from "lucide-react";

const ExplainPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(EXPLAIN_ROUTE)}`,
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex flex-1 items-center py-10 sm:py-14 lg:py-16">
        <div className="mx-auto w-full max-w-5xl">
          <ExplainWorkflow />
        </div>
      </main>
    </>
  );
};

export default ExplainPage;
