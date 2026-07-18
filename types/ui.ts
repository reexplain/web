import type { ComponentProps, ReactNode } from "react";
import type { Dialog as DialogPrimitive, Label as LabelPrimitive, Separator as SeparatorPrimitive } from "radix-ui";

export type ButtonProps = ComponentProps<"button"> & {
  asChild?: boolean;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export type BadgeProps = ComponentProps<"span"> & {
  asChild?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
};

export type CardProps = ComponentProps<"div">;
export type CardHeaderProps = ComponentProps<"div">;
export type CardTitleProps = ComponentProps<"div">;
export type CardDescriptionProps = ComponentProps<"div">;
export type CardActionProps = ComponentProps<"div">;
export type CardContentProps = ComponentProps<"div">;
export type CardFooterProps = ComponentProps<"div">;

export type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;
export type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
export type DialogPortalProps = ComponentProps<typeof DialogPrimitive.Portal>;
export type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
export type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay>;
export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
};
export type DialogHeaderProps = ComponentProps<"div">;
export type DialogFooterProps = ComponentProps<"div"> & {
  showCloseButton?: boolean;
};
export type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;
export type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

export type FieldSetProps = ComponentProps<"fieldset">;
export type FieldLegendProps = ComponentProps<"legend"> & {
  variant?: "legend" | "label";
};
export type FieldGroupProps = ComponentProps<"div">;
export type FieldOrientation = "vertical" | "horizontal" | "responsive";
export type FieldProps = ComponentProps<"div"> & {
  orientation?: FieldOrientation;
};
export type FieldContentProps = ComponentProps<"div">;
export type FieldLabelProps = ComponentProps<typeof LabelPrimitive.Root>;
export type FieldTitleProps = ComponentProps<"div">;
export type FieldDescriptionProps = ComponentProps<"p">;
export type FieldSeparatorProps = ComponentProps<"div"> & {
  children?: ReactNode;
};
export type FieldErrorItem = { message?: string };
export type FieldErrorProps = ComponentProps<"div"> & {
  errors?: Array<FieldErrorItem | undefined>;
};

export type InputProps = ComponentProps<"input">;
export type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;
export type SeparatorProps = ComponentProps<typeof SeparatorPrimitive.Root>;
