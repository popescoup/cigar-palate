import * as React from "react"
import { type ComponentPropsWithoutRef, type ElementRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps extends ComponentPropsWithoutRef<"div">,
  VariantProps<typeof alertVariants> {}

interface AlertTitleProps extends ComponentPropsWithoutRef<"h5"> {}

interface AlertDescriptionProps extends ComponentPropsWithoutRef<"div"> {}

const Alert = React.forwardRef<ElementRef<"div">, AlertProps>(
  (props, ref) => {
    const { className, variant, ...rest } = props
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...rest}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<ElementRef<"h5">, AlertTitleProps>(
  (props, ref) => {
    const { className, ...rest } = props
    return (
      <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...rest}
      />
    )
  }
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<ElementRef<"div">, AlertDescriptionProps>(
  (props, ref) => {
    const { className, ...rest } = props
    return (
      <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...rest}
      />
    )
  }
)
AlertDescription.displayName = "AlertDescription"

export {
  Alert,
  AlertTitle,
  AlertDescription,
  type AlertProps,
  type AlertTitleProps,
  type AlertDescriptionProps,
}