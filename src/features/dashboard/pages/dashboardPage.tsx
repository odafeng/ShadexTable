"use client";

import { useState } from "react";

import { useUser } from "@clerk/nextjs";
import { CircleDollarSign } from "lucide-react";

import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import DarkButton from "@/components/ui/custom/DarkButton";
import { useLogs } from "@/features/auth/hooks/useLogs";
import { usePoints } from "@/features/auth/hooks/usePoints";

export default function UserDashboardPage() {
    const { user } = useUser();
    const { points } = usePoints();
    const { logs, loading } = useLogs();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const formatLocalTime = (isoString: string) => {
        const utcDate = new Date(isoString);
        const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        return localDate.toLocaleString("zh-TW", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
        });
    };

    const paginatedLogs = logs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const pageCount = Math.ceil(logs.length / itemsPerPage);

    return (
        <div className="bg-white">
            <Header />
            <div className="container-custom py-12 space-y-8 pb-0 px-4 sm:px-8">
                {/* ✅ 使用者帳號資訊 */}
                <section className="space-y-2 mt-4 lg:mt-10">
                    <h2 className="text-[26px] sm:text-[30px] leading-[38px] sm:leading-[42px] tracking-[2px] sm:tracking-[3px] text-[#0F2844] font-normal">
                        使用者控制台
                    </h2>
                    <p className="text-[#637381] text-[16px] sm:text-[18px] leading-[26px] sm:leading-[28px] break-all">
                        {user?.primaryEmailAddress?.emailAddress}
                    </p>
                </section>

                {/* ✅ 點數查詢區 */}
                <section className="relative border border-[#E0E0E0] rounded-xl p-6 -mt-12 lg:mt-0 pb-18 lg:pb-24 mb-4 lg:mb-8 bg-[#F5F7FA]">
                    <h3 className="text-[20px] sm:text-[22px] font-normal text-[#0F2844] mb-2">
                        剩餘點數
                    </h3>
                    <p className="text-[32px] sm:text-[36px] font-semibold text-[#008587]">
                        {points ?? "—"} 點
                    </p>

                    {/* ✅ 按鈕 RWD */}
                    <div className="absolute bottom-4 right-6 lg:bottom-4 lg:right-20">
                        <a
                            href="/marketing/free_mode"
                            className="w-[180px] sm:w-[200px] h-[45px] sm:h-[50px] px-5 sm:px-6 text-white border border-[#0F2844] bg-[#0F2844] hover:bg-transparent hover:text-[#0F2844] rounded-3xl text-[18px] sm:text-[20px] font-medium flex items-center justify-center gap-2"
                        >
                            <CircleDollarSign className="w-5 h-5" />
                            立即儲值
                        </a>
                    </div>
                </section>

                {/* ✅ 歷程記錄區 */}
                <section>
                    <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#0F2844] mb-2 lg:mb-6">
                        分析歷程
                    </h3>
                    {loading ? (
                        <p className="text-gray-500">讀取中...</p>
                    ) : logs.length === 0 ? (
                        <p className="text-gray-500">尚無分析紀錄</p>
                    ) : (
                        <div className="overflow-x-auto border rounded-xl">
                            <table className="w-full text-left border-collapse min-w-[640px]">
                                <thead className="bg-[#EEF2F9] text-[#0F2844] text-[16px] sm:text-[20px]">
                                    <tr>
                                        <th className="px-4 py-3 border-b whitespace-nowrap">時間</th>
                                        <th className="px-4 py-3 border-b whitespace-nowrap">使用點數</th>
                                        <th className="px-4 py-3 border-b whitespace-nowrap">組數</th>
                                        <th className="px-4 py-3 border-b whitespace-nowrap">是否 AI 摘要</th>
                                        <th className="px-4 py-3 border-b whitespace-nowrap">摘要</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#4B5563] text-[15px] sm:text-[18px] whitespace-nowrap">
                                    {paginatedLogs.map((log, idx) => (
                                        <tr key={idx} className="border-b hover:bg-[#FAFAFA]">
                                            <td className="px-4 py-2">
                                                {formatLocalTime(log.timestamp)}
                                            </td>
                                            <td className="px-4 py-2">{log.points_spent}</td>
                                            <td className="px-4 py-2">{log.group_count}</td>
                                            <td className="px-4 py-2">
                                                {log.ai_enabled ? "是" : "否"}
                                            </td>
                                            <td className="px-4 py-2">
                                                {log.summary ? (
                                                    <div className="line-clamp-2">{log.summary}</div>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* ✅ 分頁器 */}
                            <div className="flex justify-center items-center gap-4 mt-2 mb-2 text-sm sm:text-base text-[#637381] whitespace-nowrap">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="hover:text-[#008587] disabled:text-gray-300"
                                >
                                    ⬅ 上一頁
                                </button>
                                <span>
                                    Page {currentPage} / {pageCount}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pageCount}
                                    className="hover:text-[#008587] disabled:text-gray-300"
                                >
                                    下一頁 ➡
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex justify-center text-center -mt-16 mb-6">
                    <DarkButton text="回首頁" href="/" />
                </div>
            </div>
            <Footer />
        </div>
    );
}
