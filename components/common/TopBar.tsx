import { APP_NAME } from "@/utils/constants";
import AuthControls from "@/components/common/AuthControls";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const TopBar = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    return (
        <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href={Boolean(session) ? "/dashboard" : "/"}>
                <div className="flex items-center justify-center gap-3.5 w-fit">
                    <Image src="/logo.svg" alt={`${APP_NAME} Logo`} width={32} height={32} />
                    <div className="font-secondary text-xl font-medium">{APP_NAME}</div>
                </div>
            </Link>
            <AuthControls isAuthenticated={Boolean(session)} />
        </div>
    )
}

export default TopBar;