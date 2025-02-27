"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

type LabelElement = React.ElementRef<typeof LabelPrimitive.Root>
type PrimitiveLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>

interface LabelProps extends PrimitiveLabelProps, VariantProps<typeof labelVariants> {
  className?: string;
}

const Label = React.forwardRef<LabelElement, LabelProps>(
  ({ className, ...props }: LabelProps, ref: React.Ref<LabelElement>) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
  )
)

if (Label) {
  Label.displayName = "Label"
}

export { Label, type LabelProps }