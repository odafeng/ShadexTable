"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  text: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: LucideIcon; // lucide-react 的 icon component
  className?: string;
}

export default function ActionButton({
  text,
  onClick,
  disabled = false,
  loading = false,
  loadingText = "處理中...",
  icon: Icon,
  className = "",
}: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all duration-200 flex items-center justify-center gap-2 px-4 py-2 text-base ${className} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
      }}
    >
      {Icon && <Icon size={20} className="mr-1" />}
      {loading ? loadingText : text}
    </motion.button>
  );
}
