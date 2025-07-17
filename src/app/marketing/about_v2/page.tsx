"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.42, 0, 0.58, 1] }, // easeInOut 對應值
  viewport: { once: true, amount: 0.3 },
};


export default function AboutUsPage() {
  return (
    <>
      <Navbar />

      {/* ✅ HERO 區塊 */}
      <section className="w-full mb-[-80px]" style={{ height: "600px", background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container-custom flex flex-col lg:flex-row items-center justify-between h-full px-6 ">
            <div className="flex-1 text-left space-y-6">
              <h1 style={{ fontSize: "45px", letterSpacing: "5px", lineHeight: "62px", color: "#000000", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                關於我們
              </h1>
              <p style={{ whiteSpace: "nowrap", fontSize: "35px", letterSpacing: "4px", lineHeight: "56px", color: "#114A8B", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                讓每位臨床工作者的靈感，不再死在統計裡。
              </p>
              <p style={{ fontSize: "25px", letterSpacing: "3px", lineHeight: "42px", color: "#000000", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                ShadyTable 是一套由臨床醫師打造的智慧統計工具，誕生於我們最常見的一句話：「這研究點子不錯欸，但我沒時間跑統計...」
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <Image src="/about/about_banner_img.svg" alt="About Banner" width={360} height={390.94} priority />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ✅ 我們來自臨床現場 區塊 */}
      <section className="w-full flex items-center justify-center py-6 bg-white px-4">
        <motion.div className="w-[1366px] h-[640px] bg-[#E3E7F0] rounded-xl flex flex-col lg:flex-row overflow-hidden shadow" 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex-1 flex justify-center items-center">
            <div className="p-3">
              <Image src="/about/about_img_1.png" alt="clinical origin" width={628} height={600} style={{ objectFit: "contain" }} className="rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-10 flex flex-col justify-center space-y-4">
            <h2 style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "32px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
              我們來自臨床現場
            </h2>
            <p style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
              我是一位來自台灣的大腸直腸外科主治醫師。每天穿梭於手術房與門診之間，也深知臨床研究對於改善醫療品質的重要性。<br /><br />
              但身為第一線醫師，我也體會到統計流程對我們來說是多麼不友善。ShadyTable的誕生，正是希望能幫助像我這樣的臨床工作者，在最短時間內完成最有效率的分析。<br /><br />
              而「<span style={{ textDecoration: "underline", color: "#114A8B" }}>學弟</span>」這個名字，靈感來自我們最熟悉的一個角色：那個你一喊就到、會幫你處理各種瑣事、永遠值得信賴的存在。<br /><br />
              <span style={{ color: "#114A8B", textDecoration: "underline" }}>
                ShadyTable 就是你在統計上的好學弟，一個懂臨床、會跑統計、能做表、能寫段落的 AI 研究助手。
              </span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* ✅ 兩欄卡片區塊 */}
      <section className="w-full flex items-center justify-center py-1 bg-white px-4">
        <motion.div className="w-[1366px] flex flex-col lg:flex-row gap-8" initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          >
          {/* 左卡片 */}
          <div className="w-[668px] h-[799px] bg-[#F1EDE3] rounded-xl flex flex-col justify-between">
            <div className="p-8 space-y-6">
              <h2 style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "32px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                為什麼我們決定打造 ShadyTable？
              </h2>
              <p style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                在醫院工作多年後，我們深刻體會到：
                <span className="text-[#114A8B] underline">臨床研究需要統計</span>
                ，但統計流程往往繁瑣又不直覺。從整理資料、跑 SPSS、產表與寫段落，每一步都可能讓靈感卡關。
                <br /><br />
                有些研究構想精彩動人，卻因統計分析耗時費力，最終無疾而終；有些臨床觀察切中要害，卻在繁忙工作中難以轉化為能被世界看見的成果。
              </p>
            </div>
            <div className="px-5 mb-5">
              <div className="relative w-full h-[350px] overflow-hidden rounded-xl">
                <Image src="/about/about_img_3@2x.png" alt="為什麼打造" fill style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>

          {/* 右卡片 */}
          <div className="w-[668px] h-[799px] bg-[#E4F0E3] rounded-xl flex flex-col justify-between">
            <div className="px-5 pt-5">
              <div className="relative w-full h-[400px] overflow-hidden rounded-xl">
                <Image src="/about/about_img_2@2x.png" alt="ShadyTable 解決了什麼" fill style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h2 style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "42px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                ShadyTable 解決了什麼？
              </h2>
              <p style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                我們打造 ShadyTable，目的就是：
                <span style={{ color: "#114A8B" }}>讓臨床研究者專注在研究問題，而非卡死在統計細節上。</span>
                <br />
                透過自動選擇檢定方法、自動產表與摘要，讓統計變得如同使用搜尋引擎一樣簡單。
                <br /><br />
                <span style={{ color: "#114A8B" }}>只要 3 步驟，拖曳資料 → 一鍵分析 → 結果即刻可用。</span>
                <br />
                格式清晰，支援投稿與報告。
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ✅ 我們的理念 區塊 */}
      <section className="w-full py-16 bg-white">
        <motion.div initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          >
          <div className="text-center mb-12 pb-8">
            <span className="text-[10px] align-middle mr-1">❖</span>
            <h2 className="inline-block" style={{ fontSize: "45px", color: "#0F2844", letterSpacing: "5px" }}>
              我們的理念
            </h2>
            <span className="text-[10px] align-middle ml-1">❖</span>
          </div>

          <div className="container-custom grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            {[
              { title: "直覺操作", desc: "無需寫程式、無需學 SPSS， 拖曳資料即可分析", icon: "1" },
              { title: "研究導向", desc: "自動產表、自動摘要，貼近期刊要求", icon: "2" },
              { title: "數據透明", desc: "每一個統計選擇都有依據，可追溯、可理解", icon: "3" },
              { title: "尊重隱私", desc: "資料僅存在使用者裝置，不經後端上傳", icon: "4" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <Image src={`/about/about_icon_${item.icon}@2x.png`} alt={item.title} width={70} height={66} className="mb-4" />
                <h4 style={{ fontSize: "25px", color: "#0F2844", fontWeight: 600 }} className="mb-2">{item.title}</h4>
                <p className="text-[20px]" style={{ color: "#0F2844", letterSpacing: "2px", lineHeight: "32px" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 w-[1366px] border-t border-gray-300 mx-auto" />
        </motion.div>
      </section>

      {/* ✅ 團隊介紹 區塊 */}
      <section className="w-full bg-no-repeat bg-cover bg-white" style={{ backgroundImage: "url('/features/inner_page_bg@2x.png')" }}>
        <motion.div className="max-w-[1366px] mx-auto text-center px-4 pt-0 pb-20" style={{ marginTop: "-40px" }} initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          >
          <p style={{ fontSize: "30px", letterSpacing: "3px", lineHeight: "50px", color: "#000000", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', whiteSpace: "pre-line" }}>
            {`ShadyTable 不只是統計工具，\n而是`}<span style={{ color: "#008587" }}>臨床研究者的數據拍檔</span>{`。\n我們相信，當醫師親自參與數據工具的設計，\n才能打造出真正「懂臨床」的 AI 助手。`}
          </p>

          <div className="mt-14 flex justify-center">
            <Image src="/about/about_icon_5@2x.png" alt="團隊 ICON" width={84.27} height={50} />
          </div>

          <h3 className="mt-10 py-0" style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', fontSize: "30px", letterSpacing: "3px", lineHeight: "42px", color: "#0F2844", fontWeight: "normal", marginTop: '4px' }}>
            本團隊成員介紹
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[20px] text-[#0F2844] mt-6 font-normal leading-[36px]">
            <div>臨床醫師：黃士峯<br />前端工程師：黃士峯<br />後端工程師：黃士峯</div>
            <div>資料科學家：黃士峯<br />UI/UX 設計師：黃士峯<br />產品經理(PM)：黃士峯<br />社群小編：黃士峯</div>
            <div>客戶成功專員：黃士峯<br />法務與合規：黃士峯<br />行銷企劃：黃士峯</div>
          </div>

          <p className="mt-6 text-[16px] text-gray-600">（沒錯，真的就只有一個人）</p>
        </motion.div>
      </section>

      <Footer />
    </>
  );
}
