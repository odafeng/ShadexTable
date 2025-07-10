"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  BarChart3,
  Coins,
  CheckCircle2,
  Wallet,
  Flame,
  Infinity,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 頁面標題 */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">定價方案</h1>
        <p className="text-muted-foreground text-lg">
          彈性點數制，依實際使用付費。首次註冊免費贈送 <strong>2 點</strong>！
        </p>
      </section>

      {/* 功能區塊 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PlanCard
          title="統計分析"
          icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
          price="1–3 點 / 次"
          description="依分析複雜度扣點"
          features={["單組 / 雙組 / 多組分析", "自動檢定與摘要表格", "支援匯出格式"]}
        />
        <PlanCard
          title="AI 結果摘要"
          icon={<Sparkles className="w-6 h-6 text-purple-600" />}
          price="+1 點"
          description="可加購產出報告語句"
          features={["GPT-4 驅動", "可複製修改", "支援中英文摘要"]}
        />
        <PlanCard
          title="專心研究方案"
          icon={<Infinity className="w-6 h-6 text-red-500" />}
          price="NT$799 / 月"
          description="不限次分析，每日含 5 次 AI 摘要"
          features={["分析不再扣點", "適合教學與研究者", "AI 摘要每日重置"]}
        />
      </section>

      {/* 儲值方案區塊 */}
      <section className="space-y-6">
  <h2 className="text-2xl font-semibold text-center">點數加值方案</h2>

  {/* 🌟 專心研究方案 - 獨立尊爵卡 */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center max-w-xl mx-auto relative"
  >
    <div className="absolute -top-3 right-3 bg-yellow-400 text-black text-xs px-3 py-0.5 rounded-full font-semibold shadow">
      👑 專心研究方案
    </div>
    <Infinity className="w-8 h-8 mb-3" />
    <h3 className="text-2xl font-bold">無限分析 · 每日 AI 摘要</h3>
    <p className="text-4xl font-bold mt-2 mb-1">NT$799<span className="text-lg font-medium"> / 月</span></p>
    <p className="text-sm opacity-90 mb-4">適合重度研究、教學與投稿使用</p>
    <ul className="text-sm space-y-1 mb-6">
      <li>✅ 分析次數無上限</li>
      <li>✅ 每日最多 5 次 AI 結果摘要</li>
      <li>✅ 免扣點，自由操作</li>
    </ul>
    <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90 font-semibold px-6 py-2">
      立即訂閱
    </Button>
  </motion.div>

  {/* 🔢 點數方案卡片群 */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-8">
    {[
      { name: "單點", points: 1, price: 60 },
      {
        name: "三點包",
        points: 3,
        price: 160,
        highlight: true,
      },
      { name: "十點包", points: 10, price: 500 },
    ].map(({ name, points, price, highlight }) => (
      <motion.div
        key={name}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`border rounded-lg p-5 bg-white shadow-sm flex flex-col items-center text-center relative ${
          highlight ? "ring-2 ring-blue-500" : ""
        }`}
      >
        {highlight && (
          <div className="absolute -top-3 right-3 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" /> 最熱門
          </div>
        )}
        <Wallet className="w-6 h-6 text-green-600 mb-2" />
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-3xl font-bold text-primary mt-1 mb-2">NT${price}</p>
        <p className="text-sm text-muted-foreground mb-1">{points} 點</p>
        <p className="text-xs text-gray-500 mb-4">
          NT${(price / points).toFixed(1)} / 點
        </p>
        <Button size="sm" className="mt-auto w-full">
          立即購買
        </Button>
      </motion.div>
    ))}
  </div>
</section>

      {/* 點數使用說明 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">點數使用說明</h2>
        <div className="max-w-md mx-auto text-sm bg-gray-50 rounded-lg border p-6 space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>📊 無分組分析：<strong>1 點</strong></li>
            <li>🔍 雙組比較分析：<strong>2 點</strong></li>
            <li>📈 多組比較（含匯出）：<strong>3 點</strong></li>
            <li>🧠 AI 結果摘要：<strong>+1 點</strong></li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            註冊即可獲得 2 點試用點數，可混用以上任一功能。系統將依分析條件自動計算扣點。
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
        <Link href="/dashboard/points">
          <Button className="text-base px-6 py-3 text-white bg-blue-600 hover:bg-blue-700">
            前往控制台加值點數
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="text-base">
            回首頁
          </Button>
        </Link>
      </section>
    </motion.div>
  );
}

function PlanCard({
  title,
  icon,
  price,
  description,
  features,
}: {
  title: string;
  icon: React.ReactNode;
  price: string;
  description: string;
  features: string[];
}) {
  return (
    <motion.div
      className="border rounded-xl shadow-sm bg-white p-6 flex flex-col justify-between"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </div>
        <div className="text-3xl font-bold text-blue-700">{price}</div>
        <p className="text-muted-foreground text-sm">{description}</p>
        <ul className="pt-4 space-y-1 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
