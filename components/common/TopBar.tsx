import { Github } from "lucide-react";
import { APP_NAME, GITHUB_REPOSITORY_URL } from "@/constants/app";
import AuthControls from "@/components/common/AuthControls";
import ThemeToggle from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { getCurrentSession } from "@/lib/current-session";
import type { TopBarProps } from "@/types/layout";

const TopBar = async ({ showGithub = false }: TopBarProps = {}) => {
    const session = await getCurrentSession();

    return (
        <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={Boolean(session) ? "/dashboard" : "/"}>
                <div className="flex items-center justify-center gap-3.5 w-fit">
                    <Image src="/logo.svg" alt={`${APP_NAME} Logo`} width={32} height={32} />
                    <div className="font-secondary text-xl font-medium">{APP_NAME}</div>
                </div>
            </Link>
            <div className="flex items-center gap-2">
                {showGithub ? (
                    <Button asChild size="icon" title="View ReExplain on GitHub" variant="outline">
                        <a
                            aria-label="View ReExplain on GitHub"
                            href={GITHUB_REPOSITORY_URL}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <Github aria-hidden="true" />
                        </a>
                    </Button>
                ) : null}
                <ThemeToggle />
                {!session ? <AuthControls isAuthenticated={false} /> : null}
            </div>
        </div>
    )
}

export default TopBar;
