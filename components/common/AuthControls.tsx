"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/common/LoginDialog";
import type { AuthControlsProps } from "@/types/auth";

const AuthControls = ({ isAuthenticated }: AuthControlsProps) => {
    const router = useRouter();

    if (isAuthenticated) {
        return (
            <Button
                variant="outline"
                className="font-secondary uppercase"
                onClick={async () => {
                    await authClient.signOut();
                    router.replace("/");
                    router.refresh();
                }}
            >
                <LogOut aria-hidden="true" data-icon="inline-start" />
                Sign out
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
