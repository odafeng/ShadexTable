"use client";

import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons/ThreadsIcon";

export default function Footer() {
  return (
    <footer className="bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-gray-300 py-8 mt-8">
      <div className="max-w-screen-xl mx-auto px-8 md:px-12 xl:px-24 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        {/* Left: copyright */}
        <div className="text-center md:text-left">
          © {new Date().getFullYear()} ShadyTable by AI Medicus. All rights reserved.
        </div>

        {/* Right: link group */}
        <div className="flex gap-4 flex-wrap justify-center md:justify-end items-center">
          
          <Link
            href="/marketing/faq"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            常見問題
          </Link>

          <Link
            href="/marketing/privacy"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            隱私權政策
          </Link>
          <Link
            href="/marketing/terms"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            使用者條款
          </Link>
          <Link
            href="/marketing/technical"
            className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
          >
            技術說明文件
          </Link>

          {/* Social Icons with lucide-react */}
          <div className="flex gap-3 items-center ml-4">
            <a
              href="https://www.instagram.com/shadytable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/shadytable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.threads.net/@shadytable"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ThreadsIcon className="w-5 h-5" />
</a>
            <a
              href="mailto:support@shadytable.com"
              className="hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
