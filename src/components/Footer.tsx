"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white py-6 border-t text-sm">
      <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
        {/* 左側 Logo + 社群 icon */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Image
            src="/landing/footer_logo@2x.png"
            alt="ShadyTable Logo"
            width={153}
            height={31}
          />

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {[
              { alt: "IG", src: "/landing/ig_icon@2x.png", href: "#" },
              { alt: "FB", src: "/landing/fb_icon@2x.png", href: "#" },
              { alt: "LinkedIn", src: "/landing/linkedin_icon@2x.png", href: "#" },
              { alt: "LINE", src: "/landing/line_icon@2x.png", href: "#" },
              { alt: "Email", src: "/landing/email_icon@2x.png", href: "mailto:contact@shadytable.com" },
            ].map((item, idx) => (
              <Link key={idx} href={item.href} target="_blank" rel="noopener noreferrer">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={30}
                  height={30}
                  className="hover:brightness-0 transition"
                />
              </Link>
            ))}
          </div>
        </div>

        {/* 中間版權文字 */}
        <p
          className="text-[#A3A8B2]"
          style={{
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
          }}
        >
          © 2025 AI Medicus Inc.
        </p>

        {/* 右側連結 */}
        <div className="flex items-center gap-6 text-[#586D81] text-[15px] tracking-[1.5px]"
          style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', fontWeight: 400 }}
        >
          <Link href="/terms">使用條款</Link>
          <span>|</span>
          <Link href="/privacy">隱私權政策</Link>
          <span>|</span>
          <Link href="/docs">統計說明文件</Link>
        </div>
      </div>
    </footer>
  );
}
