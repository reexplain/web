import type { ReactNode } from "react";

export type AuthControlsProps = {
  isAuthenticated: boolean;
};

export type LoginDialogProps = {
  callbackURL?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  trigger?: ReactNode;
};
