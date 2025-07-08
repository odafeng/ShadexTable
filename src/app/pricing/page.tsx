"use client";

import { motion } from "framer-motion";
import { Sparkles, BarChart3, Coins, CheckCircle2, Wallet, Flame } from "lucide-react";
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
          彈性點數制，依實際使用付費。首次註冊免費贈送 1 點！
        </p>
      </section>

      {/* 使用類型區塊 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PlanCard
          title="單次分析"
          icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
          price="1 點起"
          description="無分組、雙組或多組統計分析"
          features={["自動檢定選擇", "摘要表格產出", "支援匯出格式"]}
        />
        <PlanCard
          title="AI 摘要升級"
          icon={<Sparkles className="w-6 h-6 text-purple-600" />}
          price="+1 點"
          description="自動產生投稿/報告用語句"
          features={["GPT-4 驅動", "支援多語言", "可複製與編輯"]}
        />
        <PlanCard
          title="點數加值"
          icon={<Coins className="w-6 h-6 text-green-600" />}
          price="NT$100 起"
          description="依照需求彈性加值"
          features={["無失效期限", "可用於所有分析", "未來支援組合包優惠"]}
        />
      </section>

      {/* 儲值方案區塊 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">點數儲值方案</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "單點販售", points: 1, price: 60 },
            { name: "基礎包", points: 4, price: 200 },
            {
              name: "標準包",
              points: 12,
              price: 550,
              highlight: true,
            },
            { name: "菁英包", points: 20, price: 900 },
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
            <li>🔍 兩組比較分析：<strong>2 點</strong></li>
            <li>📈 多組比較（含匯出）：<strong>3 點</strong></li>
            <li>🧠 AI 結果摘要：<strong>+1 點</strong></li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            系統會自動依分析條件計算應扣點數。分析前請確認點數餘額。
          </p>
        </div>
      </section>

      {/* CTA 區塊 */}
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
