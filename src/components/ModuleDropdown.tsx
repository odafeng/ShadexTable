"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ModuleDropdown() {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const modules = [
    { label: "ShadySurv 生存曲線", href: "/shadysurv" },
    { label: "ShadyReg 迴歸工具", href: "/shadyreg" },
    { label: "ShadyFigs 製圖工具", href: "/shadyfigs" },
  ];

  // 桌面版用 hover 控制
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <>
      {/* ✅ 桌面版（hover 展開） */}
      <div
        className="relative hidden md:block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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

        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-gray-200 z-50 overflow-hidden">
            {modules.map((item, idx) => (
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

      {/* ✅ 手機版（點擊展開） */}
      <div className="block md:hidden">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="w-full text-left flex items-center justify-between py-2 text-[#0F2844] text-[16px] tracking-[1.5px] hover:text-[#008587]"
          style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
        >
          <span>其他模組選擇</span>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {open && (
          <div className="pl-4 space-y-2">
            {modules.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="block text-[#0F2844] text-[15px] tracking-[1.5px] hover:text-[#008587]"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
