// app/step3/services/aiSummaryService.ts
import type { AISummaryResponse } from "@/features/step3/types";
import { post } from "@/lib/apiClient";
import { ErrorContext, ErrorCode, createError, isAppError } from "@/utils/error";

export async function generateAISummary(
  data: string,
  token: string
): Promise<string> {
  try {
    // 正確指定兩個泛型參數
    const response = await post<{ data: string }, AISummaryResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/table/ai-summary`,
      { data },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        context: ErrorContext.ANALYSIS
      }
    );
    
    const summary = response?.summary || response?.data?.summary || '';
    
    if (summary) {
      return summary;
    }
    
    throw createError(
      ErrorCode.ANALYSIS_ERROR,
      ErrorContext.ANALYSIS,
      undefined,
      {
        customMessage: "AI 摘要回應格式異常"
      }
    );
    
  } catch (error) {
    if (isAppError(error)) throw error;
    
    throw createError(
      ErrorCode.ANALYSIS_ERROR,
      ErrorContext.ANALYSIS,
      undefined,
      {
        customMessage: "AI 摘要產生失敗",
        cause: error instanceof Error ? error : undefined
      }
    );
  }
}