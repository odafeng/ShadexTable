"use client";

import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FeaturesPage() {
  return (
    <main className="bg-[#F8FAFC] min-h-screen text-[#1D2939]">
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 xl:px-24 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-[#0F172A]">
          為什麼選擇 ShadyTable？
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12">
          專為臨床研究打造的 AI 統計平台，不再需要繁雜的統計流程與程式碼，<br />
          從醫師思維出發，讓你輕鬆完成高品質的分析與報告。
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* 特點 1 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-blue-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">不需要程式碼，一鍵搞定</h2>
            </div>
            <p className="text-gray-700">
              不需要寫 R、Python、甚至不會 SPSS 都沒問題。
              只要點選、拖拉變項，一鍵完成所有分析與產表。
            </p>
            <Image
              src="/features/drag-drop.gif"
              alt="拖拉變項圖示"
              width={600}
              height={340}
              className="rounded-lg shadow-sm border"
            />
          </div>

          {/* 特點 2 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-blue-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">告別 SPSS 的繁瑣操作</h2>
            </div>
            <p className="text-gray-700">
              再也不用手動選統計檢定、逐一分析欄位、自己記結果。
              ShadyTable 幫你自動完成分析與摘要。
            </p>
            <Image
              src="/features/spss-vs-shady.png"
              alt="ShadyTable vs SPSS 對比"
              width={600}
              height={340}
              className="rounded-lg shadow-sm border"
            />
          </div>

          {/* 特點 3 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-blue-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">直覺式介面，為臨床思維設計</h2>
            </div>
            <p className="text-gray-700">
              完整支援類別、連續變項自動偵測與視覺化，介面乾淨、步驟明確，
              對醫師與研究者零門檻。
            </p>
            <Image
              src="/features/ui-simple.png"
              alt="使用者介面截圖"
              width={600}
              height={340}
              className="rounded-lg shadow-sm border"
            />
          </div>

          {/* 特點 4 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-blue-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="text-xl font-semibold">整合 GPT-4o，自動撰寫結果摘要</h2>
            </div>
            <p className="text-gray-700">
              使用與 ChatGPT Plus 相同等級的 GPT-4o 模型，快速生成高品質結果段落，
              免寫字、免費用，就能完成統計摘要。
            </p>
            <Image
              src="/features/ai_summary.gif"
              alt="AI 結果摘要範例"
              width={600}
              height={340}
              className="rounded-lg shadow-sm border"
            />
          </div>
        </div>

        {/* 回首頁按鈕 */}
        <div className="text-center mt-16">
          <Link href="/" passHref>
            <Button className="bg-[#0F172A] text-white hover:bg-[#1E293B] transition">
              回首頁
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
