"use client";
import { BrainCog, FileText, MousePointerClick } from "lucide-react";

const features = [
  {
    title: "一鍵分析",
    icon: <MousePointerClick className="w-8 h-8 text-primary" />,
    description: "自動依據變數項種類，選擇合適檢定方法"
  },
  {
    title: "AI 摘要",
    icon: <BrainCog className="w-8 h-8 text-primary" />,
    description: "自動產生 AI 結果摘要段落投稿、簡報超方便"
  },
  {
    title: "輕鬆產表",
    icon: <FileText className="w-8 h-8 text-primary" />,
    description: "一目瞭然的摘要表格輸出 Word 與 Excel"
  }
];

export default function FeatureSection() {
  return (
    <section className="w-full bg-white py-16">
      {/* ✅ 改用 container-custom */}
      <div className="container-custom grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
