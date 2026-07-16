import { headers } from "next/headers";
import { redirect } from "next/navigation";
import TopBar from "@/components/common/TopBar";
import { auth } from "@/lib/auth";
import {
  APP_NAME,
  AUTH_DEFAULT_REDIRECT,
  AUTH_REDIRECT_QUERY_PARAM,
} from "@/utils/constants";

const DashboardPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(
      `/?${AUTH_REDIRECT_QUERY_PARAM}=${encodeURIComponent(AUTH_DEFAULT_REDIRECT)}`,
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col justify-center py-10 sm:py-14 lg:py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-500">
            {APP_NAME} dashboard
          </p>
          <h1 className="font-secondary text-4xl font-medium sm:text-6xl">
            Welcome back, {session.user.name}.
          </h1>
          <p className="text-foreground/60">
            Your saved learning sessions will appear here.
          </p>
        </div>
      </main>
    </>
  );
};

export default DashboardPage;