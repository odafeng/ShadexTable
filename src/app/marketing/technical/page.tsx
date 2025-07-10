// app/technical/page.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TechnicalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto space-y-10"
      >
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">統計方法技術文件</h1>
            <p className="text-muted-foreground text-sm">
              本頁面提供 ShadyTable 統計流程之中英對照說明與引用來源
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> 回首頁
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="zh" className="w-full">
          <TabsList className="w-full flex justify-center bg-muted rounded-xl border shadow-sm">
            <TabsTrigger value="zh" className="w-1/2 py-3 text-base font-medium">中文說明</TabsTrigger>
            <TabsTrigger value="en" className="w-1/2 py-3 text-base font-medium">English Version</TabsTrigger>
          </TabsList>

          <TabsContent value="zh">
            <div className="mt-6 rounded-xl border bg-white dark:bg-zinc-900 p-8 shadow-sm leading-relaxed text-base space-y-6 text-[#334155] dark:text-gray-200">
              <div>
                <h2 className="text-xl font-semibold mb-2">📐 統計核心理念</h2>
                <p>ShadyTable 採用 Python 為基礎，結合統計教科書與期刊慣例，自動判定合適檢定與摘要。</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">📊 支援的統計分析</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>常模檢定：Shapiro-Wilk test（預計支援 Kolmogorov–Smirnov test）</li>
                  <li>類別 vs 類別：卡方檢定、Fisher's exact test</li>
                  <li>類別 vs 連續變項：t-test / Mann-Whitney U / ANOVA / Kruskal-Wallis</li>
                  <li>配對資料：paired t-test / Wilcoxon signed-rank test（預計支援）</li>
                  <li>Logistic Regression：報告 OR、CI 與 p 值（預計支援）</li>
                  <li>KM 生存分析：log-rank test（預計支援）</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">🔐 資料隱私</h2>
                <p>資料僅在使用者本地端處理，不上傳、不儲存。建議使用前移除所有識別資訊。</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">✍️ 引用建議</h2>
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-sm text-gray-600 dark:text-gray-400">
                  All statistical analyses were performed using ShadyTable (AI Medicus, Taiwan), an online Python-based statistical tool.
                </blockquote>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="en">
            <div className="mt-6 rounded-xl border bg-white dark:bg-zinc-900 p-8 shadow-sm leading-relaxed text-base space-y-6 text-[#334155] dark:text-gray-200">
              <div>
                <h2 className="text-xl font-semibold mb-2">📐 Core Philosophy</h2>
                <p>ShadyTable is a Python-based statistical assistant built with medical research in mind. All test logic is derived from standard textbooks and common academic practices.</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">📊 Supported Methods</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Normality: Shapiro-Wilk test (Kolmogorov–Smirnov test coming soon)</li>
                  <li>Cat vs Cat: Chi-squared / Fisher’s exact</li>
                  <li>Cat vs Cont: t-test / Mann-Whitney U / ANOVA / Kruskal-Wallis</li>
                  <li>Paired: paired t-test / Wilcoxon signed-rank (planned)</li>
                  <li>Logistic regression with OR, CI, and p-value (planned)</li>
                  <li>KM survival analysis with log-rank test (planned)</li>
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">🔐 Privacy</h2>
                <p>All data is processed on the client side. No uploads or storage involved. Please remove identifiers before upload.</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">✍️ Citation</h2>
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-sm text-gray-600 dark:text-gray-400">
                  All statistical analyses were performed using ShadyTable (AI Medicus, Taiwan), an online Python-based statistical tool.
                </blockquote>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}
