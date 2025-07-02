import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // 公開頁面（不需登入就能進入）
  publicRoutes: ["/sign-in", "/sign-up"],
});

export const config = {
  // 套用這個 middleware 的路徑（幾乎整個網站）
  matcher: ["/((?!_next|.*\\..*).*)"],
};
