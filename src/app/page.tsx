"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { Instagram, Facebook, Mail } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons/ThreadsIcon";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1D2939]">
      {/* Header */}
      <header className="bg-[#0F172A] text-white py-4 shadow-md">
        <div className="mx-auto max-w-screen-xl px-8 md:px-12 xl:px-24 flex items-center justify-between">
          <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
            <Image src="/logo/shady_logo_dark.svg" alt="ShadyTable Logo" width={32} height={32} />
            ShadyTable
          </div>

          <nav className="flex justify-end space-x-6 text-sm items-center px-6">
            <a href="/marketing/features" className="hover:text-blue-400">功能特色</a>
            <a href="/marketing/pricing" className="hover:text-blue-400">定價方案</a>
            <a href="/marketing/about-us" className="hover:text-blue-400">關於Shady</a>
            <a href="/marketing/contact" className="hover:text-blue-400">聯絡與回饋</a>

            {/* 下拉選單 - 其他模組 */}
            <div className="relative group">
              <div className="hover:text-blue-400 cursor-pointer">其他模組</div>
              <div className="absolute left-0 mt-2 w-48 rounded shadow-lg z-50
              bg-white text-black opacity-0 invisible group-hover:opacity-100 group-hover:visible
              transition-all duration-200 ease-in-out"
              >
                <a href="/shadysurv" className="block px-4 py-2 hover:bg-gray-100">ShadySurv 生存曲線</a>
                <a href="/shadyreg" className="block px-4 py-2 hover:bg-gray-100">ShadyReg 迴歸分析</a>
                <a href="/shadyfigures" className="block px-4 py-2 hover:bg-gray-100">ShadyFigures 製圖工具</a>
              </div>
            </div>
          </nav>

          <SignedOut>
            <div className="flex gap-2 relative">
              <Link href="/sign-in">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">登入</Button>
              </Link>
              <div className="relative group">
                <Link href="/sign-up?redirect_url=/step1">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">註冊</Button>
                </Link>
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-4 py-[6px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out whitespace-nowrap min-w-fit text-center z-50 backdrop-blur-sm translate-y-1 group-hover:translate-y-0">
                  <span className="mr-1 text-sm">🎁</span> 立即註冊，獲得 2 點免費試用！
                </div>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="flex gap-2">
              <Link href="/dashboard/points">
                <Button className="bg-white text-[#0F172A] hover:bg-gray-100 text-sm font-semibold">控制台</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="bg-[#0F172A] text-white md:hidden px-6 py-4 space-y-4">
          <nav className="flex flex-col space-y-2 text-sm">
            <a href="/marketing/features" className="hover:text-blue-400">功能特色</a>
            <a href="/marketing/pricing" className="hover:text-blue-400">定價方案</a>
            <a href="/marketing/about-us" className="hover:text-blue-400">關於我們</a>
            <a href="/marketing/contact" className="hover:text-blue-400">聯絡與回饋</a>

            {/* 下拉選單 - 其他模組 */}
            <div className="text-sm font-semibold mt-4">其他模組</div>
            <ul className="ml-2 space-y-2">
              <li><a href="/shadysurv" className="hover:text-blue-400">ShadySurv 生存曲線</a></li>
              <li><a href="/shadyreg" className="hover:text-blue-400">ShadyReg 迴歸分析</a></li>
              <li><a href="/shadyfigures" className="hover:text-blue-400">ShadyFigures 製圖工具</a></li>
            </ul>
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
              全台灣第一款專為臨床研究人員打造的<br />雲端統計工具
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
              <p className="text-sm text-blue-600 font-medium mt-4 md-16">
                現在註冊即可獲得 <span className="font-bold">2 點免費試用點數</span>！
              </p>
          </div>
          <div className="w-full max-w-[960px] aspect-[16/9] rounded-xl overflow-hidden shadow-inner bg-gradient-to-tr from-slate-100 to-slate-200">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source
                src="https://res.cloudinary.com/dpmewq6aj/video/upload/v1752251893/landing_demo_imou3s.mp4"
                type="video/mp4"
              />
              您的瀏覽器不支援影片播放
            </video>
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

{/* Footer */}
<footer className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-gray-300 py-8 mt-8">
      <div className="max-w-screen-xl mx-auto px-8 md:px-12 xl:px-24 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        {/* Left: copyright */}
        <div className="text-center md:text-left">
          © {new Date().getFullYear()} ShadyTable by AI Medicus. All rights reserved.
        </div>

        {/* Right: link group */}
        <div className="flex gap-4 flex-wrap justify-center md:justify-end items-center">
          <Link
            href="/marketing/faq"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            常見問題
          </Link>
          
          <Link
            href="/marketing/privacy"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            隱私權政策
          </Link>
          <Link
            href="/marketing/terms"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            使用者條款
          </Link>
          <Link
            href="/marketing/technical"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            技術說明文件
          </Link>

          {/* Social Icons with lucide-react */}
          <div className="flex gap-3 items-center ml-4">
            <a
              href="https://www.instagram.com/shadytable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/shadytable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.threads.net/@shadytable"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ThreadsIcon className="w-5 h-5" />
</a>
            <a
              href="mailto:support@shadytable.com"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>

    </main>
  );
}
