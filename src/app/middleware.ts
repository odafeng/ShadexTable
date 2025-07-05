import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { userId } = getAuth(req);
  const publicRoutes = ["/", "/sign-in", "/sign-up"];
  const pathname = req.nextUrl.pathname;

  // ✅ 公開路由通過
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ 如果未登入，導去 sign-in，帶 redirect_url
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // ✅ 已登入就放行
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
