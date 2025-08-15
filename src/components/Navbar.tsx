"use client";

import { useState } from "react";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ModuleDropdown from "@/components/ModuleDropdown";


export default function Navbar() {
  const [hovered, setHovered] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: "功能特色", href: "/marketing/features" },
    { label: "定價方案", href: "/marketing/free_mode" },
    { label: "常見問題", href: "/marketing/faq" },
    { label: "關於我們", href: "/marketing/about_v2" },
  ];

  return (
    <header className="w-full border-b bg-[#EEF2F9] shadow-sm sticky top-0 z-50">
      <div className="container-custom py-3 flex justify-between items-center">
        {/* 左側 Logo 區 */}
        <Link href="/" className="flex items-center gap-2 text-[#0F2844]">
          <Image
            src="/landing/Shadex_Table_Landing_Logo.svg"
            alt="ShadexTable"
            width={270}
            height={50}
            className="w-[180px] h-[33px] md:w-[270px] md:h-[50px]"
          />
        </Link>

        {/* 電腦版導覽列 */}
        <nav className="hidden md:flex items-center gap-8">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="text-[18px] leading-[32px] tracking-[2px] text-[#0F2844] hover:text-[#008587]"
              style={{ fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif', fontWeight: 400 }}
            >
              {item.label}
            </Link>
          ))}
          <ModuleDropdown />
        </nav>

        {/* 右側登入 / 註冊按鈕（電腦版） */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/sign-in"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-2 group"
          >
            <Image
              src={hovered ? "/landing/icon@2x.png" : "/landing/icon_btn@2x.png"}
              alt="login"
              width={24}
              height={20}
            />
            <span
              className={`text-[15px] leading-[32px] tracking-[2px] transition-colors duration-200 ${hovered ? "text-[#008587]" : "text-black"
                }`}
              style={{ fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif', fontWeight: 400 }}
            >
              登入
            </span>
          </Link>

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
              fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif',
              fontWeight: 400,
              color: ctaHover ? "#008587" : "#FFFFFF",
              backgroundColor: ctaHover ? "transparent" : "#008587",
              borderColor: "#008587",
              borderWidth: "1px",
            }}
          >
            <Image
              src={ctaHover ? "/landing/Polygon 1@2x.png" : "/landing/arrow_1@2x.png"}
              alt="register-icon"
              width={16}
              height={12}
            />
            立即註冊
          </Link>
        </div>

        {/* 手機版漢堡選單按鈕 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden focus:outline-none"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 手機版下拉選單 */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-4 bg-[#EEF2F9]">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block text-[#0F2844] text-[16px] tracking-[1.5px] hover:text-[#008587]"
              style={{ fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}
            >
              {item.label}
            </Link>
          ))}
          <div className="-mt-2">
            <ModuleDropdown />
          </div>
          <div>
          <Link
            href="/sign-in"
            className="mt-6 text-[#0F2844] text-[16px] tracking-[1.5px]"
          >
            登入
          </Link>
          </div>
          <div className="-mt-4">
          <Link
            href="/sign-up"
            className="text-[16px] text-[#008587]"
            style={{
              fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              letterSpacing: "2px",
            }}
          >
            立即註冊
          </Link>
          </div>
        </div>
      )}
    </header>
  );
}
