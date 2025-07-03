"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import HeaderBanner from "./HeaderBanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { label: "📤 上傳資料", href: "/step1" },
    { label: "🔧 變項選擇", href: "/step2" },
    { label: "📄 統計摘要", href: "/step3" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muted/30 font-sans text-[15px] text-gray-800">
      {/* 左側側邊欄：桌機版 */}
      <aside
        className="hidden md:flex flex-col w-64 px-6 py-8 space-y-6 shadow-lg bg-[#F0EDE3] text-[#1D3557]"
        style={{ fontFamily: '"Microsoft JhengHei", sans-serif' }}
      >
        <div className="text-4xl font-bold tracking-tight text-center relative">
          <span className="bg-gradient-to-r from-[#2E6F72] via-[#5F6C7B] to-[#B8F2E6] text-transparent bg-clip-text">
            ShadyPanel
          </span>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-accent/30 rounded-full blur-sm z-0" />
        </div>

        <nav className="space-y-3 text-[28px] font-medium text-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block py-2 rounded-md transition px-3 ${
                pathname === item.href
                  ? "bg-[#1D3557] text-white font-semibold"
                  : "hover:bg-[#FFF9DB] hover:text-[#1D3557]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主內容區 */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b">
          <div className="text-lg font-semibold text-primary">ShadyTable</div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-md hover:bg-accent">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-[#F0EDE3] text-[#1D3557]">
                <SheetHeader>
                  <SheetTitle className="text-2xl text-center font-bold tracking-tight">
                    ShadyPanel
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 space-y-3 text-xl text-center">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={`block py-2 rounded-md transition px-3 ${
                          pathname === item.href
                            ? "bg-[#1D3557] text-white font-semibold"
                            : "hover:bg-[#FFF9DB] hover:text-[#1D3557]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        <HeaderBanner />

        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
