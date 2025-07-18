"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function AnalysisErrorDialog({ open, onClose, message }: Props) {
  const [copied, setCopied] = useState(false);
  const [isCopyHover, setIsCopyHover] = useState(false);
  const [isCloseHover, setIsCloseHover] = useState(false);

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
          className="fixed z-50 max-w-[789px] w-[90vw] h-[299px] bg-[#EEF2F9] p-10 rounded-2xl shadow-lg flex flex-col justify-start"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {/* ✅ 標題 + ICON */}
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

          {/* ✅ 內文 */}
          <p className="text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px] mt-4">
            {message}
          </p>

          {/* ✅ 按鈕區 */}
          <div className="flex justify-end gap-4 mt-10">
            <Button
              onMouseEnter={() => setIsCopyHover(true)}
              onMouseLeave={() => setIsCopyHover(false)}
              onClick={handleCopy}
              variant="outline"
              className="w-[205px] h-[50px] text-[#0F2844] border-[#0F2844] hover:bg-[#0F2844] hover:text-white text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center gap-2"
            >
              <Image
                src={
                  copied
                    ? "/alert/copy_white.png"
                    : isCopyHover
                    ? "/alert/copy_white.png"
                    : "/alert/copy_dark.png"
                }
                alt="copy"
                width={20}
                height={20}
              />
              {copied ? "已複製" : "複製錯誤訊息"}
            </Button>

            <Button
              onMouseEnter={() => setIsCloseHover(true)}
              onMouseLeave={() => setIsCloseHover(false)}
              onClick={onClose}
              className="w-[111px] h-[50px] bg-[#0F2844] text-white hover:bg-white hover:text-[#0F2844] text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center gap-2 border border-[#0F2844]"
            >
              <Image
                src={
                  isCloseHover
                    ? "/alert/close_icon_dark.png"
                    : "/alert/close_icon@2x.png"
                }
                alt="close"
                width={20}
                height={20}
              />
              關閉
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
