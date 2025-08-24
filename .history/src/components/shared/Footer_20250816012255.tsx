"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const socialLinks = [
    { alt: "IG", src: "/landing/ig_icon@2x.png", href: "https://www.instagram.com/shadex_stas" },
    { alt: "FB", src: "/landing/fb_icon@2x.png", href: "https://www.facebook.com/profile.php?id=61578576480356" },
    { alt: "LINE", src: "/landing/line_icon@2x.png", href: "#" },
    { alt: "Email", src: "/landing/email_icon@2x.png", href: "mailto:support@shadex.ai" },
  ];

  return (
    <footer className="w-full bg-white py-6 border-t text-sm">
      <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
        {/* ✅ 手機版：置中 LOGO 與社群 */}
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
          {/* 品牌文字：手機版用 */}
          <h2 className="text-[#0F2844] font-bold text-xl md:hidden">ShadexTable</h2>

          {/* LOGO：桌機版用 */}
          <Image
            src="/landing/Shadex_Footer_Logo.svg"
            alt="ShadexTable Logo"
            width={153}
            height={31}
            className="hidden md:block"
          />

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.div
                  whileHover={{
                    scale: 1.15,
                    y: -3,
                    filter: "brightness(1.1) drop-shadow(0px 4px 6px rgba(0,0,0,0.1))",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={30}
                    height={30}
                    className="transition-all"
                  />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* ✅ 連結區塊（換行顯示） */}
        <div
          className="text-[#586D81] text-[15px] tracking-[1.5px] text-center"
          style={{
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          <Link href="/marketing/terms">使用條款</Link>
          <span className="mx-1">|</span>
          <Link href="/marketing/privacy">隱私權政策</Link>
          <span className="mx-1">|</span>
          <Link href="/marketing/technical">統計說明文件</Link>
          <span className="mx-1">|</span>
          <Link href="/marketing/contact">聯絡我們</Link>
        </div>


        {/* ✅ 版權文字（置中） */}
        <p
          className="text-[#A3A8B2] text-center"
          style={{
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
          }}
        >
          © 2025 DatoVivo Co. Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
