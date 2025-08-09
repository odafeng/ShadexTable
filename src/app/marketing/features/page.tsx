"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";

export default function FeaturesPage() {
  const [rightHover, setRightHover] = useState(false);
  const [leftHover, setLeftHover] = useState(false);

  return (
    <>
      <Navbar />

      {/* ✅ HERO 區塊 */}
      <section
        className="w-full overflow-x-hidden"
        style={{
          background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)",
          paddingTop: "80px"
        }}
      >
        <div className="container-custom mx-auto w-full max-w-[1920px] px-5 lg:px-[277px] flex flex-col lg:flex-row items-center justify-between gap-10">
          <motion.div
            className="flex-1 space-y-6 text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="-mt-6 text-[38.3px] lg:text-[45px] leading-[58px] lg:leading-[62px] tracking-[3.4px] lg:tracking-[5px] text-black text-center lg:text-left"
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              不會程式？<br className="block lg:hidden" />
              沒學過統計？
            </h1>
            <p
              className="-mt-2 text-[26px] lg:text-[30px] tracking-[2.8px] lg:tracking-[4px] leading-[42px] lg:leading-[56px] text-[#114A8B] text-center lg:text-left"
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              3 秒自動產表，<br className="block lg:hidden" />寫 paper 也能超前部署。
            </p>

            <p
              className="text-[20px] lg:text-[25px] tracking-[2.2px] lg:tracking-[3px] leading-[34px] lg:leading-[42px] text-black text-center lg:text-left"
              style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
            >
              Shadex 專為臨床研究者打造、自動選擇統計檢定、自動產表、自動產出學術摘要段落。
            </p>
            <Link href="/step1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setRightHover(true)}
                onMouseLeave={() => setRightHover(false)}
                className="cursor-pointer mx-auto lg:mx-0 rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-3 text-[20px] lg:text-[23px] tracking-[2px] lg:tracking-[2.5px] leading-[32px] lg:leading-[37px] w-[215px] h-[50px] lg:w-[252px] lg:h-[65px]"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                <Image
                  src={
                    rightHover
                      ? "/landing/arrow_13147905@2x.png"
                      : "/landing/arrow_2_white@2x.png"
                  }
                  alt="arrow"
                  width={24}
                  height={24}
                />
                <span>立即開始分析</span>
              </motion.button>
            </Link>
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
              className="w-full max-w-[400px] h-auto"
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        </div>
      </section >

      {/* ✅ 卡片區塊 Section */}
      < section className="pt-8 lg:pt-6 w-full flex flex-col items-center bg-white py-20" >
        <div className="w-full px-4 lg:px-0 lg:pb-4">
          <motion.div
            className="w-full lg:h-[460px] pb-6 lg:pt-6"
            style={{
              maxWidth: "1366px",
              margin: "0 auto",
              borderRadius: "24px",
              overflow: "hidden",
              backgroundColor: "#E3E7F0",
              marginBottom: "34px",
            }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col lg:flex-row items-center h-full w-full">
              {/* 左圖區塊 */}
              <div
                className="w-full flex items-center justify-center pt-[15px] pl-[15px] pr-[15px] lg:pt-0 lg:pb-2 lg:h-[420px] lg:pl-[20px]"
                style={{
                  maxWidth: "746.67px", // 桌機時維持原圖寬度
                  flexShrink: 0,
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

              {/* 右側文字區塊 */}
              <div className="text-[25px] tracking-[1.5px] leading-[22px] lg:text-[30px] lg:leading-[22px] lg:tracking-[1.5px] pt-4 flex flex-col w-full px-4 lg:ml-[68.33px] lg:pr-[30px] lg:px-0 mx-auto">
                <Image
                  src="/features/feature_icon_1@2x.png"
                  alt="icon"
                  width={50}
                  height={68}
                  style={{ objectFit: "contain", marginBottom: "30px" }}
                />
                <h2
                  style={{
                    color: "#114A8B",
                    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                    marginBottom: "30px",
                  }}
                >
                  點選變項，自動選擇檢定
                </h2>
                <p className="-mt-2 lg:mt-0 text-[16px] tracking-[2px] leading-[32px] lg:text-[20px] lg:tracking-[2px] lg:leading-[32px]"
                  style={{
                    color: "#000000",
                    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  }}
                >
                  不需任何程式經驗，只要上傳資料、選擇變項，
                  <span className="hidden lg:inline"><br /></span>
                  Shadex 會根據型別與分組自動判斷統計方法，免除你操作 SPSS 的苦。
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 第二列卡片（兩張） */}
        <div className="flex flex-col lg:flex-row gap-[32px] w-full max-w-[1366px] mx-auto px-4 lg:px-0">
          {/* ✅ 米色卡片 */}
          <motion.div
            className="w-full h-auto -pb-2 lg:w-[784px] h-auto lg:h-auto"
            style={{
              backgroundColor: "#F1EDE3",
              borderRadius: "24px",
              padding: "50px 18px 30px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mx-auto lg:mx-0 block lg:px-[64px]">
              <Image
                src="/features/feature_icon_2@2x.png"
                alt="icon"
                width={62}
                height={66}
                style={{ objectFit: "contain", marginBottom: "30px" }}
              />
              <h2
                className="text-[22px] lg:text-[30px] tracking-[2px] lg:tracking-[3px] leading-[32px] text-[#114A8B]"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif', marginBottom: "30px" }}
              >
                GPT-4o 自動產出結果段落
              </h2>
              <p
                className="text-[16px] lg:text-[20px] tracking-[1.5px] lg:tracking-[2px] leading-[30px] lg:leading-[32px] text-black"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                整合 OpenAI GPT-4o 模型，根據統計結果自動撰寫學術風格摘要，
                免去手動編寫的麻煩，輕鬆貼進論文或報告中。
              </p>
            </div>

            <div className="pl-[10px] pr-[10px] lg:px-[20px] mt-6 -pb-2 lg:-pb-6">
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
                  borderRadius: "12px",
                }}
              />
            </div>
          </motion.div>

          {/* ✅ 綠色卡片 */}
          <motion.div
            className="w-full lg:w-[552px] h-auto lg:h-[799px]"
            style={{
              backgroundColor: "#E4F0E3",
              borderRadius: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start"
            }}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* ✅ 圖片區：左右10px、下方距離文字30px */}
            <div className="px-[10px] mt-6 mb-4">
              <Image
                src="/features/feature_img_3@2x.png"
                alt="feature3"
                width={509}
                height={401.5}
                style={{
                  objectFit: "contain",
                  width: "100%",
                  height: "auto",
                  borderRadius: "12px",
                }}
              />
            </div>

            {/* ✅ ICON + 文字區塊 */}
            <div className="px-4 lg:px-[70px]">
              <Image
                src="/features/feature_icon_3@2x.png"
                alt="icon"
                width={66}
                height={66}
                className="mx-0 block"
                style={{ objectFit: "contain", marginBottom: "30px" }}
              />
              <h2
                className="mb-2 text-[22px] lg:text-[30px] tracking-[2px] lg:tracking-[3px] leading-[32px] text-[#114A8B]"
                style={{
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  marginBottom: "20px",
                }}
              >
                直覺式介面，零學習曲線
              </h2>
              <p
                className="mb-6 lg:mb-4 text-[16px] lg:text-[20px] tracking-[1.5px] lg:tracking-[2px] leading-[30px] lg:leading-[32px] text-black"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                所有步驟都以臨床思維設計，沒有繁雜選單與設定。
                拖拉點選 → 即時分析 → 視覺化結果，一氣呵成。
              </p>
            </div>
          </motion.div>
        </div>



        {/* 第三列卡片（淺藍） */}
        <div className="px-4 w-full flex justify-center">
          <motion.div
            className="w-full max-w-[1366px] bg-[#E3E7F0] rounded-[24px] mt-[30px] px-4 py-6 lg:px-[60px] lg:py-[20px] flex flex-col-reverse lg:flex-row items-center justify-between"
            style={{ minHeight: "530px" }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* ✅ 左文字區塊 */}
            <div className="w-full lg:max-w-[700px] text-center lg:text-left mt-6 lg:mt-0">
              <Image
                src="/features/feature_icon_4@2x.png"
                width={66}
                height={66}
                alt="icon"
                className="mx-auto lg:mx-0 mb-[30px]"
              />
              <h3
                className="text-[22px] lg:text-[30px] tracking-[2px] lg:tracking-[3px] leading-[32px] text-[#114A8B] mb-[30px]"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                真的不需要寫程式，也不用學 SPSS
              </h3>
              <p
                className="text-[16px] lg:text-[20px] tracking-[1.5px] lg:tracking-[2px] leading-[30px] lg:leading-[32px] text-black"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                你可以完全不用碰程式，也不用思考「該用哪個檢定方法」。
                Shadex 幫你選、幫你跑、幫你寫，讓統計變得像使用 Google 一樣直覺。
              </p>
            </div>

            {/* ✅ 右圖區塊 */}
            <div className="w-full lg:w-auto px-[10px] lg:px-0">
              <Image
                src="/features/feature_img_4@2x.png"
                width={509}
                height={490}
                alt="feature4"
                className="w-full h-auto object-contain"
                style={{ borderRadius: "12px" }}
              />
            </div>
          </motion.div>
        </div>


      </section >

      {/* ✅ Bottom CTA 區塊 */}
      <motion.section
        className="w-full flex flex-col items-center justify-center text-center px-6"
        style={{
          backgroundImage: 'url("/features/inner_page_bg@2x.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingTop: "60px",
          paddingBottom: "180px", // 手機版減少 padding
          position: "relative",
        }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* ✅ 加入白色半透明遮罩以提升文字辨識度 */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0 rounded-none lg:rounded-[24px]" />

        {/* ✅ 內容層 */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <h2
            className="text-[30px] lg:text-[40px] leading-[40px] lg:leading-[52px] tracking-[3px] lg:tracking-[4px] text-[#114A8B] font-normal mb-[30px]"
            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
          >
            準備好了嗎？
          </h2>

          <p
            className="text-[20px] lg:text-[30px] leading-[32px] lg:leading-[42px] tracking-[2px] lg:tracking-[3px] text-black font-normal mb-[40px]"
            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
          >
            立即試用 Shadex，開始你的智慧統計之旅。
          </p>

          <Link href="/step1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setLeftHover(true)}
              onMouseLeave={() => setLeftHover(false)}
              className="cursor-pointer rounded-full border text-[#0F2844] bg-transparent hover:bg-[#0F2844] hover:text-white border-[#0F2844] transition-all flex items-center justify-center gap-3 w-[180px] h-[55px] lg:w-[200px] lg:h-[65px] text-[18px] lg:text-[20px] tracking-[2px] lg:tracking-[2.5px] leading-[32px] lg:leading-[37px]"
              style={{
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                marginTop: "30px",
              }}
            >
              <Image
                src={
                  leftHover
                    ? "/landing/arrow_2_white@2x.png"
                    : "/landing/arrow_13147905@2x.png"
                }
                alt="arrow"
                width={24}
                height={24}
              />
              開始分析
            </motion.button>
          </Link>
        </div>
      </motion.section>


      <Footer />
    </>
  );
}