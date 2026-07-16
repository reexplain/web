import { APP_NAME } from "@/utils/constants";
import AuthControls from "@/components/common/AuthControls";
import Image from "next/image";

const TopBar = () => {
    return (
        <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3.5 w-fit">
                <Image src="/logo.svg" alt={`${APP_NAME} Logo`} width={32} height={32} />
                <div className="font-secondary text-xl font-medium">{APP_NAME}</div>
            </div>
            <AuthControls />
        </div>
    )
}

export default TopBar;