import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { generateAISummary } from "@/features/step3/services/aiSummaryService";
import { createCoreSummaryData } from "@/features/step3/services/dataTransformService";
import type { TableRow } from "@/features/step3/types";
import { reportError } from "@/lib/reportError";
import { createErrorHandler } from "@/utils/error";
import { useAnalysisStore } from "@/stores/analysisStore";

export function useAISummary() {
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { getToken } = useAuth();
  
  // 修正：只訂閱一次，避免重複渲染
  const correlation_id = useAnalysisStore((state) => state.correlation_id);

  const handleError = createErrorHandler((appError) => {
    reportError(appError);
    setSummaryText(`⚠ ${appError.userMessage}`);
  });

  // 使用 useCallback 來穩定函數引用
  const handleGenerateAIResult = useCallback(async (
    filteredRows: TableRow[],
    exportColumns: string[]
  ) => {
    setLoading(true);
    setSummaryText(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const coreData = createCoreSummaryData(filteredRows, exportColumns);
      
      // 傳送 correlation_id 給 API
      const summary = await generateAISummary(coreData, token, correlation_id);
      setSummaryText(summary);
    } catch (error) {
      handleError(error, "AI summary generation");
    } finally {
      setLoading(false);
    }
  }, [correlation_id, getToken]); // 添加必要的依賴

  // 使用 useCallback 來穩定函數引用
  const handleCopySummary = useCallback(() => {
    if (summaryText) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [summaryText]);

  return {
    summaryText,
    loading,
    copied,
    handleGenerateAIResult,
    handleCopySummary
  };
}