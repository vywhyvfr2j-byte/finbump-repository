import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // min-height (not height) so a call site's own h-9/h-8 can never shrink the
  // tap target below 44px — the store minimum on Android and iOS.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md min-h-[2.75rem] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 44px tall in every size: the minimum comfortable tap target on iOS
        // and Android. Width and type scale are what make a button feel small.
        default: "h-11 px-4 py-2",
        sm: "h-11 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const extractText = (children) => {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join(' ').trim();
  if (React.isValidElement(children)) return extractText(children.props?.children).trim();
  return '';
};

const Button = React.forwardRef(({ className, variant, size, asChild = false, children, title, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const derivedTitle = title ?? extractText(children);
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      title={derivedTitle || undefined}
      {...props}>
      {children}
    </Comp>)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }