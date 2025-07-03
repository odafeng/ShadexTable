"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HeaderBanner() {
  return (
    <header className="bg-[#1D3557] text-white py-6 px-4 sm:px-6 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 flex-wrap">
        {/* Logo + 標語區塊 */}
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="h-[64px] flex items-center">
            <Image
              src="/logo/shady_logo_light.svg"
              alt="Shady Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ShadyTable
            </h1>
            <p className="text-sm text-white/80">
              讓醫療統計變得簡單、有型、可信任。
            </p>
          </div>
        </div>

        {/* 按鈕群 */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto justify-center md:justify-end">
          <Button className="bg-[#457B9D] text-white hover:bg-[#1D3557] px-5 py-2 text-sm rounded-lg w-full sm:w-auto">
            使用教學
          </Button>
          <Button className="bg-[#457B9D] text-white hover:bg-[#1D3557] px-5 py-2 text-sm rounded-lg w-full sm:w-auto">
            加入會員
          </Button>
        </div>
      </div>
    </header>
  );
}
