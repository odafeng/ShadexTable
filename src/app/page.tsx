"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function LandingPlaceholder() {
  useEffect(() => {
    async function tryGetToken() {
      const check = async () => {
        try {
          if (window.Clerk?.session) {
            const token = await window.Clerk.session.getToken({ template: "shadytable-api" });
            console.log("📌 JWT Token (shadytable-api):", token);
          } else {
            setTimeout(check, 200); // wait until Clerk session is ready
          }
        } catch (error) {
          console.error("❌ 無法取得 Clerk token:", error);
        }
      };
      check();
    }

    tryGetToken();
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1D3557] flex flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/logo/shady_logo_dark.svg"
        alt="ShadyTable Logo"
        width={80}
        height={80}
        className="mb-6"
      />
      <h1 className="text-3xl md:text-4xl font-bold mb-4">ShadyTable 首頁建構中</h1>
      <p className="text-[#64748B] max-w-md mb-6 text-base md:text-lg">
        我們正在打造全新的首頁體驗，敬請期待！
        <br />
        如您已是會員，可直接開始使用。
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/step1">
          <Button className="bg-[#457B9D] text-white hover:bg-[#1D3557] text-sm px-6 py-2 rounded-lg">
            開始使用 ShadyTable
          </Button>
        </Link>
        <Link href="/sign-in">
          <Button variant="outline" className="text-sm px-6 py-2 rounded-lg border-[#457B9D] text-[#1D3557]">
            會員登入
          </Button>
        </Link>
      </div>
    </main>
  );
}