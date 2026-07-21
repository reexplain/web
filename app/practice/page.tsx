import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TopBar from "@/components/common/TopBar";
import PracticeHistory from "@/components/dashboard/PracticeHistory";
import { Button } from "@/components/ui/button";
import { internal } from "@/convex/_generated/api";
import { AUTH_REDIRECT_QUERY_PARAM } from "@/constants/auth";
import {
  PRACTICE_PAGE_DESCRIPTION,
  PRACTICE_PAGE_TITLE,
} from "@/constants/metadata";
import { PRACTICE_ROUTE } from "@/constants/routes";
import { getCurrentSession } from "@/lib/current-session";
import { queryConvexInternal } from "@/lib/convex-server";

export const metadata: Metadata = {
  title: PRACTICE_PAGE_TITLE,
  description: PRACTICE_PAGE_DESCRIPTION,
};

const PracticePage = async () => {
  const session = await getCurrentSession();

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(PRACTICE_ROUTE)}`,
    );
  }

  const batches = await queryConvexInternal(
    internal.sessions.getPracticeHistoryForOwner,
    { ownerId: session.user.id },
  );

  return (
    <>
      <TopBar />
      <main className="mx-auto flex w-full max-w-[1536px] flex-col gap-10 py-6 lg:py-10">
        <header className="flex flex-col gap-6 border-b pb-6">
          <div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">
                <ArrowLeft aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
              Learning lab
            </p>
            <h1 className="font-secondary text-4xl font-medium sm:text-5xl">
              Practice concepts
            </h1>
            <p className="max-w-2xl text-foreground/55">
              Review every generated practice set, starting with the latest.
            </p>
          </div>
        </header>
        <PracticeHistory batches={batches} />
      </main>
    </>
  );
};

export default PracticePage;
