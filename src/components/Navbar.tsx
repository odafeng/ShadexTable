"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ModuleDropdown from "@/components/ModuleDropdown";


export default function Navbar() {
  const [hovered, setHovered] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <header className="w-full border-b bg-[#EEF2F9] shadow-sm sticky top-0 z-50">
      <div className="container-custom py-3 flex justify-between items-center">
        {/* 左側 Logo 區 */}
        <Link href="/" className="flex items-center gap-2 text-[#0F2844]">
          <Image src="/logo/shady_logo_light.svg" alt="ShadyTable" width={50} height={50} />
          <span className="text-[34px] tracking-wide" style={{ fontFamily: "Futura, sans-serif", fontWeight: "900" }}>
            ShadyTable
          </span>
        </Link>

        {/* 中間導覽列 */}
        <nav className="hidden md:flex items-center gap-8">
  {/* 前四項使用 map */}
  {[
    { label: "功能特色", href: "#features" },
    { label: "定價方案", href: "#pricing" },
    { label: "常見問題", href: "#faq" },
    { label: "關於我們", href: "#about" },
  ].map((item, idx) => (
    <Link
      key={idx}
      href={item.href}
      className="text-[15px] leading-[32px] tracking-[2px] text-[#0F2844] hover:text-[#008587]"
      style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', fontWeight: 400 }}
    >
      {item.label}
    </Link>
  ))}

  {/* 第五項改用 ModuleDropdown 元件 */}
  <ModuleDropdown />
</nav>


        {/* 右側登入 / 註冊按鈕 */}
        <div className="flex items-center gap-4">
          {/* 登入 */}
          <Link
            href="/sign-in"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-2 group"
          >
            <Image
              src={
                hovered
                  ? "/landing/icon@2x.png"
                  : "/landing/icon_btn@2x.png"
              }
              alt="login"
              width={24}
              height={20}
            />
            <span
              className={`text-[15px] leading-[32px] tracking-[2px] transition-colors duration-200 ${
                hovered ? "text-[#008587]" : "text-black"
              }`}
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', fontWeight: 400 }}
            >
              登入
            </span>
          </Link>

          {/* 註冊 CTA 按鈕 */}
          <Link
            href="/sign-up"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            className="flex items-center gap-2 justify-center border rounded-full transition-all duration-200"
            style={{
              width: "145px",
              height: "40px",
              fontSize: "15px",
              letterSpacing: "2px",
              lineHeight: "32px",
              fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              fontWeight: 400,
              color: ctaHover ? "#008587" : "#FFFFFF",
              backgroundColor: ctaHover ? "transparent" : "#008587",
              borderColor: "#008587",
              borderWidth: "1px",
            }}
          >
            <Image
              src={
                ctaHover
                  ? "/landing/Polygon 1@2x.png"
                  : "/landing/arrow_1@2x.png"
              }
              alt="register-icon"
              width={16}
              height={12}
            />
            立即註冊
          </Link>
        </div>
      </div>
    </header>
  );
}
