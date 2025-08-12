"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCopy, CheckCircle2 } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

export default function CopyButton({ textToCopy, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2 秒後重置
    } catch (err) {
      console.error("❌ 複製失敗:", err);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      disabled={!textToCopy}
      className={`absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border
        ${
          copied
            ? "bg-[#e6f4ea] text-green-700 border-green-300"
            : "bg-white text-gray-700 border-gray-300 hover:bg-[#0F2844] hover:text-white hover:border-[#0F2844]"
        }
        ${!textToCopy ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm active:shadow-inner"}
        ${className}`}
    >
      {copied ? (
        <>
          <CheckCircle2 size={25} className="mt-[1px]" />
          已複製
        </>
      ) : (
        <>
          <ClipboardCopy size={25} className="mt-[1px]" />
          複製
        </>
      )}
    </motion.button>
  );
}
