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

export default function Step3Summary() {
    const { resultTable, groupVar, groupCounts } = useAnalysis();
    const router = useRouter();
    const [summaryText, setSummaryText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 10;
    const { getToken } = useAuth();
    const { refetch } = usePoints();

    useEffect(() => {
        if (!resultTable || resultTable.length === 0) {
            router.push("/step2_v2");
        }
    }, [resultTable, router]);

    if (!resultTable || resultTable.length === 0) return null;

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
        saveAs(blob, "table-summary.xlsx");
    };

    const exportToWord = async () => {
        const res = await fetch("/api/export-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resultTable, groupVar, groupCounts }),
        });

        if (!res.ok) {
            alert("❌ 匯出失敗！");
            return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "table-summary.docx";
        a.click();
        window.URL.revokeObjectURL(url);
    };

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
            const url = `${process.env.NEXT_PUBLIC_API_URL}/ai-summary`;

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data: coreData }),
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 402) {
                    toast("⚠️ 點數不足", {
                        description: "請前往購買頁面補充點數後再使用 AI 摘要功能",
                    });
                    setSummaryText("⚠️ 點數不足，請購買點數後再試");
                } else {
                    toast("❌ 系統錯誤", {
                        description: json?.detail || "AI 產生摘要失敗，請稍後再試",
                    });
                    setSummaryText(`❌ 系統錯誤：${json?.detail || "請稍後再試"}`);
                }
                return;
            }

            setSummaryText(json.summary || "❌ 無法產生摘要");
            toast("✅ AI 摘要產生完成！");
            refetch();
        } catch (err: any) {
            console.error("❌ AI Error:", err);
            toast("❌ 發生錯誤，請檢查網路或稍後再試");
            setSummaryText("❌ 發生錯誤，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    const handleCopySummary = () => {
        if (summaryText) navigator.clipboard.writeText(summaryText);
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
