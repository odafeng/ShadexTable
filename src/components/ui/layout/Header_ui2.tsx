"use client";

import Link from "next/link";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { Menu, X, Settings, LogOut } from "lucide-react";

export default function Header() {
  const [hoverLogout, setHoverLogout] = useState(false);
  const [hoverDashboard, setHoverDashboard] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useClerk();

  return (
    <header className="w-full bg-[#EEF2F9] h-[70px] sm:h-[90px] fixed top-0 z-50 shadow-sm">
      <div className="container-custom flex justify-between items-center h-full px-4 sm:px-8">
        {/* ✅ LOGO */}
        <Link href="/" passHref>
          <img
            src="/landing/Shadex_Table.png"
            alt="ShadexTable Logo"
            className="cursor-pointer w-[180px] sm:w-[270px] h-auto"
          />
        </Link>

        {/* ✅ 桌機版功能區 */}
        <div className="hidden sm:flex items-center gap-6">
          {/* 登出 */}
          <button
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            onClick={() => signOut()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut
              size={20}
              className={`transition-colors duration-300 ${hoverLogout ? "text-[#008587]" : "text-black"
                }`}
            />
            <span
              className={`transition-colors duration-300 text-[15px] tracking-[2px] font-sans leading-[32px] ${hoverLogout ? "text-[#008587]" : "text-black"
                }`}
            >
              登出
            </span>
          </button>

          {/* 控制台 */}
          <Link href="/dashboard">
            <button
              onMouseEnter={() => setHoverDashboard(true)}
              onMouseLeave={() => setHoverDashboard(false)}
              className="flex items-center justify-center gap-2 rounded-full border transition-all text-[15px] tracking-[2px] font-sans w-[120px] h-[40px] cursor-pointer"
              style={{
                backgroundColor: hoverDashboard ? "#00858700" : "#008587",
                borderColor: "#008587",
                color: hoverDashboard ? "#008587" : "#FFFFFF",
              }}
            >
              <Settings
                size={18}
                className={hoverDashboard ? "text-[#008587]" : "text-white"}
              />
              控制台
            </button>
          </Link>
        </div>

        {/* ✅ 手機版漢堡按鈕 */}
        <button
          className="sm:hidden focus:outline-none"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={28} color="#0F2844" />
        </button>
      </div>

      {/* ✅ 手機版選單與遮罩 */}
      {isMenuOpen && (
        <>
          {/* 淡淡遮罩 */}
          <div
            className="fixed inset-0 bg-black/10 z-40 transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 浮動選單面板 */}
          <div className="fixed top-6 right-4 w-[260px] bg-white rounded-xl shadow-lg z-50 px-6 py-6 flex flex-col items-center gap-4 animate-slide-in">
            {/* 關閉按鈕 */}
            <button className="self-end mb-2" onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>

            {/* 控制台按鈕 */}
            <Link href="/dashboard" className="w-full max-w-[200px]">
              <div className="flex items-center justify-center gap-2 text-[#0F2844] font-sans text-[16px] tracking-[1.5px] border border-[#ccc] px-4 py-2 rounded-full hover:bg-gray-100 transition">
                <Settings size={18} className="w-[18px] h-[18px]" />
                控制台
              </div>
            </Link>

            {/* 登出按鈕 */}
            <button
              className="w-full max-w-[200px] flex items-center justify-center gap-2 text-[#0F2844] font-sans text-[16px] tracking-[1.5px] border border-[#ccc] px-4 py-2 rounded-full hover:bg-gray-100 transition"
              onClick={() => {
                setIsMenuOpen(false);
                signOut();
              }}
            >
              <LogOut size={18} />
              登出
            </button>
          </div>
        </>
      )}
    </header>
  );
}
