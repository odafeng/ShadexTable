// app/sign-in/[[...index]]/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <SignIn path="/sign-in" routing="path" redirectUrl={redirectUrl} />
    </div>
  );
}
