"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Image from "next/image";

interface ActionButton2Props {
  text: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconSrc?: string;         // 常態 icon
  iconGraySrc?: string;     // disabled 時的灰階 icon
  iconHoverSrc?: string;    // hover 時的 icon
  className?: string;
}

export default function ActionButton2({
  text,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconSrc = "",
  iconGraySrc = "",
  iconHoverSrc = "",
  className = "",
}: ActionButton2Props) {
  const [isHover, setIsHover] = useState(false);
  const isDisabled = disabled || loading;

  const renderIcon = () => {
    if (loading) return null;
    if (Icon) return <Icon size={20} className="mr-1" />;
    if (iconSrc) {
      const selectedSrc = isDisabled && iconGraySrc
        ? iconGraySrc
        : isHover && iconHoverSrc
        ? iconHoverSrc
        : iconSrc;

      return (
        <Image
          src={selectedSrc}
          alt="icon"
          width={20}
          height={20}
          className="mr-1"
        />
      );
    }
    return null;
  };

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.04 }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className={`cursor-pointer tracking-[3px] w-auto h-[50px] rounded-full text-[20px] border hover:text-white hover:bg-[#0F2844] bg-transparent text-[#0F2844] border-[#0F2844] transition-all duration-200 flex items-center justify-center gap-2 px-4 py-2 ${className} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
      }}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-[#0F2844]"
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
      ) : (
        <>
          {renderIcon()}
          {text}
        </>
      )}
    </motion.button>
  );
}
