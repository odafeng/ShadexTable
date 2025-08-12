"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ActionButtonProps {
  text: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconSrc?: string;         // 常態 icon
  iconGraySrc?: string;     // disabled 時的灰階 icon
  iconHoverSrc?: string;    // hover 時的 icon
  className?: string;
}

export default function ActionButton({
  text,
  onClick,
  disabled = false,
  loading = false,
  loadingText = "處理中...",
  icon: Icon,
  iconSrc,
  iconGraySrc,
  iconHoverSrc,
  className = "",
}: ActionButtonProps) {
  const isDisabled = disabled || loading;
  const [isHover, setIsHover] = useState(false);

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.04 }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className={`cursor-pointer rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all duration-200 flex items-center justify-center gap-2 px-6 h-[50px] text-[18px] tracking-[2px] ${className} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
      }}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
          />
        </svg>
      ) : Icon ? (
        <Icon size={20} className="mr-1" />
      ) : iconSrc ? (
        <Image
          src={
            isDisabled && iconGraySrc
              ? iconGraySrc
              : isHover && iconHoverSrc
              ? iconHoverSrc
              : iconSrc
          }
          alt="icon"
          width={20}
          height={20}
        />
      ) : null}
      {loading ? loadingText : text}
    </motion.button>
  );
}
