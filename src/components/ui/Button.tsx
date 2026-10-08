import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-300 select-none",
          "rounded-xl border border-transparent",
          "disabled:opacity-50 disabled:pointer-events-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
          {
            "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.97]":
              variant === "primary",
            "bg-white text-primary border-surface-300 hover:bg-surface-100 hover:border-surface-400 shadow-sm":
              variant === "secondary",
            "bg-transparent text-primary/60 hover:text-primary hover:bg-surface-100": variant === "ghost",
            "border-surface-300 text-primary hover:border-accent/50 hover:text-accent bg-transparent":
              variant === "outline",
            "gradient-accent text-white font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-[0.97]":
              variant === "accent",
          },
          {
            "h-9 px-4 text-sm": size === "sm",
            "h-11 px-5 text-sm": size === "md",
            "h-12 px-7 text-base": size === "lg",
            "h-14 px-9 text-lg": size === "xl",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
