import { APP_NAME } from "@/constants/app";
import AuthControls from "@/components/common/AuthControls";
import ThemeToggle from "@/components/common/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { getCurrentSession } from "@/lib/current-session";

const TopBar = async () => {
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
                <ThemeToggle />
                <AuthControls isAuthenticated={Boolean(session)} />
            </div>
        </div>
    )
}

export default TopBar;
