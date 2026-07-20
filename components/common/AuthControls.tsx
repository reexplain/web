"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/common/LoginDialog";
import type { AuthControlsProps } from "@/types/auth";

const AuthControls = ({ iconOnly = false, isAuthenticated }: AuthControlsProps) => {
    const router = useRouter();

    if (isAuthenticated) {
        return (
            <Button
                aria-label={iconOnly ? "Sign out" : undefined}
                variant="outline"
                className="font-secondary uppercase"
                size={iconOnly ? "icon" : "default"}
                title={iconOnly ? "Sign out" : undefined}
                onClick={async () => {
                    await authClient.signOut();
                    router.replace("/");
                    router.refresh();
                }}
            >
                <LogOut aria-hidden="true" data-icon="inline-start" />
                {iconOnly ? <span className="sr-only">Sign out</span> : "Sign out"}
            </Button>
        );
    }

    return (
        <LoginDialog
            trigger={
                <Button className="font-secondary uppercase" variant="outline">
                    Login
                </Button>
            }
        />
    );
};

export default AuthControls;
