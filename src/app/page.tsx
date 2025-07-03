// app/page.tsx
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Home() {
  return (
    <>
      <SignedIn>
        {redirect("/step1")}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
