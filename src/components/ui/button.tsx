import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-base font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Stamped buttons: ink outline and offset shadow, pressed flat on tap. No hover motion.
        default:
          "border-2 border-stroke bg-primary text-primary-foreground shadow-stamp-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        destructive:
          "border-2 border-stroke bg-destructive text-destructive-foreground shadow-stamp-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        outline:
          "border-2 border-stroke bg-card text-foreground shadow-stamp-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        secondary:
          "border-2 border-stroke bg-secondary text-secondary-foreground shadow-stamp-sm active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        ghost: "border-2 border-transparent hover:bg-muted",
        link: "text-primary underline underline-offset-4",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
