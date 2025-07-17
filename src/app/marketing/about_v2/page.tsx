"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutUsPage() {
  return (
    <>
      <Navbar />

      {/* ✅ HERO 區塊 */}
      <section
        className="w-full"
        style={{
          height: "600px",
          background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)",
        }}
      >
        <div className="container-custom flex flex-col lg:flex-row items-center justify-between h-full px-6">
          {/* 左側文字內容 */}
          <div className="flex-1 text-left space-y-6">
            <h1
              style={{
                fontSize: "45px",
                letterSpacing: "5px",
                lineHeight: "62px",
                color: "#000000",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              }}
            >
              關於我們
            </h1>

            <p
              style={{
                fontSize: "35px",
                letterSpacing: "4px",
                lineHeight: "56px",
                color: "#114A8B",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              }}
            >
              讓每位臨床工作者的靈感，不再死在統計裡。
            </p>

            <p
              style={{
                fontSize: "25px",
                letterSpacing: "3px",
                lineHeight: "42px",
                color: "#000000",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              }}
            >
              ShadyTable 是一套由臨床醫師打造的智慧統計工具，誕生於我們最常見的一句話：「這研究點子不錯欸，但我沒時間跑統計...」
            </p>
          </div>

          {/* 右側圖片內容 */}
          <div className="flex-1 flex justify-center items-center">
            <Image
              src="/about/about_banner_img.svg"
              alt="About Banner"
              width={360}
              height={390.94}
              priority
            />
          </div>
        </div>
      </section>

      {/* ✅ 我們來自臨床現場 區塊 */}
      <section className="w-full flex items-center justify-center py-5 bg-white px-4">
        <div className="w-[1366px] h-[640px] bg-[#E3E7F0] rounded-xl flex flex-col lg:flex-row overflow-hidden shadow">
          {/* 圖片區塊 */}
          <div className="flex-1 flex justify-center items-center">
            <div className="p-3">
              <Image
                src="/about/about_img_1.png"
                alt="clinical origin"
                width={628}
                height={600}
                style={{ objectFit: "contain" }}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 文字區塊 */}
          <div className="flex-1 p-10 flex flex-col justify-center space-y-4">
            <h2
              style={{
                color: "#114A8B",
                fontSize: "30px",
                letterSpacing: "3px",
                lineHeight: "32px",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              }}
            >
              我們來自臨床現場
            </h2>

            <p
              style={{
                color: "#000000",
                fontSize: "22px",
                lineHeight: "36px",
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              }}
            >
              我是一位來自台灣的大腸直腸外科主治醫師。每天穿梭於手術房與門診之間，也深知臨床研究對於改善醫療品質的重要性。
              <br />
              <br />
              但身為第一線醫師，我也體會到統計流程對我們來說是多麼不友善。ShadyTable的誕生，正是希望能幫助像我這樣的臨床工作者，在最短時間內完成最有效率的分析。
              <br />
              <br />
              而「
              <span style={{ textDecoration: "underline", color: "#114A8B" }}>
                學弟
              </span>
              」這個名字，靈感來自我們最熟悉的一個角色：那個你一喊就到、會幫你處理各種瑣事、永遠值得信賴的存在。
              <br />
              <br />
              <span style={{ color: "#114A8B", textDecoration: "underline" }}>
                ShadyTable 就是你在統計上的好學弟，一個懂臨床、會跑統計、能做表、能寫段落的 AI 研究助手。
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ✅ 兩欄卡片區塊 */}
      <section className="w-full flex items-center justify-center py-1 bg-white px-4">
        <div className="w-[1366px] flex flex-col lg:flex-row gap-8">
          {/* 左卡片 */}
          <div className="w-[668px] h-[799px] bg-[#F1EDE3] rounded-xl flex flex-col justify-between">
            <div className="p-8 space-y-6">
              <h2
                style={{
                  color: "#114A8B",
                  fontSize: "30px",
                  letterSpacing: "3px",
                  lineHeight: "32px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                為什麼我們決定打造 ShadyTable？
              </h2>
              <p
                style={{
                  color: "#000000",
                  fontSize: "22px",
                  lineHeight: "36px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                在醫院工作多年後，我們深刻體會到：
                <span className="text-[#114A8B] underline">臨床研究需要統計</span>
                ，但統計流程往往繁瑣又不直覺。從整理資料、跑 SPSS、產表與寫段落，每一步都可能讓靈感卡關。
                <br />
                <br />
                有些研究構想精彩動人，卻因統計分析耗時費力，最終無疾而終；有些臨床觀察切中要害，卻在繁忙工作中難以轉化為能被世界看見的成果。
              </p>
            </div>
            <div className="px-5" style={{ marginBottom: "20px" }}>
              <div className="relative w-full h-[350px] overflow-hidden rounded-xl">
                <Image
                  src="/about/about_img_3@2x.png"
                  alt="為什麼打造"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </div>

          {/* 右卡片 */}
          <div className="w-[668px] h-[799px] bg-[#E4F0E3] rounded-xl flex flex-col justify-between">
            <div className="px-5 pt-5">
              <div className="relative w-full h-[400px] overflow-hidden rounded-xl">
                <Image
                  src="/about/about_img_2@2x.png"
                  alt="ShadyTable 解決了什麼"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h2
                style={{
                  color: "#114A8B",
                  fontSize: "30px",
                  letterSpacing: "3px",
                  lineHeight: "42px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                ShadyTable 解決了什麼？
              </h2>
              <p
                style={{
                  color: "#000000",
                  fontSize: "22px",
                  lineHeight: "36px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                我們打造 ShadyTable，目的就是：
                <span style={{ color: "#114A8B" }}>
                  讓臨床研究者專注在研究問題，而非卡死在統計細節上。
                </span>
                <br />
                透過自動選擇檢定方法、自動產表與摘要，讓統計變得如同使用搜尋引擎一樣簡單。
                <br />
                <br />
                <span style={{ color: "#114A8B" }}>
                  只要 3 步驟，拖曳資料 → 一鍵分析 → 結果即刻可用。
                </span>
                <br />
                格式清晰，支援投稿與報告。
              </p>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </>
  );
}