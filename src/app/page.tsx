"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1D2939]">
      {/* Header */}
      <header className="bg-[#0F172A] text-white py-4 shadow-md">
        <div className="mx-auto max-w-screen-xl px-8 md:px-12 xl:px-24 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
            <Image src="/logo/shady_logo_light.svg" alt="ShadyTable Logo" width={32} height={32} />
            ShadyTable
          </div>

          <div className="hidden md:flex items-center gap-4">
            <nav className="flex space-x-6 text-sm">
              <a href="/features" className="hover:text-blue-400">功能特色</a>
              <a href="/pricing" className="hover:text-blue-400">定價方案</a>
              <a href="#" className="hover:text-blue-400">常見問題</a>
              <a href="#" className="hover:text-blue-400">關於我們</a>
            </nav>

<SignedOut>
  <div className="flex gap-2 relative">
    {/* 登入按鈕 */}
    <Link href="/sign-in">
      <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">
        登入
      </Button>
    </Link>

    {/* 註冊按鈕 + tooltip 只綁定在這裡 */}
    <div className="relative group">
    <Link href="/sign-up?redirect_url=/step1">
      <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">
        註冊
      </Button>
    </Link>
    {/* Tooltip 強化版 */}
      <div
      className="absolute -bottom-9 left-1/2 -translate-x-1/2 
    bg-black/80 text-white text-xs px-4 py-[6px] rounded-lg 
    shadow-xl opacity-0 group-hover:opacity-100 
    transition-all duration-300 ease-out 
    whitespace-nowrap min-w-fit text-center z-50 
    backdrop-blur-sm translate-y-1 group-hover:translate-y-0"
    >
      <span className="mr-1 text-sm">🎁</span> 立即註冊，獲得 1 點免費試用！
     </div>
    </div>
  </div>
</SignedOut>

            <SignedIn>
              <div className="flex gap-2">
                <Link href="/dashboard/points">
                  <Button className="bg-white text-[#0F172A] hover:bg-gray-100 text-sm font-semibold">
                    控制台
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="bg-[#0F172A] text-white md:hidden px-6 py-4 space-y-4">
          <nav className="flex flex-col space-y-2 text-sm">
            <a href="/features" className="hover:text-blue-400">功能特色</a>
            <a href="/pricing" className="hover:text-blue-400">定價方案</a>
            <a href="#" className="hover:text-blue-400">常見問題</a>
            <a href="#" className="hover:text-blue-400">關於我們</a>
          </nav>

          <SignedOut>
            <div className="flex gap-2">
              <Link href="/sign-in">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">   
                  登入
                </Button>
              </Link>
              <Link href="/sign-up?redirect_url=/step1" className="relative group">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">
                  註冊
                </Button>
              </Link>
            </div>
          </SignedOut>


          <SignedIn>
            <div className="flex gap-2">
              <Link href="/dashboard/points">
                <Button className="bg-white text-[#0F172A] hover:bg-gray-100 text-sm font-semibold">
                  控制台
                </Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="mx-auto max-w-screen-xl px-8 md:px-12 xl:px-24 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="md:pl-10">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              臨床研究分析，<br className="hidden md:block" />一鍵完成。
            </h1>
            <p className="text-lg mb-8 text-[#475569]">
              自動統計方法選擇，一鍵產生表格與摘要<br />只需3步驟
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="https://youtu.be/hA6ID9GMgeQ">
                <Button variant="outline" className="text-base px-6 py-2">  
                  觀看示範影片
                </Button>
              </Link>
              <Link href="/step1">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white text-base px-6 py-2">
                  立即開始分析
                </Button>
              </Link>
            </div>
              <p className="text-sm text-blue-600 font-medium mt-4">
                現在註冊即可獲得 <span className="font-bold">1 點免費試用點數</span>！
              </p>
          </div>
          <div className="w-full max-w-[960px] aspect-[16/9] rounded-xl overflow-hidden shadow-inner bg-gradient-to-tr from-slate-100 to-slate-200">
            <iframe
              src="https://www.youtube.com/embed/yGM9tCAVZeM?autoplay=1&mute=1&controls=0&loop=1&playlist=yGM9tCAVZeM&modestbranding=1&disablekb=1&rel=0"
              title="ShadyTable 示範影片"
              allow="autoplay"
              className="w-full h-full pointer-events-none"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-screen-xl px-8 md:px-12 xl:px-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center text-center h-full">
            <Image src="/icons/barchart-filled.svg" alt="分析圖示" width={80} height={80} className="mb-4 object-contain" />
            <h3 className="text-2xl font-semibold mb-3">一鍵分析</h3>
            <p className="text-base text-[#64748B]">
              ⾃動依據變項種類，<br />選擇合適檢定方法
            </p>
          </div>
          <div className="flex flex-col items-center text-center h-full">
            <Image src="/icons/brain-filled.svg" alt="AI 摘要圖示" width={80} height={80} className="mb-4 object-contain" />
            <h3 className="text-2xl font-semibold mb-3">AI 摘要</h3>
            <p className="text-base text-[#64748B]">
              ⾃動產生AI結果摘要段落<br />投稿、報告超方便
            </p>
          </div>
          <div className="flex flex-col items-center text-center h-full">
            <Image src="/icons/file-export-filled.svg" alt="Word Excel圖示" width={80} height={80} className="mb-4 object-contain" />
            <h3 className="text-2xl font-semibold mb-3">輕鬆產表</h3>
            <p className="text-base text-[#64748B]">
              一目瞭然的摘要表格<br />Word 與 Excel 匯出
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
