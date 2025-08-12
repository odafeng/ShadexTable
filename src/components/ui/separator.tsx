import * as React from "react";
import { cn } from "@/lib/utils";

// 方案 1: 直接使用 type alias（推薦）
export type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("shrink-0 bg-border h-[1px] w-full", className)}
      {...props}
    />
  )
);
Separator.displayName = "Separator";