// app/sign-up/[[...index]]/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] px-4">
      <SignUp path="/sign-up" routing="path" redirectUrl={redirectUrl} />
      <p className="text-sm text-center mt-4 text-gray-500">
        已經有帳號了嗎？{" "}
        <a
          href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
          className="text-blue-600 hover:underline"
        >
          登入
        </a>
      </p>
    </div>
  );
}
