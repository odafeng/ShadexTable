// app/sign-in/[[...index]]/page.tsx
"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <SignIn path="/sign-in" routing="path" redirectUrl={redirectUrl} />
    </div>
  );
}
