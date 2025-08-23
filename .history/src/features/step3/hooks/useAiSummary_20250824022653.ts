import { useState } from "react";

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
  
  // 從 store 獲取 correlation_id
  const correlation_id = useAnalysisStore((state) => state.correlation_id);

  const handleError = createErrorHandler((appError) => {
    reportError(appError);
    setSummaryText(`⌈ ${appError.userMessage}`);
  });

  const handleGenerateAIResult = async (
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
  };

  const handleCopySummary = () => {
    if (summaryText) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return {
    summaryText,
    loading,
    copied,
    handleGenerateAIResult,
    handleCopySummary
  };
}