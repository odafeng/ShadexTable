"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const features = [
  {
    title: "一鍵分析",
    icon: "/landing/home_icon_1@2x.png",
    iconSize: { width: 70.35, height: 66 },
    gradient: "bg-gradient-to-b from-white to-[#F0EDE3]",
    description: "自動依據變數項種類，選擇合適檢定方法",
  },
  {
    title: "AI 摘要",
    icon: "/landing/home_icon_2@2x.png",
    iconSize: { width: 79.99, height: 66 },
    gradient: "bg-gradient-to-b from-white to-[#E3E7F0]",
    description: "自動產生 AI 結果摘要段落投稿、簡報超方便",
  },
  {
    title: "輕鬆產表",
    icon: "/landing/home_icon_3@2x.png",
    iconSize: { width: 52.86, height: 66 },
    gradient: "bg-gradient-to-b from-white to-[#E4F0E3]",
    description: "一目瞭然的摘要表格輸出 Word 與 Excel",
  },
];

export default function FeatureSection() {
  return (
    <section className="w-full bg-white py-16">
      <div className="container-custom grid grid-cols-1 md:grid-cols-3 gap-8 place-items-center">
        {features.map((f, index) => {
          const paddingMap = [78, 68, 83];
          const padding = paddingMap[index];

          return (
            <motion.div
              key={f.title}
              className={`
                w-full max-w-[442px] h-[328px] rounded-xl border border-gray-200 ${f.gradient}
                shadow-sm flex flex-col justify-center items-center text-center px-6
              `}
              whileHover={{
                scale: 1.04,
                boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.15)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Icon 動畫 */}
              <motion.div
                whileHover={{ scale: 1.1, y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={f.icon}
                  alt={f.title}
                  width={f.iconSize.width}
                  height={f.iconSize.height}
                  className="mb-6"
                />
              </motion.div>

              {/* 標題 */}
              <h3
                className="text-[#0F2844] mb-3"
                style={{
                  fontSize: "25px",
                  letterSpacing: "3px",
                  lineHeight: "42px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  fontWeight: 400,
                }}
              >
                {f.title}
              </h3>

              {/* 描述文字 */}
              <p
                className="text-[#0F2844] text-left w-full"
                style={{
                  fontSize: "16px",
                  letterSpacing: "2px",
                  lineHeight: "32px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  fontWeight: 400,
                  paddingLeft: `${padding}px`,
                  paddingRight: `${padding}px`,
                }}
              >
                {f.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
