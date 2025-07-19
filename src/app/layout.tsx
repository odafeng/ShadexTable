import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { zhTW } from '@clerk/localizations'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "ShadyTable",
  description: "讓醫療統計變得簡單、有型、可信任。",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={zhTW} // ✅ 正確設定語言
      appearance={{
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "blockButton",
          termsPageUrl: "http://shadytable.com/marketing/terms",
        },
        elements: {
          card: "shadow-xl rounded-2xl border border-muted",
          formButtonPrimary: "bg-[#0F2844] hover:bg-[#183c6a] text-white",
        },
        variables: {
          colorPrimary: "#0F2844",
          fontFamily: '"Noto Sans TC", sans-serif',
        },
      }}
    >
      <html lang="zhTW">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
