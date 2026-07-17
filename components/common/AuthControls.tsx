"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
    AUTH_DEFAULT_REDIRECT,
    AUTH_REDIRECT_QUERY_PARAM,
    LOGIN_DIALOG_DESCRIPTION,
    LOGIN_DIALOG_TITLE,
} from "@/utils/constants";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

const getSafeCallbackURL = () => {
    const redirectTarget = new URLSearchParams(window.location.search).get(
        AUTH_REDIRECT_QUERY_PARAM,
    );

    if (!redirectTarget) {
        return AUTH_DEFAULT_REDIRECT;
    }

    try {
        const callbackURL = new URL(redirectTarget, window.location.origin);

        if (callbackURL.origin !== window.location.origin) {
            return AUTH_DEFAULT_REDIRECT;
        }

        return `${callbackURL.pathname}${callbackURL.search}${callbackURL.hash}`;
    } catch {
        return AUTH_DEFAULT_REDIRECT;
    }
};

const AuthControls = () => {
    const { data: session } = authClient.useSession();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState("");

    const signInWithGoogle = async () => {
        setError("");
        setIsSigningIn(true);

        try {
            const result = await authClient.signIn.social({
                provider: "google",
                callbackURL: getSafeCallbackURL(),
                errorCallbackURL: "/?authError=google",
            });

            if (!result?.error) {
                return;
            }

            setError("Some error occurred while attempting to sign in with Google. Please try again.");
        } catch {
            setError("Some error occurred while attempting to sign in with Google. Please try again.");
        } finally {
            setIsSigningIn(false);
        }
    };

    if (session) {
        return (
            <Button
                variant="outline"
                className="font-secondary uppercase"
                onClick={async () => {
                    await authClient.signOut();
                    window.location.assign("/");
                }}
            >
                <LogOut aria-hidden="true" data-icon="inline-start" />
                Sign out
            </Button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="font-secondary uppercase" variant="outline">
                    Login
                </Button>
            </DialogTrigger>
            <DialogContent className="gap-6 border-emerald-500 sm:max-w-md">
                <DialogHeader className="gap-3 text-left">
                    <DialogTitle className="font-secondary text-2xl font-medium">
                        {LOGIN_DIALOG_TITLE}
                    </DialogTitle>
                    <DialogDescription className="leading-relaxed">
                        {LOGIN_DIALOG_DESCRIPTION}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full"
                        variant="outline"
                        disabled={isSigningIn}
                        onClick={signInWithGoogle}
                    >
                        {/* <span aria-hidden="true" className="font-semibold">G</span> */}
                        {isSigningIn ? "Signing in with Google..." : "Sign in with Google"}
                    </Button>
                    {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthControls;