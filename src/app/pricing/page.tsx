"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "免費體驗",
    price: "NT$0",
    description: "適合初次使用、探索功能",
    features: [
      "上傳表格與即時分析",
      "產生統計摘要（次數限制）",
      "部分功能試用"
    ],
    cta: "立即使用",
    href: "/sign-up"
  },
  {
    name: "專業版 Pro",
    price: "NT$499/月",
    description: "給經常使用統計分析的臨床研究者",
    features: [
      "無使用次數限制",
      "產表匯出 Word / Excel",
      "支援 CUSUM / Kaplan-Meier 分析",
      "AI 自動摘要產出段落"
    ],
    cta: "升級專業版",
    href: "/sign-up?plan=pro",
    highlight: true
  },
  {
    name: "團隊版 Team",
    price: "NT$1,999/月 起",
    description: "提供團隊協作與進階統計支援",
    features: [
      "多位帳號協作",
      "統計顧問諮詢",
      "研究專案儲存與版本管理",
      "優先客服支援"
    ],
    cta: "聯絡我們",
    href: "/contact"
  }
];

export default function PricingPage() {
  return (
    <main className="bg-[#F8FAFC] min-h-screen py-16 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-[#1D3557] mb-4">選擇最適合你的方案</h1>
        <p className="text-[#64748B] text-base">從免費體驗到團隊專業應用，ShadyTable 為你量身打造</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border shadow-sm p-6 flex flex-col justify-between bg-white hover:shadow-md transition ${
              plan.highlight ? "border-blue-600 ring-2 ring-blue-100" : "border-gray-200"
            }`}
          >
            <div>
              <h2 className="text-xl font-semibold text-[#1D3557] mb-2">{plan.name}</h2>
              <p className="text-2xl font-bold text-[#1D3557] mb-4">{plan.price}</p>
              <p className="text-sm text-[#475569] mb-6">{plan.description}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#334155]">
                    <CheckCircle2 className="w-4 h-4 text-[#457B9D] mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href={plan.href}>
              <Button
                className={`w-full mt-auto ${
                  plan.highlight
                    ? "bg-[#457B9D] text-white hover:bg-[#1D3557]"
                    : "bg-gray-100 text-[#1D3557] hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
