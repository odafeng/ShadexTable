// app/sign-in/[[...index]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
      <SignIn path="/sign-in" routing="path" />
    </div>
  );
}
