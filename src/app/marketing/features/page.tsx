"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";


export default function FeaturesPage() {
  const [rightHover, setRightHover] = useState(false);
  const [leftHover, setLeftHover] = useState(false);

  return (
    <>
      <Navbar />

      {/* ✅ HERO 區塊 */}
      <section
        className="w-full"
        style={{
          background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)",
          paddingTop: "80px",
          paddingBottom: "50px",
        }}
      >
        <div className="container-custom flex flex-col lg:flex-row items-center justify-between gap-10">
          <motion.div
            className="flex-1 space-y-6 text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ fontSize: "45px", letterSpacing: "5px", lineHeight: "62px", color: "#000000", fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}>
              不會程式？沒學過統計？
            </h1>
            <p style={{ fontSize: "30px", letterSpacing: "4px", lineHeight: "56px", color: "#114A8B", fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}>
              3 秒自動產表，寫 paper 也能超前部署。
            </p>
            <p style={{ fontSize: "25px", letterSpacing: "3px", lineHeight: "42px", color: "#000000", fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}>
              ShadyTable 專為臨床研究者打造，自動選擇統計檢定、自動產表、自動產出學術摘要段落。
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setRightHover(true)}
              onMouseLeave={() => setRightHover(false)}
              className="rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-3"
              style={{ width: "252px", height: "65px", fontSize: "23px", letterSpacing: "2.5px", lineHeight: "37px", fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif' }}
            >
              <Image
                src={rightHover ? "/landing/arrow_13147905@2x.png" : "/landing/arrow_2_white@2x.png"}
                alt="arrow"
                width={24}
                height={24}
              />
              立即開始分析
            </motion.button>
          </motion.div>

          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Image
              src="/features/feature_banner_img@2x.png"
              alt="feature"
              width={450}
              height={336.72}
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        </div>
      </section>

      {/* ✅ 卡片區塊 Section */}
      <section className="w-full flex flex-col items-center bg-white py-20">
        <motion.div
          className="flex items-center"
          style={{ backgroundColor: "#E3E7F0", width: "1366px", height: "460px", borderRadius: "24px", overflow: "hidden", marginBottom: "32px" }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >

          {/* 第一列卡片（淺藍） */}
          <div
            className="flex items-center"
            style={{
              backgroundColor: "#E3E7F0",
              width: "1366px",
              height: "460px",
              borderRadius: "24px",
              overflow: "hidden",
              marginBottom: "32px",
            }}
          >
            {/* 左圖 */}
            <div
              style={{
                width: "746.67px",
                height: "420px",
                margin: "20px 0px 20px 20px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: "25px",
              }}
            >
              <Image
                src="/features/feature_img_1@2x.png"
                alt="feature1"
                width={746.67}
                height={420}
                style={{ objectFit: "contain" }}
              />
            </div>

            {/* 右文字區 */}
            <div
              className="flex flex-col"
              style={{
                marginLeft: "68.33px",
                paddingRight: "30px",
                justifyContent: "center",
              }}
            >
              <Image
                src="/features/feature_icon_1@2x.png"
                alt="icon"
                width={50}
                height={68}
                style={{ objectFit: "contain", marginBottom: "30px" }}
              />
              <h2
                style={{
                  fontSize: "30px",
                  letterSpacing: "3px",
                  lineHeight: "32px",
                  color: "#114A8B",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  marginBottom: "30px",
                }}
              >
                點選變項，自動選擇檢定
              </h2>
              <p
                style={{
                  fontSize: "20px",
                  letterSpacing: "2px",
                  lineHeight: "32px",
                  color: "#000000",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                不需任何程式經驗，只要上傳資料、選擇變項，
                <br />
                ShadyTable 會根據型別與分組自動判斷統計方法，免除你操作 SPSS 的苦。
              </p>
            </div>
          </div>
        </motion.div>

        {/* 第二列卡片（兩張） */}
        <div className="flex gap-[32px]" style={{ width: "1366px", justifyContent: "center" }}>
          <motion.div
            style={{
              width: "784px",
              height: "799px",
              backgroundColor: "#F1EDE3",
              borderRadius: "24px",
              padding: "50px 18px 20px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* 第二列左卡（米色） */}
            <div style={{ marginLeft: "64px", marginRight: "64px" }}>
                <Image
                  src="/features/feature_icon_2@2x.png"
                  alt="icon"
                  width={62}
                  height={66}
                  style={{ objectFit: "contain", marginBottom: "30px" }}
                />
                <h2
                  style={{
                    fontSize: "30px",
                    letterSpacing: "3px",
                    lineHeight: "32px",
                    color: "#114A8B",
                    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                    marginBottom: "30px",
                  }}
                >
                  GPT-4o 自動產出結果段落
                </h2>
                <p
                  style={{
                    fontSize: "20px",
                    letterSpacing: "2px",
                    lineHeight: "32px",
                    color: "#000000",
                    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  }}
                >
                  整合 OpenAI GPT-4o 模型，根據統計結果自動撰寫學術風格摘要，
                  免去手動編寫的麻煩，輕鬆貼進論文或報告中。
                </p>
              </div>

              {/* ✅ 圖片保留原本樣式不動 */}
              <div style={{ marginTop: "40px" }}>
                <Image
                  src="/features/feature_img_2@2x.png"
                  alt="feature2"
                  width={746.67}
                  height={420}
                  style={{
                    objectFit: "contain",
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            </motion.div>

          <motion.div
            style={{ width: "552px", height: "799px", backgroundColor: "#E4F0E3", borderRadius: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* ✅ 圖片獨立放上方 */}
            <div style={{ paddingTop: "20px", paddingLeft: "20px", paddingRight: "20px" }}>
              <Image
                src="/features/feature_img_3@2x.png"
                alt="feature3"
                width={509}
                height={401.5}
                style={{
                  objectFit: "contain",
                  borderRadius: "12px", // 可選
                }}
              />
            </div>

            {/* ✅ 文字內容包 padding */}
            <div style={{ padding: "0 70px 80px 70px" }}>
              <Image
                src="/features/feature_icon_3@2x.png"
                alt="icon"
                width={66}
                height={66}
                style={{ objectFit: "contain", marginBottom: "30px" }}
              />
              <h2
                style={{
                  fontSize: "30px",
                  letterSpacing: "3px",
                  lineHeight: "32px",
                  color: "#114A8B",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  marginBottom: "30px",
                }}
              >
                直覺式介面，零學習曲線
              </h2>
              <p
                style={{
                  fontSize: "20px",
                  letterSpacing: "2px",
                  lineHeight: "32px",
                  color: "#000000",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
              >
                所有步驟都以臨床思維設計，沒有繁雜選單與設定。
                拖拉點選 → 即時分析 → 視覺化結果，一氣呵成。
              </p>
            </div>
          </motion.div>
        </div>


        {/* 第三列卡片（淺藍） */}
        <motion.div
          style={{ width: "1366px", height: "530px", backgroundColor: "#E3E7F0", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 22px 20px 60px", borderRadius: "24px", marginTop: "20px" }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* 左文字 */}
          <div style={{ maxWidth: "700px" }}>
            <Image
              src="/features/feature_icon_4@2x.png"
              width={66}
              height={66}
              alt="icon"
              style={{ marginBottom: "30px" }}
            />
            <h3
              style={{
                fontFamily: "Noto Sans TC",
                fontSize: "30px",
                fontWeight: 400,
                color: "#114A8B",
                letterSpacing: "3px",
                lineHeight: "32px",
                marginBottom: "30px",
              }}
            >
              真的不需要寫程式，也不用學 SPSS
            </h3>
            <p
              style={{
                fontFamily: "Noto Sans TC",
                fontSize: "20px",
                color: "#000000",
                letterSpacing: "2px",
                lineHeight: "32px",
              }}
            >
              你可以完全不用碰程式，也不用思考「該用哪個檢定方法」。
              ShadyTable 幫你選、幫你跑、幫你寫，讓統計變得像使用 Google <br></br>一樣直覺。
            </p>
          </div>
          <Image
            src="/features/feature_img_4@2x.png"
            width={509}
            height={490}
            alt="feature4"
            style={{ objectFit: "contain" }}
          />
        </motion.div>
      </section>

      {/* ✅ Bottom CTA 區塊 */}
      <motion.section
        className="w-full flex flex-col items-center justify-center text-center"
        style={{ backgroundImage: 'url("/features/inner_page_bg@2x.png")', backgroundSize: "cover", backgroundPosition: "center", paddingTop: "80px", paddingBottom: "402px" }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <h2
          style={{
            fontSize: "40px",
            letterSpacing: "4px",
            lineHeight: "52px",
            color: "#114A8B",
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
            marginBottom: "30px", // 主標題下方間距
          }}
        >
          準備好了嗎？
        </h2>

        <p
          style={{
            fontSize: "30px",
            letterSpacing: "3px",
            lineHeight: "42px",
            color: "#000000",
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
            marginBottom: "40px", // 副標題下方間距
          }}
        >
          立即試用 ShadyTable，開始你的智慧統計之旅。
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setLeftHover(true)}
          onMouseLeave={() => setLeftHover(false)}
          className="rounded-full border text-[#0F2844] bg-transparent hover:bg-[#0F2844] hover:text-white border-[#0F2844] transition-all flex items-center justify-center gap-3"
          style={{ width: "200px", height: "65px", fontSize: "20px", letterSpacing: "2.5px", lineHeight: "37px", fontFamily: '"Noto Sans TC", "\u601D\u6E90\u9ED1\u9AD4", sans-serif', marginTop: "85px" }}
        >
          <Image
            src={leftHover ? "/landing/arrow_2_white@2x.png" : "/landing/arrow_13147905@2x.png"}
            alt="arrow"
            width={24}
            height={24}
          />
          開始分析
        </motion.button>
      </motion.section>

      <Footer />
    </>
  );
}