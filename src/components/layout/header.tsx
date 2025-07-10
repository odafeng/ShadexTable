"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#0F172A] text-white py-4 shadow-md">
      <div className="mx-auto max-w-screen-xl px-8 md:px-12 xl:px-24 flex items-center justify-between">
        <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
          <Image src="/logo/shady_logo_light.svg" alt="ShadyTable Logo" width={32} height={32} />
          ShadyTable
        </div>

        <div className="hidden md:flex items-center gap-4">
          <nav className="flex space-x-6 text-sm">
            <Link href="/marketing/features" className="hover:text-blue-400">功能特色</Link>
            <Link href="/marketing/pricing" className="hover:text-blue-400">定價方案</Link>
            <Link href="/marketing/faq" className="hover:text-blue-400">常見問題</Link>
            <Link href="/marketing/about-us" className="hover:text-blue-400">關於我們</Link>
          </nav>

          <SignedOut>
            <div className="flex gap-2 relative">
              <Link href="/sign-in">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">
                  登入
                </Button>
              </Link>
              <div className="relative group">
                <Link href="/sign-up?redirect_url=/step1">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">
                    註冊
                  </Button>
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

      {menuOpen && (
        <div className="bg-[#0F172A] text-white md:hidden px-6 py-4 space-y-4">
          <nav className="flex flex-col space-y-2 text-sm">
            <Link href="/marketing/features" className="hover:text-blue-400">功能特色</Link>
            <Link href="/marketing/pricing" className="hover:text-blue-400">定價方案</Link>
            <Link href="/marketing/aq" className="hover:text-blue-400">常見問題</Link>
            <Link href="/marketing/about-us" className="hover:text-blue-400">關於我們</Link>
          </nav>

          <SignedOut>
            <div className="flex gap-2">
              <Link href="/sign-in">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">登入</Button>
              </Link>
              <Link href="/sign-up?redirect_url=/step1" className="relative group">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-md">註冊</Button>
              </Link>
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
        </div>
      )}
    </header>
  );
}
