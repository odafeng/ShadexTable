"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import React from "react";




export default function AboutUsPage() {
  return (
    <>
      <Navbar />

      {/* ✅ HERO 區塊 */}
      <section className="w-full min-h-[600px]" style={{ background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)" }}>
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container-custom flex flex-col lg:flex-row items-center justify-between h-full px-6">
            <div className="flex-1 text-center mt-6 lg:text-left lg:mt-0">
              <h1 className="about-hero-title mb-4 lg:mb-6" style={{ fontSize: "45px", letterSpacing: "5px", lineHeight: "62px", color: "#000000", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                關於我們
              </h1>
              <p className="about-hero-subtitle mb-4 pl-[36px] pr-[36px] lg:mb-6 lg:pl-0 lg:pr-0" style={{ whiteSpace: "nowrap", fontSize: "35px", letterSpacing: "4px", lineHeight: "56px", color: "#114A8B", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                讓每位臨床工作者的靈感，不再死在統計裡。
              </p>
              <p className="about-hero-desc pl-[36px] pr-[36px] lg:px-0 mb-4 lg:mb-0" style={{ fontSize: "25px", letterSpacing: "3px", lineHeight: "42px", color: "#000000", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                Shadex 是一套由臨床醫師打造的智慧統計工具，誕生於我們最常見的一句話：「這研究點子不錯欸，但我沒時間跑統計...」             </p>
            </div>
            <div className="flex-1 flex justify-center items-center mt-4 mb-6">
              <Image src="/about/about_banner_img.svg" alt="About Banner" width={360} height={390.94} priority />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ✅ 我們來自臨床現場 區塊 */}
      <section className="pt-[40px] pb-4 lg:pt-2 w-full flex items-center justify-center bg-white px-2">
        <motion.div className="w-[1366px] min-h-[640px] bg-[#E3E7F0] rounded-xl flex flex-col lg:flex-row overflow-hidden shadow about-section-card"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}>
          <div className="flex-1 flex justify-center items-center">
            <div className="p-3 about-img-container">
              <Image src="/about/about_img_1.png" alt="clinical origin" width={628} height={600} style={{ objectFit: "contain" }} className="rounded-xl" />
            </div>
          </div>
          <div className="flex-1 p-4 pt-10 lg:p-10 flex flex-col justify-center lg:space-y-4">
            <h2 className="about-card-title pb-4" style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "32px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
              我們來自臨床現場
            </h2>
            <p className="about-card-text" style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
              我是一位來自台灣的大腸直腸外科主治醫師。每天穿梭於手術房與門診之間，也深知臨床研究對於改善醫療品質的重要性。<br /><br />
              在臨床第一線的經驗，讓我深刻體會到統計流程對醫師並不友善。於是我將這些需求與想法分享給團隊，作為專業顧問，協助規劃並驗證 ShadexTable 的功能與流程，期望能讓更多臨床工作者用最短時間完成高效率的分析。<br /><br />
              而「<span style={{ textDecoration: "underline", color: "#114A8B" }}>Shadex</span>」這個名字，靈感來自我們最熟悉的一個角色：那個你一喊就到、會幫你處理各種瑣事、永遠值得信賴的「<span style={{ textDecoration: "underline", color: "#114A8B" }}>學弟</span>」。<br /><br />
              <span style={{ color: "#114A8B", textDecoration: "underline" }}>
                Shadex 就是你在統計上的好學弟，一個懂臨床、會跑統計、能做表、能寫段落的 AI 智慧研究助手。
              </span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* ✅ 兩欄卡片區塊 */}
      <section className="w-full bg-white pt-2 lg:pt-6 lg:mr-2 lg:-ml-2">
        <motion.div className="w-full max-w-[1366px] mx-auto flex flex-col lg:flex-row gap-8"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* 左卡片 */}
          <div className="mx-2 lg:mx-0 max-w-[668px] max-h-[799px] lg:h-[799px] bg-[#F1EDE3] rounded-xl flex flex-col space-y-4 lg:space-y-6">
            <div className="p-4 space-y-4 lg:space-y-6">
              <h2 className="about-card-title" style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "32px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                為什麼我們決定打造 Shadex？
              </h2>
              <p className="about-card-text" style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                在醫院工作多年後，我們深刻體會到：
                <span className="text-[#114A8B] underline">臨床研究需要統計</span>
                ，但統計流程往往繁瑣又不直覺。從整理資料、跑 SPSS、產表與寫段落，每一步都可能讓靈感卡關。
                <br /><br />
                有些研究構想精彩動人，卻因統計分析耗時費力，最終無疾而終；有些臨床觀察切中要害，卻在繁忙工作中難以轉化為能被世界看見的成果。
              </p>
            </div>
            <div className="px-2 pb-2">
              <div className="relative w-full h-[260px] lg:h-[350px] overflow-hidden rounded-xl about-img-container">
                <Image src="/about/about_img_3@2x.png" alt="為什麼打造" fill style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>

          {/* 右卡片 */}
          <div className="mx-2 lg:mx-0 max-w-[668px] max-h-[799px] bg-[#E4F0E3] rounded-xl flex flex-col justify-between">
            <div className="p-2 space-y-4 lg:space-y-6">
              <div className="-mb-4 relative w-full h-[250px] lg:h-[400px] overflow-hidden rounded-xl about-img-container">
                <Image src="/about/about_img_2@2x.png" alt="Shadex 解決了什麼" fill style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div className="p-4 space-y-4 lg:p-6 lg:space-y-6">
              <h2 className="about-card-title -pt-4" style={{ color: "#114A8B", fontSize: "30px", letterSpacing: "3px", lineHeight: "42px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                Shadex 解決了什麼？
              </h2>
              <p className="about-card-text" style={{ color: "#000000", fontSize: "22px", lineHeight: "36px", fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}>
                我們打造 Shadex，目的就是：
                <span style={{ color: "#114A8B" }}>讓臨床研究者專注在研究問題，而非卡死在統計細節上。</span>
                <br />
                透過自動選擇檢定方法、自動資料品質檢查、自動產表與撰寫摘要，讓統計變得如同使用搜尋引擎一樣簡單。
                <br /><br />
                <span style={{ color: "#114A8B" }}>只要拖曳資料 → 一鍵分析 → 結果即刻可用。</span>
                <br />
                格式清晰，支援投稿與報告。
              </p>
            </div>
          </div>
        </motion.div>
      </section >

      {/* ✅ 我們的理念 區塊 */}
      < section className="w-full px-2 py-8 lg:py-16 bg-white" >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center mb-6 pb-4 lg:mb-12 lg:pb-8">
            <span className="text-[10px] align-middle mr-1">❖</span>
            <h2 className="inline-block text-[38px] lg:text-[45px]" style={{ color: "#0F2844", letterSpacing: "5px" }}>
              我們的理念
            </h2>
            <span className="text-[10px] align-middle ml-1">❖</span>
          </div>

          <div className="container-custom grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center about-grid">
            {[
              { title: "直覺操作", desc: "無需寫程式、無需學 SPSS， 上傳資料即可分析", icon: "1", size: { lg: [66, 66], sm: [42, 42] } },
              { title: "研究導向", desc: "自動產表、自動摘要，貼近期刊要求", icon: "2", size: { lg: [75.64, 66], sm: [48.14, 42] } },
              { title: "數據透明", desc: "每一個統計選擇都有依據，可追溯、可理解", icon: "3", size: { lg: [56.31, 66], sm: [35.84, 42] } },
              { title: "尊重隱私", desc: "資料僅存在使用者裝置，不經後端上傳", icon: "4", size: { lg: [73.43, 66], sm: [46.73, 42] } },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                {/* ✅ Icon container，使用 style 動態設定大小 */}
                <div
                  className="relative mb-4"
                  style={{
                    width: `${item.size.sm[0]}px`,
                    height: `${item.size.sm[1]}px`,
                  }}
                >
                  <div
                    className="hidden lg:block"
                    style={{
                      width: `${item.size.lg[0]}px`,
                      height: `${item.size.lg[1]}px`,
                      position: "relative",
                    }}
                  >
                    <Image
                      src={`/about/about_icon_${item.icon}@2x.png`}
                      alt={item.title}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="block lg:hidden w-full h-full relative">
                    <Image
                      src={`/about/about_icon_${item.icon}@2x.png`}
                      alt={item.title}
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                </div>

                {/* ✅ Title */}
                <h4 className="text-[25px] text-[#0F2844] font-semibold mb-2">{item.title}</h4>

                {/* ✅ Description */}
                <p
                  className="about-feature-desc text-[20px] px-8 sm:px-10 lg:px-0"
                  style={{ color: "#0F2844", letterSpacing: "2px", lineHeight: "32px" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>



          <div className="mt-16 w-[1366px] border-t border-gray-300 mx-auto" />
        </motion.div>
      </section >

      {/* ✅ 團隊介紹 區塊 */}
      < section className="w-full bg-no-repeat bg-cover bg-white" style={{ backgroundImage: "url('/features/inner_page_bg@2x.png')" }
      }>
        <motion.div
          className="max-w-[1366px] mx-auto text-center px-6 pt-4 lg:px-4 lg:pt-0 lg:pb-20 pb-10"
          style={{ marginTop: "-40px" }}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.42, 0, 0.58, 1] }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p
            className="text-[15px] leading-[30px] lg:text-[30px] lg:leading-[50px]"
            style={{
              letterSpacing: "3px",
              color: "#000000",
              fontFamily: '"Noto Sans TC", "思源黑體", sans-serif"',
            }}
          >
            Shadex 不只是統計工具，<br />
            而是 <span style={{ color: "#008587" }}>臨床研究者的數據拍檔</span>。<br />
            <span className="block lg:hidden">我們相信，</span>
            <span className="block lg:hidden">當醫師親自參與數據工具的設計，</span>
            <span className="block lg:hidden">才能打造出真正「懂臨床」的 AI 助手。</span>
            <span className="hidden lg:inline">
              我們相信，當醫師親自參與數據工具的設計，<br />才能打造出真正「懂臨床」的 AI 助手。
            </span>
          </p>

          <div className="mt-14 flex justify-center">
            <Image src="/about/about_icon_5@2x.png" alt="團隊 ICON" width={84.27} height={50} />
          </div>

          <h3 className="py-2" style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', fontSize: "30px", letterSpacing: "3px", lineHeight: "42px", color: "#0F2844", fontWeight: "normal", marginTop: '4px' }}>
            本團隊成員介紹
          </h3>

          <div className="w-full flex justify-center mt-6 lg:mt-8">
            <div className="text-[#0F2844] text-[16px] sm:text-[20px] font-normal leading-[24px] lg:leading-[30px]">
              <div className="grid gap-y-2 lg:grid-cols-3 lg:gap-x-12">
                {[
                  { role: "臨床醫師", name: "黃士峯（臨床醫學顧問）" },
                  { role: "前端工程師", name: "黃士峯（工程顧問）" },
                  { role: "後端工程師", name: "黃士峯（工程顧問）" },
                  { role: "資料科學家", name: "黃士峯（工程顧問）" },
                  { role: "UI/UX 設計師", name: "黃士峯（工程顧問）" },
                  { role: "產品經理(PM)", name: "吳姿儀" },
                  { role: "社群小編", name: "吳姿儀" },
                  { role: "客戶成功專員", name: "吳姿儀" },
                  { role: "法務與合規", name: "吳姿儀" },
                  { role: "行銷企劃", name: "吳姿儀" }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_auto] gap-x-2 w-fit mx-auto lg:mx-0"
                  >
                    <span className="text-right">{item.role}：</span>
                    <span className="text-left whitespace-nowrap">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
    

    </motion.div >
      </section >

    <Footer />

  {/* ✅ 僅本頁作用的 RWD Style */ }
  <style jsx>{`
        @media (max-width: 1023px) {
          .about-hero-title {
            font-size: 32px !important;
            line-height: 48px !important;
            letter-spacing: 3px !important;
          }
          .about-hero-subtitle {
            font-size: 24px !important;
            line-height: 40px !important;
            white-space: normal !important;
          }
          .about-hero-desc {
            font-size: 18px !important;
            line-height: 32px !important;
          }
          .about-card-title {
            font-size: 24px !important;
            line-height: 32px !important;
          }
          .about-card-text {
            font-size: 18px !important;
            line-height: 30px !important;
          }
          .about-feature-desc {
            font-size: 16px !important;
            line-height: 28px !important;
          }
          .about-section-card {
            flex-direction: column !important;
            height: auto !important;
          }
          .about-img-container {
            max-height: 300px !important;
          }
          .about-grid {
            grid-template-columns: 1fr !important;
          }
          .about-team-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
