"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import LightButton from "@/components/LightButton";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0F2844] font-sans">
      {/* ✅ Hero 區 */}
      <section className="w-full py-20 bg-gradient-to-b from-[#EEF2F9] to-white text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-[40px] leading-[55px] font-bold tracking-[3px] mb-4">
            現正免費測試中
          </h1>
          <p className="text-[18px] leading-[30px] tracking-[1.2px] text-[#5B6D81]">
            所有功能皆可體驗，期間內不扣點、不限次數！
            <br />
            歡迎協助測試與回饋，讓 ShadyTable 更貼近你的研究需求。
          </p>
        </motion.div>
      </section>

      {/* ✅ 免費測試卡片 */}
      <section className="w-full py-10 px-6 flex justify-center">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="border border-[#CED6E0] rounded-2xl p-8 max-w-md w-full bg-[#F8FAFC] shadow-sm text-center"
        >
          <div className="text-[28px] font-semibold tracking-[2px] mb-2">
            免費測試方案
          </div>
          <p className="text-[#5B6D81] text-[16px] leading-[28px] tracking-[1px] mb-6">
            無須註冊信用卡即可使用所有統計功能與 AI 摘要模組。
            <br />
            測試期間不會扣除點數。
          </p>
          <div className="text-[32px] font-bold text-[#008587] mb-2">NT$ 0</div>
          <div className="text-sm text-[#637381] tracking-wide mb-6">
            不限次數、不限功能，隨時體驗。
          </div>

          <Link href="/step1_v2">
            <Button className="cursor-pointer w-full rounded-2xl bg-[#0F2844] text-white hover:bg-transparent hover:text-[#0F2844] border border-[#0F2844] text-[18px] tracking-[2px] h-[50px]">
              開始分析
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ✅ CTA 區 */}
      <section className="text-center py-10">
        <p className="text-sm text-[#5B6D81] mb-4">ShadyTable 正在內測中，歡迎提供使用建議。</p>
          <div className="mt-6 sm:mt-12 flex justify-center">
            <LightButton text="回首頁" href="/" />
          </div>
      </section>
    </div>
  );
}
