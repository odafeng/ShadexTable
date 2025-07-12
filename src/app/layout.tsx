import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import Head from 'next/head';


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
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="zh-Hant">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Toaster position="top-center" richColors />
          <AnalysisProvider>{children}</AnalysisProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
