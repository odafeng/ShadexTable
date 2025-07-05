"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#1D2939]">
      {/* Header */}
      <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="text-2xl font-semibold tracking-wide flex items-center gap-2">
          <Image src="/logo/shady_logo_light.svg" alt="ShadyTable Logo" width={32} height={32} />
          ShadyTable
        </div>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex space-x-6 text-sm">
            <a href="#" className="hover:text-blue-400">功能特色</a>
            <a href="#" className="hover:text-blue-400">定價方案</a>
            <a href="#" className="hover:text-blue-400">常見問題</a>
            <a href="#" className="hover:text-blue-400">關於我們</a>
          </nav>
          <div className="flex gap-2">
            <Button variant="secondary" className="text-sm font-medium">登入</Button>
            <Button className="bg-white text-[#0F172A] hover:bg-gray-100 text-sm font-medium">立即體驗</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-16 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            臨床研究分析，<br className="hidden md:block" />一鍵完成。
          </h1>
          <p className="text-lg mb-8 text-[#475569]">
            自動統計方法選擇，一鍵產生表格與摘要<br />
            只需3步驟
          </p>
          <div className="flex gap-4 flex-wrap">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-base px-6 py-2">立即體驗免費方案</Button>
            <span className="text-[#64748B] text-sm self-center">觀看 30 秒示範影片</span>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/screenshots/result_preview.png"
            alt="Upload Preview"
            width={500}
            height={300}
            className="rounded-xl border shadow-xl"
          />
          <Card className="absolute bottom-[-40px] right-[-40px] w-[260px] shadow-xl">
            <CardContent className="p-4 text-sm">
              <p className="font-medium mb-2">Summary</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Fromand Slans and Global Charateaties</p>
                <p>Allli. secenten sou neouentment (swamnal)</p>
                <p>SPSS 0.05  0.06  0.06</p>
              </div>
              <Button variant="outline" className="w-full mt-4 gap-2">
                <Download size={16} /> Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white px-6 md:px-16 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <Image src="/icons/barchart-filled.svg" alt="分析圖示" width={64} height={64} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">一鍵分析</h3>
          <p className="text-sm text-[#64748B]">
            ⾃動依據變項種類，<br />選擇合適檢定方法
          </p>
        </div>
        <div>
          <Image src="/icons/brain-filled.svg" alt="AI 摘要圖示" width={64} height={64} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">AI 摘要</h3>
          <p className="text-sm text-[#64748B]">
            ⾃動產生AI結果摘要段落<br />投稿、報告超方便
          </p>
        </div>
        <div>
          <Image src="/icons/file-export-filled.svg" alt="Word Excel圖示" width={64} height={64} className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">輕鬆產表</h3>
          <p className="text-sm text-[#64748B]">
            一目瞭然的摘要表格<br />Word 與 Excel 匯出
          </p>
        </div>
      </section>
    </main>
  );
}
