"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn redirectUrl="/step1_v2" />;
}
