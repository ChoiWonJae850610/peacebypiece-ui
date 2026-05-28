import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appCardVariants = cva("pbp-card min-w-0", {
  variants: {
    variant: {
      default: "rounded-[28px]",
      compact: "rounded-3xl",
      flat: "rounded-3xl shadow-none",
      subtle: "rounded-[28px] pbp-card-muted",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-5",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

type AppCardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof appCardVariants>;

export default function AppCard({ className, variant, padding, ...props }: AppCardProps) {
  return <div className={cn(appCardVariants({ variant, padding }), className)} {...props} />;
}
