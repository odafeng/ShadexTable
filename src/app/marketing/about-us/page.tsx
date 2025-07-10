"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/ui/container";

export default function AboutPage() {
  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen bg-background text-foreground py-16 px-4 md:px-8"
      >
        <Container className="max-w-3xl space-y-14">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">關於我們</h1>
            <Link
              href="/"
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              回首頁
            </Link>
          </div>

          {/* Section 1: Opening Quote */}
          <section className="text-lg leading-relaxed space-y-6">
            <p className="text-xl font-semibold text-muted-foreground">
              讓每位臨床工作者的靈感，不再死在統計裡。
            </p>
            <p>
              ShadyTable 是一套由臨床醫師打造的智慧統計工具，誕生於我們最常見的一句話：
              <span className="italic">「這研究點子不錯欸，但我沒時間跑統計...」</span>
            </p>
          </section>

          <Separator />

          {/* Section 2: 問題來源 */}
          <section className="text-lg leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold">🩺 為什麼我們決定打造 ShadyTable？</h2>
            <p>
              在醫院工作多年後，我們深刻體會到：<span className="font-medium text-foreground">臨床研究需要統計</span>，但統計流程往往繁瑣又不直覺。
              從整理資料、跑 SPSS、產表與寫段落，每一步都可能讓靈感卡關。
            </p>
            <p className="text-muted-foreground">
              有些研究構想精彩動人，卻因統計分析耗時費力，最終無疾而終；
              有些臨床觀察切中要害，卻在繁忙工作中難以轉化為能被世界看見的成果。
            </p>
          </section>

          <Separator />

          {/* Section 3: 解法與差異化 */}
          <section className="text-lg leading-relaxed space-y-6">
            <h2 className="text-2xl font-bold">🚀 ShadyTable 解決了什麼？</h2>
            <p>
              我們打造 ShadyTable，目的就是：
              <span className="font-semibold">讓臨床研究者專注在研究問題，而非卡死在統計細節上。</span>
              透過自動辨識變項、自動產表與摘要，讓統計變得如同使用搜尋引擎一樣簡單。
            </p>
            <p className="font-medium">
              只要 3 步驟，拖曳資料 → 一鍵分析 → 結果即刻可用。格式清晰，支援投稿與報告。
            </p>
          </section>

          <Separator />

          {/* Section 4: 核心理念 */}
          <section className="text-lg leading-relaxed space-y-4">
            <h2 className="text-2xl font-bold">🌟 我們的理念</h2>
            <ul className="list-disc list-inside space-y-3 text-foreground">
              <li><strong>直覺操作：</strong> 無需寫程式、無需學 SPSS，拖曳資料即可分析</li>
              <li><strong>研究導向：</strong> 自動產表、自動摘要，貼近期刊要求</li>
              <li><strong>數據透明：</strong> 每一個統計選擇都有依據，可追溯、可理解</li>
              <li><strong>尊重隱私：</strong> 資料僅存在使用者裝置，不經後端上傳</li>
            </ul>
          </section>

          <Separator />

          {/* Section 5: 結語 */}
          <section className="text-center text-muted-foreground text-base pt-4 space-y-2">
            <p>
              ShadyTable 不只是統計工具，而是 <span className="font-semibold text-foreground">臨床研究者的數據拍檔</span>。
            </p>
            <p>
              我們相信，當醫師親自參與數據工具的設計，才能打造出真正「懂臨床」的 AI 助手。
            </p>
          </section>

          {/* One-man team animation */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.6 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                },
              },
            }}
            className="text-center text-sm text-muted-foreground pt-10 space-y-1"
          >
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              className="text-base font-medium text-foreground mb-2"
            >
              👨‍💻 本團隊成員介紹
            </motion.p>

            {[
              "臨床醫師",
              "前端工程師",
              "後端工程師",
              "資料科學家",
              "UI/UX 設計師",
              "產品經理（PM）",
              "社群小編",
              "客戶成功專員",
              "法務與合規",
              "行銷企劃",
            ].map((role) => (
              <motion.p
                key={role}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                {role}：黃士峯
              </motion.p>
            ))}

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              className="pt-4 text-xs italic text-gray-500 dark:text-gray-400"
            >
              （沒錯，真的就只有一個人）
            </motion.p>
          </motion.div>
        </Container>
      </motion.main>
      </>
  );
}
