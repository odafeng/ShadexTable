// app/step3/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import Step3Tabs from "./components/ResultsTabs";
import { useTableEdit } from "@/hooks/step3_useTableEdit";
import { useAISummary } from "@/hooks/step3_useAiSummary";
import { useExport } from "@/hooks/step3_useExport";
import type { TableRow } from "./types";

export default function Step3Summary() {
  const {
    resultTable,
    groupVar,
    groupCounts,
    autoAnalysisResult
  } = useAnalysis();

  const router = useRouter();

  // 資料驗證
  useEffect(() => {
    if (!resultTable || resultTable.length === 0) {
      console.warn("⚠️ 沒有分析結果，重定向到 Step1");
      router.push("/step1");
    }
  }, [resultTable, router]);

  // 準備資料
  const filteredRows = resultTable.filter(
    (row: TableRow) => row.Variable?.replace(/\*/g, "") !== groupVar && row.Variable !== "**All**"
  );

  // Hooks
  const tableEditState = useTableEdit(filteredRows, groupCounts);
  const aiSummaryState = useAISummary();
  const exportState = useExport({
    sortedRows: tableEditState.sortedRows,
    displayNames: tableEditState.displayNames,
    groupLabels: tableEditState.groupLabels,
    binaryMappings: tableEditState.binaryMappings,
    groupCounts,
    groupVar
  });

  // Loading state
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

  // 準備欄位
  const baseCols = ["Variable", "P", "Method", "Missing", "Normal"];
  const groupKeys = Object.keys(resultTable[0] || {}).filter(
    (k) => !baseCols.includes(k)
  );
  const columns = ["Variable", ...groupKeys, "Normal", "P", "Method", "Missing"];
  const exportColumns = ["Variable", ...groupKeys, "P", "Method"];

  // AI Summary handler wrapper
  const handleGenerateAIResult = () => {
    aiSummaryState.handleGenerateAIResult(tableEditState.sortedRows, exportColumns);
  };

  return (
    <div className="bg-white">
      <Header />
      <div className="container-custom pt-[70px] lg:pt-[110px] pb-10 lg:pb-45">
        <StepNavigator />

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 mb-6">
          <h1 className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4 leading-[42px] tracking-[3px] text-[#0F2844] font-normal">
            Step 3：統計摘要
          </h1>
        </div>

        <div className="w-full max-w-6xl mx-auto px-0 sm:px-6 md:px-8">
          <Step3Tabs
            columns={columns}
            filteredRows={tableEditState.sortedRows}
            groupCounts={groupCounts}
            summaryText={aiSummaryState.summaryText}
            loading={aiSummaryState.loading}
            canExport={exportState.canExport}
            exportToExcel={exportState.handleExportToExcel}
            exportToWord={exportState.handleExportToWord}
            handleGenerateAIResult={handleGenerateAIResult}
            handleCopySummary={aiSummaryState.handleCopySummary}
            autoMode={!!autoAnalysisResult?.success}
            tableEditState={tableEditState}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}