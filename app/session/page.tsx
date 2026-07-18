import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ExplainWorkflow from "@/components/common/ExplainWorkflow";
import TopBar from "@/components/common/TopBar";
import { getCurrentSession } from "@/lib/current-session";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { NEW_SESSION_PAGE_TITLE, SESSION_PAGE_DESCRIPTION, SESSION_PAGE_TITLE } from "@/constants/metadata";
import { SESSION_ROUTE } from "@/constants/routes";
import type { SessionPageProps } from "@/types/session";

export const generateMetadata = async (
  { searchParams = Promise.resolve({}) }: Partial<SessionPageProps> = {},
): Promise<Metadata> => {
  const requestedId = (await searchParams).id;

  return {
    title: typeof requestedId === "string" ? SESSION_PAGE_TITLE : NEW_SESSION_PAGE_TITLE,
    description: SESSION_PAGE_DESCRIPTION,
  };
};

const SessionPage = async (
  { searchParams = Promise.resolve({}) }: Partial<SessionPageProps> = {},
) => {
  const session = await getCurrentSession();

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(SESSION_ROUTE)}`,
    );
  }

  const requestedId = (await searchParams).id;
  const existingSessionId = typeof requestedId === "string" ? requestedId : undefined;

  return (
    <>
      <TopBar />
      <main className="flex flex-1 py-4 sm:py-6">
        <div className="m-auto">
          <ExplainWorkflow existingSessionId={existingSessionId} />
        </div>
      </main>
    </>
  );
};

export default SessionPage;
