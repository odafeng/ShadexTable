"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ModuleDropdown() {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 延遲關閉
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpen(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 按鈕本體 + icon */}
      <div className="flex items-center h-[32px] gap-1 cursor-pointer">
        <span
          className="text-[18px] leading-[32px] tracking-[2px] text-[#0F2844] hover:text-[#008587]"
          style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
        >
          其他模組選擇
        </span>
        <Image
          src={
            open
              ? "/landing/Path 7@2x.png"
              : "/landing/dopdown_arrow_dark@2x.png"
          }
          alt="dropdown-arrow"
          width={14}
          height={14}
        />
      </div>

      {/* 下拉選單 */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white border border-gray-200 z-50 overflow-hidden">
          {[
            { label: "ShadySurv 生存曲線", href: "/shadyprep" },
            { label: "ShadyReg 迴歸工具", href: "/shadysurv" },
            { label: "ShadyFigs 製圖工具", href: "/shadyreg" },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block px-4 py-2 text-[15px] text-[#0F2844] hover:bg-[#008587] hover:text-white transition-colors"
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
