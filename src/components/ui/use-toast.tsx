"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}


export type ToastActionElement = React.ReactElement

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1 rounded-md bg-white p-4 shadow",
          className
        )}
        {...props}
      >
        {title && <p className="font-semibold">{title}</p>}
        {description && <p className="text-sm text-gray-500">{description}</p>}
        {action}
      </div>
    )
  }
)

Toast.displayName = "Toast"
