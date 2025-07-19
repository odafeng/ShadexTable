// app/sign-up/[[...index]]/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";
import { zhTW } from "@clerk/localizations";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] px-4">
      <SignUp
        path="/sign-up"
        routing="path"
        redirectUrl={redirectUrl}
        // ✅ 加上 localization
        // @ts-expect-error Clerk 尚未更新 zhTW 型別
        localization={zhTW}
        appearance={{
          elements: {
            card: "shadow-xl rounded-2xl border border-muted",
            formButtonPrimary: "bg-[#0F2844] hover:bg-[#183c6a] text-white",
          },
          variables: {
            colorPrimary: "#0F2844",
            fontFamily: '"Noto Sans TC", sans-serif',
          },
        }}
      />
      <p className="text-sm text-center mt-4 text-gray-500">
        已經有帳號了嗎？{" "}
        <a
          href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="text-[#0F2844] font-semibold hover:underline"
        >
          登入
        </a>
      </p>
    </div>
  );
}
