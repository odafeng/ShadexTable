// app/step3/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStore } from "@/stores/analysisStore";
import type { DataRow } from "@/stores/analysisStore";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import StepNavigator from "@/components/shared/stepNavigator";
import Step3Tabs from "@/features/step3/components/ResultsTabs";
import { useTableEdit } from "@/features/step3/hooks/useTableEdit";
import { useAISummary } from "@/features/step3/hooks/useAiSummary";
import { useExport } from "@/features/step3/hooks/useExport";
import type { TableRow } from "../types";

export default function Step3Summary() {
  // 使用選擇器只訂閱需要的狀態
  const resultTable = useAnalysisStore((state) => state.resultTable);
  const groupVar = useAnalysisStore((state) => state.groupVar);
  const groupCounts = useAnalysisStore((state) => state.groupCounts);
  const autoAnalysisResult = useAnalysisStore((state) => state.autoAnalysisResult);

  const router = useRouter();

  // 資料驗證
  useEffect(() => {
    if (!resultTable || resultTable.length === 0) {
      console.warn("⚠️ 沒有分析結果，重定向到 Step1");
      router.push("/step1");
    }
  }, [resultTable, router]);

  // 優化的轉換函數 - 使用 useMemo 避免重複計算
  const convertToTableRows = useMemo(() => {
    return (dataRows: DataRow[]): TableRow[] => {
      return dataRows
        .filter(row => row.Variable !== undefined && row.Variable !== null)
        .map((row: DataRow) => {
          // 建立符合 TableRow 類型的物件
          const tableRow: TableRow = {
            Variable: String(row.Variable), // 確保 Variable 是字串
          };
          
          // 複製所有其他屬性，保持 CellValue 類型相容性
          Object.keys(row).forEach((key: string) => {
            if (key !== 'Variable') {
              const value = row[key];
              // CellValue 已包含 undefined，不需要轉換
              tableRow[key] = value;
            }
          });
          
          return tableRow;
        });
    };
  }, []);

  // 準備資料 - 使用 useMemo 優化
  const tableRows: TableRow[] = useMemo(
    () => convertToTableRows(resultTable),
    [resultTable, convertToTableRows]
  );
  
  // 過濾資料 - 使用 useMemo 優化
  const filteredRows: TableRow[] = useMemo(
    () => tableRows.filter((row: TableRow) => {
      const cleanVariable = row.Variable.replace(/\*+/g, '');
      return cleanVariable !== groupVar && row.Variable !== "**All**";
    }),
    [tableRows, groupVar]
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
    groupVar: groupVar || undefined
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
    (k: string) => !baseCols.includes(k)
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