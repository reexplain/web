import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TopBar from "@/components/common/TopBar";
import PdfUploadBox from "@/components/common/PdfUploadBox";
import { getCurrentSession } from "@/lib/current-session";
import { APP_DESCRIPTION } from "@/constants/app";
import { AUTH_DEFAULT_REDIRECT } from "@/constants/auth";
import { HOME_PAGE_DESCRIPTION, HOME_PAGE_TITLE } from "@/constants/metadata";

export const metadata: Metadata = {
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
};

const Home = async () => {
  const session = await getCurrentSession();

  if (session) {
    redirect(AUTH_DEFAULT_REDIRECT);
  }

  return (
    <>
      <TopBar />
      <main className="flex flex-1 flex-col justify-center py-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {/* <p className="text-xs font-medium uppercase tracking-[0.18em]">
                Read less passively
              </p> */}
              <h1 className="font-secondary text-4xl font-medium leading-[0.98] sm:text-6xl lg:text-7xl">
                Find out what you
                <span className="text-emerald-500"> actually understand.</span>
              </h1>
            </div>
            <p className="text-base leading-relaxed text-foreground/60 sm:text-lg">
              {APP_DESCRIPTION}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <PdfUploadBox isAuthenticated={false} />
            <div className="flex flex-wrap gap-2 text-xs text-foreground/50">
              <span>Powered by OpenAI</span>
              {/* <span>Private by default</span> */}
              {/* <span>PDF · 20 MB max</span> */}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
