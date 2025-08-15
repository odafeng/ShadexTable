"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InlineNoticeProps = {
  type?: "info" | "warn" | "error";
  icon: ReactNode;
  children: ReactNode;
  className?: string;
};

const bgColorMap = {
  info: "text-[#0F2844]",
  warn: "text-[#E4A700]",
  error: "text-[#DC2626]",
};

export default function InlineNotice({
  type = "info",
  icon,
  children,
  className,
}: InlineNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-sm mt-2 leading-[22px]",
        bgColorMap[type],
        className
      )}
    >
      <div className="mt-[2px]">{icon}</div>
      <div className="font-[Noto_Sans_TC]">{children}</div>
    </div>
  );
}
