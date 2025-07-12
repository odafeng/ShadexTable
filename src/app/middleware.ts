import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);
  const pathname = req.nextUrl.pathname;

  const publicRoutes = ["/", "/sign-in", "/sign-up"];

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 🛡️ 限制只有特定管理者可訪問 /admin 路徑
  if (pathname.startsWith("/admin")) {
    const email = sessionClaims?.email as string | undefined;
    const allowedAdmins = ["odafeng@hotmail.com"]; // ✅ 改成你自己的 admin email

    if (!email || !allowedAdmins.includes(email)) {
      return NextResponse.redirect(new URL("/", req.url)); // 導回首頁（或你可自定 403 頁）
    }
  }

  if (userId && pathname === "/sign-in") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
