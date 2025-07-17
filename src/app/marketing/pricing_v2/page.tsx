"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPage() {
    const [rightHover, setRightHover] = useState(false);
    const [leftHover, setLeftHover] = useState(true);
    const [hover, setHover] = useState(false);
    const [hoverPointBtn, setHoverPointBtn] = useState(false);


    return (
        <>
            <Navbar />

            {/* ✅ HERO 區塊 */}
            <section
                className="w-full"
                style={{
                    height: "500px",
                    background: "linear-gradient(180deg, #E3E7F0 0%, #FFFFFF 100%)",
                }}
            >
                <div className="container-custom flex flex-col lg:flex-row items-center justify-between h-full px-6">
                    {/* 文字區塊 */}
                    <div className="flex-1 text-left space-y-6">
                        <h1
                            className="font-normal"
                            style={{
                                fontSize: "45px",
                                letterSpacing: "5px",
                                lineHeight: "62px",
                                color: "#0F2844",
                                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                            }}
                        >
                            定價方案
                        </h1>
                        <p
                            className="font-normal"
                            style={{
                                fontSize: "35px",
                                letterSpacing: "4px",
                                lineHeight: "56px",
                                color: "#114A8B",
                                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                            }}
                        >
                            彈性點數制，依實際使用付費。<br className="hidden sm:block" />
                            首次註冊免費贈送 2 點！
                        </p>
                    </div>

                    {/* 圖片區塊 */}
                    <div className="flex-1 flex justify-center items-center">
                        <Image
                            src="/pricing/price_banner_img.svg"
                            alt="Pricing Banner"
                            width={353}
                            height={300}
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* ✅ 三張定價卡片區塊 */}
            <section className="w-full px-4 py-14 bg-white">
                <div className="container-custom flex flex-col lg:flex-row justify-center items-stretch gap-6">
                    {[
                        {
                            icon: "/pricing/price_icon_1.svg",
                            title: "統計分析",
                            price: "1–3 點",
                            unit: "/ 次",
                            desc: "依分析複雜度扣點",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#F0EDE3_100%)]",
                            features: [
                                "單組 / 雙組 / 多組分析",
                                "自動檢定與摘要表格",
                                "支援匯出格式",
                            ],
                        },
                        {
                            icon: "/pricing/price_icon_2.svg",
                            title: "AI 結果摘要",
                            price: "+1 點",
                            unit: "",
                            desc: "可加購產出報告語句",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#E3E7F0_100%)]",
                            features: ["GPT-4 驅動", "可複製修改", "支援中英文摘要"],
                        },
                        {
                            icon: "/pricing/price_icon_3.svg",
                            title: "專心研究方案",
                            price: "NT$799",
                            unit: "/ 月",
                            desc: "不限次分析，每日含 5 次 AI 摘要",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#E4F0E3_100%)]",
                            features: ["分析不再扣點", "適合教學與研究者", "AI 摘要每日重置"],
                        },
                    ].map((card, idx) => (
                        <div
                            key={idx}
                            className={`w-[442px] h-[380px] rounded-2xl shadow-md p-6 ${card.bg} flex flex-col items-center text-center`}
                        >
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Image src={card.icon} alt="icon" width={30} height={30} />
                                <h3 className="text-[30px] text-[#0F2844] leading-[44px] tracking-[3px] font-normal">
                                    {card.title}
                                </h3>
                            </div>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-[35px] text-[#114A8B] leading-[46px] tracking-[4px]">
                                    {card.price}
                                </span>
                                {card.unit && (
                                    <span className="text-[20px] text-[#555555] leading-[46px] tracking-[2px]">
                                        {card.unit}
                                    </span>
                                )}
                            </div>
                            <p className="text-[20px] text-[#555555] leading-[34px] tracking-[2px] mt-1 mb-4">
                                {card.desc}
                            </p>
                            <ul className="w-full max-w-[320px] pl-6 pr-2 space-y-2 text-left">
                                {card.features.map((text, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                        <Image
                                            src="/pricing/tick_green.svg"
                                            alt="check"
                                            width={18}
                                            height={18}
                                            className="mt-1 shrink-0"
                                        />
                                        <span className="text-[20px] text-[#0F2844] leading-[34px] tracking-[2px]">
                                            {text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ✅ 大卡片區 - 專心研究方案 */}
            <section className="w-full py-20 bg-white">
                <div className="container-custom flex flex-col items-center">
                    <h2
                        className="text-[45px] tracking-[5px] leading-[52px] text-[#0F2844] font-normal mb-10 text-center"
                        style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                    >
                        <span className="mx-[10px] text-[15px] align-middle">❖</span>點數加值方案
                        <span className="mx-[10px] text-[15px] align-middle">❖</span>
                    </h2>

                    <div
                        className="w-[1366px] h-[705px] rounded-[12px] bg-cover bg-center px-12 py-16 flex flex-col justify-center items-center relative"
                        style={{ backgroundImage: 'url("/pricing/price_unlimited_bg.jpg")' }}
                    >
                        <div className="absolute -top-3 right-5 bg-white text-[#0F2844] text-[25px] px-4 py-1 rounded-full border border-[#19A7D1]">
                            👑 專心研究方案
                        </div>

                        <Image
                            src="/pricing/price_icon_4.svg"
                            alt="icon"
                            width={60}
                            height={60}
                            className="mb-4"
                        />

                        <h3 className="text-[#0F2844] text-[40px] leading-[52px] tracking-[4px] font-normal mb-14 text-center">
                            無限分析・每日 AI 摘要
                        </h3>

                        <div className="flex items-end justify-center gap-2 mb-2">
                            <span className="text-[#114A8B] text-[45px] leading-[42px] tracking-[4.5px] font-normal">
                                NT$799
                            </span>
                            <span className="text-[#555555] text-[25px] leading-[42px] tracking-[2.5px] font-normal">
                                / 月
                            </span>
                        </div>

                        <p className="text-[#555555] text-[25px] leading-[37px] tracking-[2.5px] font-normal mb-10 text-center">
                            適合重度研究、教學與投稿使用
                        </p>

                        <div className="w-full">
                            <ul className="flex flex-col items-center gap-4 mx-auto" style={{ maxWidth: "500px" }}>
                                {[
                                    "分析次數無上限",
                                    "每日最多 5 次 AI 結果摘要",
                                    "免扣點，自由操作",
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3 items-start w-full max-w-[400px]">
                                        <Image
                                            src="/pricing/tick_green.svg"
                                            alt="check"
                                            width={20}
                                            height={20}
                                            className="mt-[6px] shrink-0"
                                        />
                                        <span className="text-[#0F2844] text-[25px] leading-[37px] tracking-[2.5px] font-normal">
                                            {text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="w-full flex justify-center mt-10">
                                <button
                                    onMouseEnter={() => setRightHover(true)}
                                    onMouseLeave={() => setRightHover(false)}
                                    className="rounded-full border text-white bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] border-[#0F2844] transition-all flex items-center justify-center gap-3 w-[252px] h-[65px] text-[23px] leading-[37px] tracking-[2.5px]"
                                    style={{
                                        fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                                    }}
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
                                    立即訂閱
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ✅ 三點方案加值區塊 */}
            <section className="w-full px-4 py-2 bg-white">
                <div className="container-custom flex flex-col lg:flex-row justify-center items-stretch gap-6">
                    {[
                        {
                            title: "單點",
                            price: "NT$60",
                            quantity: "1 點",
                            unitPrice: "NT$60.0 / 點",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F3EB_100%)]",
                            highlight: false,
                            border: false,
                        },
                        {
                            title: "三點包",
                            price: "NT$160",
                            quantity: "3 點",
                            unitPrice: "NT$53.3 / 點",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#EDF0F6_100%)]",
                            highlight: true,
                            border: true,
                        },
                        {
                            title: "十點包",
                            price: "NT$500",
                            quantity: "10 點",
                            unitPrice: "NT$50.0 / 點",
                            bg: "bg-[linear-gradient(180deg,#FFFFFF_0%,#EEF5EE_100%)]",
                            highlight: false,
                            border: false,
                        },
                    ].map((card, idx) => {
                        const [hover, setHover] = useState(false);
                        return (
                            <div
                                key={idx}
                                className={`
            relative w-[442px] h-[380px] rounded-2xl shadow-md p-6 
            ${card.bg} 
            ${card.border ? "border-[1.5px] border-[#114A8B]" : ""} 
            flex flex-col items-center text-center
          `}
                            >
                                {card.highlight && (
                                    <div className="absolute -top-3 right-5 bg-white text-[#114A8B] text-[20px] px-3 py-0.5 rounded-full border border-[#114A8B] shadow-sm">
                                        最熱門🔥
                                    </div>
                                )}

                                {/* ICON + 標題 */}
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <Image src="/pricing/price_icon_5.svg" alt="icon" width={30} height={30} />
                                    <h3 className="text-[30px] text-[#0F2844] leading-[38px] tracking-[3px] font-normal">
                                        {card.title}
                                    </h3>
                                </div>

                                <div className="w-[2px] h-8 bg-[#D9D9D9] mb-2" />

                                {/* 價格區塊 */}
                                <div className="text-[32px] text-[#114A8B] leading-[46px] tracking-[3px] mb-1">
                                    {card.price}
                                </div>
                                <div className="text-[20px] text-[#555555] tracking-[1.5px] mb-1">
                                    {card.quantity}
                                </div>
                                <div className="text-[18px] text-[#999999] tracking-[1.5px] mb-6">
                                    {card.unitPrice}
                                </div>

                                {/* CTA */}
                                <Link href="/step1" className="mt-auto">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onMouseEnter={() => setHover(true)}
                                        onMouseLeave={() => setHover(false)}
                                        className="rounded-full border text-[#0F2844] bg-transparent hover:bg-[#0F2844] hover:text-white border-[#0F2844] transition-all flex items-center justify-center gap-3"
                                        style={{
                                            width: "200px",
                                            height: "50px",
                                            fontSize: "20px",
                                            letterSpacing: "2px",
                                            lineHeight: "34px",
                                            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                                        }}
                                    >
                                        <Image
                                            src={
                                                hover
                                                    ? "/landing/arrow_2_white@2x.png"
                                                    : "/landing/arrow_13147905@2x.png"
                                            }
                                            alt="arrow"
                                            width={22}
                                            height={22}
                                        />
                                        立即購買
                                    </motion.button>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </section>
            <section
                className="w-full bg-cover bg-no-repeat bg-center"
                style={{
                    backgroundImage: 'url("/features/inner_page_bg.png")',
                    height: "770px",
                }}
            >
                <div className="container-custom flex flex-col items-center justify-center h-full px-4">
                    <div className="w-full max-w-[480px] mx-auto text-left flex flex-col items-center">
                        {/* 標題 */}
                        <h2
                            className="text-[45px] leading-[60px] tracking-[5px] font-normal text-[#0F2844] mb-10 text-center"
                            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                        >
                            <span className="text-[12px] align-middle mr-2">❖</span>
                            點數使用說明
                            <span className="text-[12px] align-middle ml-2">❖</span>
                        </h2>

                        {/* 說明文字區塊微右移 */}
                        <div className="w-full text-[24px] leading-[40px] space-y-3 text-[#0F2844] pl-16">
                            <p>・無分組分析：<span className="text-[#114A8B]">1 點</span></p>
                            <p>・雙組比較分析：<span className="text-[#114A8B]">2 點</span></p>
                            <p>・多組比較（含匯出）：<span className="text-[#114A8B]">3 點</span></p>
                            <p>・AI 結果摘要：<span className="text-[#114A8B]">+1 點</span></p>
                        </div>

                        {/* CTA 按鈕 */}
                        <button
                            className="group mt-10 flex items-center justify-center gap-2 px-6 py-2 rounded-full border border-[#0F2844] text-[#0F2844] text-[20px] tracking-[2px] hover:bg-[#0F2844] hover:text-white transition-all"
                            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                        >
                            <img
                                src="/landing/arrow_13147905@2x.png"
                                alt="arrow"
                                width={20}
                                height={20}
                                className="group-hover:hidden"
                            />
                            <img
                                src="/landing/arrow_2_white@2x.png"
                                alt="arrow-hover"
                                width={20}
                                height={20}
                                className="hidden group-hover:inline"
                            />
                            前往控制台加值點數
                        </button>

                    </div>
                </div>
            </section>


            <Footer />
        </>
    );
}
