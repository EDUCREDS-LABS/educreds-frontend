import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border-2 p-5 [&>svg~*]:pl-9 [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground shadow-lg transition-all duration-300 bg-white dark:bg-neutral-900",
  {
    variants: {
      variant: {
        default: "text-foreground border-neutral-200/80",
        destructive:
          "border-destructive/40 bg-destructive/20 text-destructive dark:border-destructive/50 dark:bg-destructive/25 [&>svg]:text-destructive font-medium shadow-destructive/15",
        warning:
          "border-warning/40 bg-warning/20 text-warning-foreground dark:border-warning/50 dark:bg-warning/25 [&>svg]:text-warning font-medium shadow-warning/15",
        info:
          "border-info/40 bg-info/20 text-info-foreground dark:border-info/50 dark:bg-info/25 [&>svg]:text-info font-medium shadow-info/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
