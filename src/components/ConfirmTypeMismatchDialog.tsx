"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmTypeMismatchDialog({
  open,
  message,
  onConfirm,
  onCancel,
}: Props) {
  const [isConfirmHover, setIsConfirmHover] = useState(false);
  const [isCancelHover, setIsCancelHover] = useState(false);

  console.log("=== ConfirmTypeMismatchDialog 渲染 ===");
  console.log("open:", open);
  console.log("message:", message);

  return (
    <AlertDialog.Root open={open}>
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
              型別不一致提醒
            </div>
          </AlertDialog.Title>

          {/* ✅ 內文 */}
          <p className="text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px] mt-4 whitespace-pre-wrap">
            {message}
          </p>

          {/* ✅ 按鈕區 */}
          <div className="flex justify-end gap-4 mt-10">
            <Button
              onMouseEnter={() => setIsCancelHover(true)}
              onMouseLeave={() => setIsCancelHover(false)}
              onClick={() => {
                onCancel();
              }}
              variant="outline"
              className="w-[205px] h-[50px] text-[#0F2844] border-[#0F2844] hover:bg-[#0F2844] hover:text-white text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer"
            >
              <Image
                src={
                  isCancelHover
                    ? "/alert/close_icon@2x.png"
                    : "/alert/close_icon_dark.png"
                }
                alt="edit"
                width={20}
                height={20}
              />
              修改變項指定
            </Button>

            <Button
              onMouseEnter={() => setIsConfirmHover(true)}
              onMouseLeave={() => setIsConfirmHover(false)}
              onClick={() => {                
                onConfirm();
              }}
              className="w-[160px] h-[50px] bg-[#0F2844] text-white hover:bg-white hover:text-[#0F2844] text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center gap-2 border border-[#0F2844] cursor-pointer"
            >
              <Image
                src={
                  isConfirmHover
                    ? "/landing/arrow_13147905@2x.png"
                    : "/landing/arrow_2_white@2x.png"
                }
                alt="arrow"
                width={20}
                height={20}
              />
              繼續分析
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}