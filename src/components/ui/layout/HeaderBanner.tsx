"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HeaderBanner() {
  return (
    <header className="bg-[#1D3557] text-white py-6 px-6 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-[72px] flex items-center">
            <Image
              src="/logo/shady_logo_light.svg"
              alt="Shady Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <div className="leading-tight">
            <h1 className="text-3xl font-bold tracking-tight">ShadyTable</h1>
            <p className="text-sm text-white/80">
              讓醫療統計變得簡單、有型、可信任。
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="bg-[#457B9D] text-white hover:bg-[#1D3557] px-5 py-2 text-sm rounded-lg">
            使用教學
          </Button>
          <Button className="bg-[#457B9D] text-white hover:bg-[#1D3557] px-5 py-2 text-sm rounded-lg">
            加入會員
          </Button>
        </div>
      </div>
    </header>
  );
}
