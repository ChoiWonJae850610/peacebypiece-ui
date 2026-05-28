import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]",
  {
    variants: {
      variant: {
        primary: "pbp-action-primary shadow-sm",
        secondary: "pbp-action-secondary shadow-sm",
        ghost: "pbp-action-ghost",
        danger: "pbp-action-danger shadow-sm",
      },
      size: {
        sm: "min-h-8 rounded-xl px-3 py-1.5 text-xs",
        md: "min-h-10 rounded-2xl px-4 py-2 text-sm",
        lg: "min-h-12 rounded-[20px] px-5 py-3 text-base",
      },
      width: {
        auto: "",
        full: "w-full",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
      width: "auto",
    },
  },
);

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof appButtonVariants> & {
    asChild?: boolean;
  };

export default function AppButton({
  asChild = false,
  className,
  variant,
  size,
  width,
  type = "button",
  ...props
}: AppButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(appButtonVariants({ variant, size, width }), className)}
      {...(!asChild ? { type } : {})}
      {...props}
    />
  );
}
