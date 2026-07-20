"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AUTH_REDIRECT_QUERY_PARAM, LOGIN_DIALOG_DESCRIPTION, LOGIN_DIALOG_TITLE } from "@/constants/auth";
import { Button } from "@/components/ui/button";
import type { LoginDialogProps } from "@/types/auth";
import { getSafeCallbackURL } from "@/utils/auth/get-safe-callback-url";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LoginDialog = ({ callbackURL, onOpenChange, open, trigger }: LoginDialogProps) => {
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setError("");
    setIsSigningIn(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL:
          callbackURL ?? getSafeCallbackURL(searchParams.get(AUTH_REDIRECT_QUERY_PARAM)),
        errorCallbackURL: "/?authError=google",
      });

      if (!result?.error) return;

      setError("Google sign-in could not be started. Try again.");
    } catch {
      setError("Google sign-in could not be started. Try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
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
            className="w-full gap-2.5"
            variant="outline"
            disabled={isSigningIn}
            onClick={signInWithGoogle}
          >
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="fill-foreground"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>

            {isSigningIn ? "Signing in with Google..." : "Sign in with Google"}
          </Button>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
