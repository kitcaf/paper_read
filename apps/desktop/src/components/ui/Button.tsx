import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ink-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ink-900 text-paper-50 shadow-sm hover:bg-ink-800",
        secondary:
          "border border-ink-300/45 bg-white text-ink-700 hover:border-ink-300/70 hover:bg-paper-50",
        outline:
          "border border-ink-300/45 bg-paper-50 text-ink-700 hover:border-ink-300/70 hover:bg-white",
        ghost: "text-ink-500 hover:bg-paper-100 hover:text-ink-900",
        destructive:
          "border border-coral-500/20 bg-coral-500/8 text-coral-500 hover:border-coral-500/35 hover:bg-coral-500/12"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
