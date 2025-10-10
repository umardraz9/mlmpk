"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentPropsWithoutRef<"label"> {
  className?: string;
}

const Label = React.forwardRef<
  React.ElementRef<"label">,
  LabelProps
>(({ className, ...props }, ref) => (
  <label 
    ref={ref} 
    className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} 
    {...props} 
  />
))
Label.displayName = "Label"

export { Label }