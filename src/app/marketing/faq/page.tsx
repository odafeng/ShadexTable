"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LightButton from "@/components/LightButton";
import Navbar from "@/components/Navbar"

export default function FaqPage() {
  return (
    <><Navbar /><main className="pt-4 lg:pt-6 bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1D2939] dark:text-white min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 標題區塊 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl lg:text-4xl font-medium tracking-[5px] text-[#0F172A] dark:text-white text-center pb-2">
            常見問答
          </h1>
        </motion.div>

        {/* FAQ 卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white dark:bg-[#1E293B] rounded-2xl shadow p-6"
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="cursor-pointer">1. 統計結果可信嗎？</AccordionTrigger>
              <AccordionContent>
                可信。Shadex 的統計核心以 Python 3.13.5 運作，所有檢定邏輯均依循標準統計學教科書與慣例設計，並已於多項醫學研究中實際應用。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="cursor-pointer">2. 要如何在文章中描述所採用的統計方法？</AccordionTrigger>
              <AccordionContent>
                Shadex 的統計核心以 Python 3.13.5 運作，建議撰寫論文時在方法段中寫明："All statistical analyses were conducted using Python version 3.13.5"
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="cursor-pointer">3. 上傳資料時是否會有個資外洩風險？</AccordionTrigger>
              <AccordionContent>
                Shadex 僅在使用者本機記憶體中處理資料，不會將資料存至後端伺服器。我們建議使用者上傳前去除姓名、ID 等直接識別資訊。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="cursor-pointer">4. 哪些類型的統計檢定適用？</AccordionTrigger>
              <AccordionContent>
                包含常見的 t-test、卡方檢定、ANOVA、Mann-Whitney U test、Kruskal-Wallis 等，會依據資料型態自動選擇合適的檢定。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="cursor-pointer">5. 點數用完怎麼辦？</AccordionTrigger>
              <AccordionContent>
                使用者可於控制台查看剩餘點數，若不足可依需求加購。首次登入將自動獲得免費體驗點數。詳情請見 <Link href="/pricing_v2" className="underline">定價方案</Link>。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q6">
              <AccordionTrigger className="cursor-pointer">6. 是否能匯出統計結果表格？</AccordionTrigger>
              <AccordionContent>
                可。多組比較模式下可下載表格，AI 自動摘要亦可複製。點數不同功能將有所區分，詳見定價方案頁面。
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q7">
              <AccordionTrigger className="cursor-pointer">7. 遺漏值是怎麼處理的？</AccordionTrigger>
              <AccordionContent>
                若開啟「填補遺漏值」選項，Shadex 會自動處理缺失資料：類別變項以眾數填補，連續變項則以平均數填補。若未啟用此選項，將依各檢定方式自動排除缺失值。
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* 底部聯絡資訊 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4"
        >
          若有其他問題，歡迎來信 <a href="mailto:support@Shadex.com" className="underline">support@Shadex.com</a> 詢問。
        </motion.p>

        {/* 回首頁按鈕放底部 */}
        <div className="flex justify-center pt-4">
          <LightButton
            text="回首頁"
            href="/" />
        </div>
      </div>
    </main></>
  );
}
