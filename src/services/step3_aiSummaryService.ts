// app/step3/services/aiSummaryService.ts
import { apiClient } from "@/lib/apiClient";
import { ErrorContext, ErrorCode, createError, isAppError } from "@/utils/error";
import type { AISummaryResponse } from "@/app/step3/types";

export async function generateAISummary(
  data: string,
  token: string
): Promise<string> {
  try {
    const response = await apiClient.post<AISummaryResponse>(
      "/api/table/ai-summary",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        context: ErrorContext.ANALYSIS
      }
    );

    // 解析回應
    if (response?.summary) {
      return response.summary;
    } else if (response?.data?.summary) {
      return response.data.summary;
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