"use client";

import { zhTW } from "@clerk/localizations";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E3E7F0] to-white px-4">
        {/* 自訂 Logo，完全取代 Clerk 預設 Logo */}
        <Image
          src="/logo/Shadex Logo (2).png" // ← 放你自己的圖檔路徑
          alt="Shadex"
          width={200} // ← 想要多大就多大
          height={60}
          className="mt-4 mb-2"
        />

        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/step1"
          appearance={{
            elements: {
              card: "shadow-xl rounded-2xl border border-muted",
              formButtonPrimary: "bg-[#0F2844] hover:bg-[#183c6a] text-white",
              logoImage: "hidden",

            },
            variables: {
              colorPrimary: "#0F2844",
              fontFamily: '"Noto Sans TC", sans-serif',
            },
          }}
          // @ts-expect-error Clerk types don't yet include zh-TW
          localization={zhTW}
        />
      </div>
      );
}
