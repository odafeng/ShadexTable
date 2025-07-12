// app/robots.txt/route.ts 全域禁止Google等搜尋引擎索引
import { NextResponse } from "next/server";

export function GET() {
  return new NextResponse("User-agent: *\nDisallow: /", {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
