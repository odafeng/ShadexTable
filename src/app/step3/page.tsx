"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import Step3Tabs from "./components/ResultsTabs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ActionButton2 from "@/components/ActionButton2";
import Image from "next/image";
import { apiClient } from "@/lib/apiClient"
import { ErrorContext, isAppError } from "@/utils/error"

export default function Step3Summary() {
    const {
        resultTable,
        groupVar,
        groupCounts,
        autoAnalysisResult,
        setAutoAnalysisResult
    } = useAnalysis();

    const router = useRouter();
    const [summaryText, setSummaryText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;
    const { getToken } = useAuth();

    useEffect(() => {
        // 🔧 安全檢查 autoAnalysisResult
        if (autoAnalysisResult && typeof autoAnalysisResult === 'object') {
            try {
                (Object.keys(autoAnalysisResult) as Array<keyof typeof autoAnalysisResult>).forEach(key => {
                    const value = autoAnalysisResult[key];

                    // 檢查是否有問題的物件結構
                    if (typeof value === 'object' && value !== null) {
                        if (
                            (value as any).type &&
                            (value as any).loc &&
                            (value as any).msg &&
                            (value as any).input
                        ) {
                            console.error("⚠️ 發現問題物件:", key, value);
                        }
                    }
                });
            } catch (e) {
                console.error("❌ autoAnalysisResult 檢查失敗:", e);
            }
        }

        if (!resultTable || resultTable.length === 0) {
            console.warn("⚠️ 没有分析结果，重定向到 Step1");
            router.push("/step1");
        } else {
            // 🔧 安全檢查 autoAnalysisResult 後再顯示 toast
            if (autoAnalysisResult?.success && typeof autoAnalysisResult.success === 'boolean') {
                toast.success("AI 智能分析完成！", {
                    description: "已自動識別變量類型並完成統計分析",
                    duration: 5000,
                });
            }
        }
    }, [resultTable, router, autoAnalysisResult]);

    if (!resultTable || resultTable.length === 0) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F2844] mx-auto mb-4"></div>
                    <p className="text-[#0F2844]">正在載入分析結果...</p>
                </div>
            </div>
        );
    }

    const baseCols = ["Variable", "P", "Method", "Missing", "Normal"];
    const exportCols = ["Variable", "P", "Method"];
    const groupKeys = Object.keys(resultTable[0] || {}).filter(
        (k) => !baseCols.includes(k)
    );
    const columns = ["Variable", ...groupKeys, "Normal", "P", "Method", "Missing"];
    const exportColumns = ["Variable", ...groupKeys, "P", "Method"];

    const filteredRows = resultTable.filter(
        (row) => row.Variable?.replace(/\*/g, "") !== groupVar && row.Variable !== "**All**"
    );
    const pageCount = Math.ceil(filteredRows.length / rowsPerPage);

    const renderCell = (val: any) => {
        if (
            val === undefined ||
            val === null ||
            val === "nan" ||
            val === "undefined" ||
            val?.toString().trim() === "—"
        ) {
            return <span className="text-gray-400 italic">&mdash;</span>;
        }
        return val;
    };

    const canExport = () => {
        if (!groupVar) return false;
        const uniqueGroups = Object.keys(groupCounts);
        return uniqueGroups.length >= 2;
    };

    const exportToExcel = () => {
        const data = filteredRows.map((row) => {
            const filtered: any = {};
            exportColumns.forEach((col) => {
                const isGroupCol = !["Variable", "Normal", "P", "Method", "Missing"].includes(col);
                const label = isGroupCol ? `${col} (n=${groupCounts[col] ?? "?"})` : col;
                filtered[label] = row[col] !== "nan" ? row[col] : "";
            });
            return filtered;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "ai-analysis-summary.xlsx");
    };

    const exportToWord = async () => {
        try {
            const blob = await apiClient.post<Blob>("/api/export-word",
                { resultTable, groupVar, groupCounts },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    context: ErrorContext.NETWORK
                }
            );

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "ai-analysis-summary.docx";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            if (isAppError(error)) {
                toast.error(error.userMessage || "匯出失敗！");
            } else {
                toast.error("匯出失敗！");
            }
        }
    };

    interface AISummaryResponse {
        summary?: string;
        data?: {
            summary?: string;
        };
    }
    // 🔧 修復後的 handleGenerateAIResult
    interface AISummaryResponse {
        summary?: string;
        data?: {
            summary?: string;
        };
    }

    const handleGenerateAIResult = async () => {
        setLoading(true);
        setSummaryText(null);

        const coreData = filteredRows
            .map((row) => {
                const summary = exportColumns
                    .map((col) => `${col}: ${row[col] ?? "—"}`)
                    .join(" | ");
                return summary;
            })
            .join("\n");

        try {
            const token = await getToken();

            const json = await apiClient.post<AISummaryResponse>("/api/table/ai-summary",
                { data: coreData },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS
                }
            );

            // 強健的摘要文本提取
            let summaryResult = "❌ 無法產生摘要";

            if (json?.summary) {
                summaryResult = json.summary;
            } else if (json?.data?.summary) {
                summaryResult = json.data.summary;
            } else {
                console.warn("⚠️ 未預期的回應格式:", json);
                summaryResult = `回應格式異常，請檢查後端 API`;
            }

            setSummaryText(summaryResult);
            toast.success("AI 摘要產生完成！");

        } catch (error) {
            if (isAppError(error)) {
                setSummaryText(`❌ ${error.userMessage}`);
                toast.error(error.userMessage);
            } else {
                setSummaryText("❌ 發生未知錯誤，請稍後再試");
                toast.error("❌ 發生錯誤，請檢查網路或稍後再試");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCopySummary = () => {
        if (summaryText) {
            navigator.clipboard.writeText(summaryText);
            toast.success("已複製到剪貼簿");
        }
    };

    return (
        <div className="bg-white">
            <Header />
            <div className="container-custom pt-[70px] lg:pt-[110px] pb-10 lg:pb-45">
                <StepNavigator />

                {/* ✅ 上方標題 */}
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-6">
                    <h1 className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4 leading-[42px] tracking-[3px] text-[#0F2844] font-normal">
                        Step 3：統計摘要
                    </h1>
                </div>

                {/* ✅ Tab 與內容區塊 */}
                <div className="w-full max-w-6xl mx-auto px-0 sm:px-6 md:px-8">
                    <Step3Tabs
                        columns={columns}
                        filteredRows={filteredRows}
                        groupCounts={groupCounts}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        pageCount={pageCount}
                        summaryText={summaryText}
                        loading={loading}
                        canExport={canExport}
                        exportToExcel={exportToExcel}
                        exportToWord={exportToWord}
                        handleGenerateAIResult={handleGenerateAIResult}
                        handleCopySummary={handleCopySummary}
                        renderCell={renderCell}
                    />
                </div>
            </div>

            <Footer />
        </div>
    );
}