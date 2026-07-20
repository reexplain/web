import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { internal } from "@/convex/_generated/api";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardRealtime from "@/components/dashboard/DashboardRealtime";
import PdfUploadBox from "@/components/common/PdfUploadBox";
import { getCurrentSession } from "@/lib/current-session";
import { queryConvexInternal } from "@/lib/convex-server";
import { AUTH_DEFAULT_REDIRECT, AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import { DASHBOARD_PAGE_DESCRIPTION, DASHBOARD_PAGE_TITLE } from "@/constants/metadata";

export const generateMetadata = async (): Promise<Metadata> => {
  const session = await getCurrentSession();

  return {
    title: session?.user.name ? `${session.user.name}'s ${DASHBOARD_PAGE_TITLE}` : DASHBOARD_PAGE_TITLE,
    description: DASHBOARD_PAGE_DESCRIPTION,
  };
};

const DashboardPage = async () => {
  const session = await getCurrentSession();

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(AUTH_DEFAULT_REDIRECT)}`,
    );
  }

  const dashboardSnapshot = await queryConvexInternal(
    internal.sessions.getDashboardForOwner,
    { ownerId: session.user.id },
  );

  return (
    <div className="relative left-1/2 flex w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-5 lg:w-[calc(100vw-3rem)] lg:flex-row lg:items-start">
      <DashboardSidebar
        user={{
          email: session.user.email,
          image: session.user.image,
          name: session.user.name,
        }}
      />

      <main className="min-w-0 flex-1 pb-6">
        <div className="flex w-full flex-col gap-14 px-1 py-6 sm:px-4 lg:px-8 lg:pb-8 lg:pt-0 2xl:px-12">
          <header className="flex scroll-mt-8 flex-col gap-3 border-b py-4" id="overview">
            <h1 className="font-secondary text-4xl font-medium">
              Welcome back, {session.user.name}.
            </h1>
            <p className="text-foreground/60">
              Continue a saved session, or bring in a new PDF to start learning.
            </p>
          </header>

          <section className="flex scroll-mt-8 flex-col gap-6" id="new-pdf">
            <div className="flex flex-col gap-1 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
                New material
              </p>
              <h2 className="font-secondary text-3xl font-medium">What are you learning next?</h2>
            </div>
            <div className="w-full">
              <PdfUploadBox
                className="shadow-[7px_7px_0_#d1fae5] dark:shadow-[7px_7px_0_#064e3b]"
                isAuthenticated
              />
            </div>
          </section>

          <DashboardRealtime initialSnapshot={dashboardSnapshot} />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
