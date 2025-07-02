"use client";

import { usePathname } from "next/navigation";
import HeaderBanner from "./HeaderBanner";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

function DashboardHeader() {
  const { user } = useUser();

  return (
    <div className="flex justify-between items-center px-4 py-2 border-b">
      <div className="text-lg font-semibold text-primary">ShadyTable</div>
      <div className="flex items-center gap-4">
        {user && <span className="text-sm text-muted-foreground">{user.emailAddresses[0].emailAddress}</span>}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "📤 上傳資料", href: "/step1" },
    { label: "🔧 變項選擇", href: "/step2" },
    { label: "📄 統計摘要", href: "/step3" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30 font-sans text-[15px] text-gray-800">
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

      <div className="flex-1 flex flex-col">
        <HeaderBanner />
        <main className="w-full max-w-6xl mx-auto px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
