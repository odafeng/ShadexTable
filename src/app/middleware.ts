import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ 改用 RegExp 判斷 public route
const PUBLIC_ROUTES = [/^\/$/, /^\/sign-in(\/.*)?$/, /^\/sign-up(\/.*)?$/];

export function middleware(req: NextRequest) {
  const { userId, sessionClaims } = getAuth(req);
  const pathname = req.nextUrl.pathname;

  // ✅ 如果是 public route，直接放行
  const isPublic = PUBLIC_ROUTES.some((regex) => regex.test(pathname));
  if (isPublic) {
    return NextResponse.next();
  }

  // ❌ 尚未登入者導向 sign-in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 🔐 限制 /admin 僅特定 Email 可訪問
  if (pathname.startsWith("/admin")) {
    const email = sessionClaims?.email as string | undefined;
    const allowedAdmins = ["odafeng@hotmail.com"];

    if (!email || !allowedAdmins.includes(email)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

// ✅ 保留原有 matcher 設定即可
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
