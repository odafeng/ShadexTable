"use client";

import { zhTW } from "@clerk/localizations";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E3E7F0] to-white px-4">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/step1_v2"
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
        // @ts-expect-error Clerk types don't yet include zh-TW
        localization={zhTW}
      />
    </div>
  );
}
