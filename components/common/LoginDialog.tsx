"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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

const getSafeCallbackURL = (redirectTarget: string | null) => {
  if (!redirectTarget) return AUTH_DEFAULT_REDIRECT;
  if (!redirectTarget.startsWith("/") || redirectTarget.startsWith("//")) {
    return AUTH_DEFAULT_REDIRECT;
  }

  try {
    const callbackURL = new URL(redirectTarget, "http://reexplain.local");

    if (callbackURL.origin !== "http://reexplain.local") return AUTH_DEFAULT_REDIRECT;

    return `${callbackURL.pathname}${callbackURL.search}${callbackURL.hash}`;
  } catch {
    return AUTH_DEFAULT_REDIRECT;
  }
};

type LoginDialogProps = {
  callbackURL?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: ReactNode;
};

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
            className="w-full"
            variant="outline"
            disabled={isSigningIn}
            onClick={signInWithGoogle}
          >
            {isSigningIn ? "Signing in with Google..." : "Sign in with Google"}
          </Button>
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
