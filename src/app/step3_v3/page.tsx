"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { usePoints } from "@/hooks/usePoints";
import { toast } from "sonner";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import Step3Tabs from "@/components/Step3Tabs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ActionButton2 from "@/components/ActionButton2";
import Image from "next/image";

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
    const { refetch } = usePoints();

    useEffect(() => {
        console.log("🔍 Step3 页面狀態檢查:");
        console.log("  - resultTable:", resultTable?.length || 0, "rows");
        console.log("  - groupVar:", groupVar, "類型:", typeof groupVar);
        console.log("  - groupCounts:", groupCounts, "類型:", typeof groupCounts);
        console.log("  - autoAnalysisResult:", autoAnalysisResult, "類型:", typeof autoAnalysisResult);

        // 🔧 安全檢查 autoAnalysisResult
        if (autoAnalysisResult && typeof autoAnalysisResult === 'object') {
            console.log("🔍 autoAnalysisResult 詳細檢查:");
            try {
                (Object.keys(autoAnalysisResult) as Array<keyof typeof autoAnalysisResult>).forEach(key => {
                    const value = autoAnalysisResult[key];
                    console.log(`    - ${key}:`, value, "類型:", typeof value);
                    
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
            router.push("/step1_v3");
        } else {
            console.log("✅ 分析结果存在，显示统计表格");
            
            // 🔧 安全檢查 autoAnalysisResult 後再顯示 toast
            if (autoAnalysisResult?.success && typeof autoAnalysisResult.success === 'boolean') {
                toast.success("🤖 AI 智能分析完成！", {
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
        const res = await fetch("/api/export-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultTable, groupVar, groupCounts }),
        });

        if (!res.ok) {
            toast.error("导出失败！");
            return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ai-analysis-summary.docx";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // 🔧 修復後的 handleGenerateAIResult
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
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/table/ai-summary`;

            console.log("🚀 發送 AI 摘要請求...");

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data: coreData }),
            });

            // 🔧 先檢查回應是否可以解析為 JSON
            let json;
            try {
                json = await res.json();
                console.log("📄 API 回應 (完整):", json);
                console.log("🔍 回應類型:", typeof json);
                console.log("🔍 summary 字段:", json.summary, "類型:", typeof json.summary);
            } catch (parseError) {
                console.error("❌ JSON 解析失敗:", parseError);
                setSummaryText("❌ 伺服器回應格式錯誤");
                toast.error("❌ 伺服器回應格式錯誤");
                return;
            }

            if (!res.ok) {
                if (res.status === 402) {
                    toast("⚠️ 點數不足", {
                        description: "請前往購買頁面補充點數後再使用 AI 摘要功能",
                    });
                    setSummaryText("⚠️ 點數不足，請購買點數後再試");
                } else {
                    const errorMsg = typeof json?.detail === 'string' ? json.detail : "AI 產生摘要失敗，請稍後再試";
                    toast("❌ 系統錯誤", { description: errorMsg });
                    setSummaryText(`❌ 系統錯誤：${errorMsg}`);
                }
                return;
            }

            // 🔧 強健的摘要文本提取 - 根據你的 API 回應格式
            let summaryResult = "❌ 無法產生摘要";
            
            try {
                // 從 Console 可以看到，summary 直接在 json.summary
                if (json && typeof json.summary === 'string') {
                    summaryResult = json.summary;
                } else if (json && json.data && typeof json.data.summary === 'string') {
                    summaryResult = json.data.summary;
                } else if (typeof json === 'string') {
                    summaryResult = json;
                } else {
                    // 如果都不是預期格式，顯示原始回應以便除錯
                    console.warn("⚠️ 未預期的回應格式:", json);
                    summaryResult = `回應格式異常，請檢查後端 API`;
                }
            } catch (extractError) {
                console.error("❌ 摘要提取失敗:", extractError);
                summaryResult = `摘要提取錯誤：${typeof extractError === "object" && extractError !== null && "message" in extractError
                    ? (extractError as { message?: string }).message
                    : String(extractError)
                }`;
            }

            console.log("✅ 最終摘要:", summaryResult.substring(0, 100) + "...");
            setSummaryText(summaryResult);
            toast.success("AI 摘要產生完成！");
            refetch();

        } catch (err: any) {
            console.error("❌ 網路或其他錯誤:", err);
            const errorMessage = err?.message || err?.toString() || "未知錯誤";
            toast.error("❌ 發生錯誤，請檢查網路或稍後再試");
            setSummaryText(`❌ 網路錯誤：${errorMessage}`);
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