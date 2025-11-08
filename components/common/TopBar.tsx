import { APP_NAME } from "@/utils/constants";
import Image from "next/image";

const TopBar = () => {
    return (
        <div className="flex items-center justify-center gap-2 w-fit">
            <Image src="/logo.svg" alt={`${APP_NAME} Logo`} width={36} height={36} />
            <div className="font-(family-name:--secondary-font) text-xl font-medium">ReExplain</div>
        </div>
    )
}

export default TopBar;