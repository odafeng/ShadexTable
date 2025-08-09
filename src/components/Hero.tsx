"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  const [leftHover, setLeftHover] = useState(false);
  const [rightHover, setRightHover] = useState(false);

  return (
    <motion.section
      className="relative w-full bg-cover bg-center bg-no-repeat pt-5 md:pt-20 pb-10"
      style={{ backgroundImage: "url('/landing/banner_bg.png')" }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <div className="container-custom">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-12 items-center">
          {/* 左側文字區 */}
          <div className="h-auto md:h-[360px] flex flex-col justify-between">
            <div className="space-y-8 text-center md:text-left">
              <motion.h1
                className="text-[#0F2844] text-[36px] md:text-[45px] leading-[48px] md:leading-[62px] text-center md:text-left font-medium md:font-semibold"
                style={{
                  letterSpacing: "5px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
              >
                <span className="hidden md:inline">臨床研究分析，一鍵完成</span>
                <span className="inline md:hidden">
                  臨床研究分析
                  <br />
                  <span className="block mt-2">一鍵完成</span>
                </span>
              </motion.h1>


              <motion.p
                className="-mt-2 md:mt-4 text-[#0F2844] font-normal leading-[42px] text-[22px] md:text-[25px]"
                style={{
                  letterSpacing: "3px",
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                全台灣第一款<span className="inline md:hidden"><br /></span>專為臨床研究人員打造的<br />
                雲端統計工具
              </motion.p>
            </div>

            {/* CTA 按鈕區 */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {/* 左側按鈕 */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={() => setLeftHover(true)}
                onMouseLeave={() => setLeftHover(false)}
                className="
    rounded-full border text-[#0F2844] bg-transparent 
    hover:bg-[#0F2844] hover:text-white border-[#0F2844] 
    transition-all flex items-center justify-center gap-3
    w-[265px] h-[50px] text-[21px] 
    md:w-[300px] md:h-[65px] md:text-[25px]
    font-normal md:font-medium
    leading-[34px] md:leading-[37px]
    tracking-[1.5px] md:tracking-[2.5px]
    font-['Noto Sans TC','思源黑體',sans-serif] cursor-pointer
  "
              >
                <motion.div
                  animate={{ rotate: leftHover ? 15 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image
                    src={
                      leftHover
                        ? "/landing/play_13198001@2x.png"
                        : "/landing/video_icon@2x.png"
                    }
                    alt="arrow"
                    width={24}
                    height={24}
                  />
                </motion.div>
                觀看示範影片
              </motion.button>


              {/* 右側按鈕 */}
              <Link href="/step1" passHref>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={() => setRightHover(true)}
                  onMouseLeave={() => setRightHover(false)}
                  className="
      rounded-full border text-white bg-[#0F2844] 
      hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] 
      transition-all flex items-center justify-center gap-3
      w-[265px] h-[50px] text-[21px]
      md:w-[300px] md:h-[65px] md:text-[25px]
      font-normal md:font-medium
      leading-[34px] md:leading-[37px]
      tracking-[1.5px] md:tracking-[2.5px]
      font-['Noto Sans TC','思源黑體',sans-serif] cursor-pointer
    "
                >
                  <motion.div
                    animate={{ rotate: rightHover ? 15 : 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
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
                  </motion.div>
                  立即開始分析
                </motion.button>
              </Link>

            </motion.div>
          </div>

          {/* 右側影片區：保留手機版，縮小寬度 */}
          <motion.div
            className="relative w-full max-w-[360px] md:max-w-xl mx-auto"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          >
            <div className="aspect-video w-full overflow-hidden rounded-xl shadow-lg border border-[#ccc]">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source
                  src="https://res.cloudinary.com/dpmewq6aj/video/upload/v1752939090/NewUI_4KHD_hkxnst.mp4"
                  type="video/mp4"
                />
                您的瀏覽器不支援影片播放。
              </video>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
