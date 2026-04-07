import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm hover:brightness-[0.94]",
        secondary:
          "border border-[color:var(--border)] bg-[color:var(--card)] text-[color:var(--secondary-foreground)] hover:border-[color:rgba(112,135,149,0.4)] hover:bg-[color:var(--secondary)]",
        outline:
          "border border-[color:var(--border)] bg-[color:var(--muted)] text-[color:var(--secondary-foreground)] hover:border-[color:rgba(112,135,149,0.4)] hover:bg-[color:var(--input)]",
        ghost:
          "text-[color:var(--muted-foreground)] hover:bg-[color:var(--secondary)] hover:text-[color:var(--foreground)]",
        destructive:
          "border border-[color:rgba(198,97,77,0.2)] bg-[color:rgba(198,97,77,0.08)] text-[color:var(--destructive)] hover:border-[color:rgba(198,97,77,0.34)] hover:bg-[color:rgba(198,97,77,0.12)]"
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
