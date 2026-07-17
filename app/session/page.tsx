import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ExplainWorkflow from "@/components/common/ExplainWorkflow";
import TopBar from "@/components/common/TopBar";
import { auth } from "@/lib/auth";
import { AUTH_REDIRECT_QUERY_PARAM, SESSION_ROUTE } from "@/utils/constants";

const SessionPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(SESSION_ROUTE)}`,
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex flex-1 py-4 sm:py-6">
        <div className="mx-auto w-full">
          <ExplainWorkflow />
        </div>
      </main>
    </>
  );
};

export default SessionPage;
