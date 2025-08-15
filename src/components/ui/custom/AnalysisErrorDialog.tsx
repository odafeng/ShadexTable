"use client";

import { useState } from "react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Image from "next/image";

import ActionButton from "@/components/ui/custom/ActionButton";
import ActionButton2 from "@/components/ui/custom/ActionButton2";

interface Props {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function AnalysisErrorDialog({ open, onClose, message }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <AlertDialog.Content
          className="fixed z-50 max-w-[789px] w-[90vw] min-h-[299px] bg-[#EEF2F9] p-10 rounded-2xl shadow-lg flex flex-col"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {/* 標題 + ICON */}
          <AlertDialog.Title asChild>
            <div className="flex items-center gap-3 text-[#0F2844] text-[24px] font-bold tracking-[2px] leading-[36px]">
              <Image
                src="/alert/exclamation_icon@2x.png"
                alt="exclamation"
                width={24}
                height={24}
              />
              分析失敗
            </div>
          </AlertDialog.Title>

          {/* 內文 - flex-grow 讓它佔據剩餘空間 */}
          <div className="flex-grow mt-4">
            <p className="text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px] whitespace-pre-wrap">
              {message}
            </p>
          </div>

          {/* 按鈕區 - 確保在底部 */}
          <div className="flex justify-end gap-4 mt-6">
            <ActionButton2
              text={copied ? "已複製" : "複製錯誤訊息"}
              onClick={handleCopy}
              iconSrc="/alert/copy_dark.png"
              iconHoverSrc="/alert/copy_white.png"
              className="min-w-[180px] whitespace-nowrap cursor-pointer"
            />

            <ActionButton
              text="關閉"
              onClick={onClose}
              iconSrc="/alert/close_icon@2x.png"
              iconHoverSrc="/alert/close_icon_dark.png"
              className="min-w-[100px] whitespace-nowrap cursor-pointer"
            />
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}