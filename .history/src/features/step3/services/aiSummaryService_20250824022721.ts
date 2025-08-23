// app/step3/services/aiSummaryService.ts
import type { AISummaryResponse } from "@/features/step3/types";
import { post } from "@/lib/apiClient";
import { ErrorContext, ErrorCode, createError, isAppError } from "@/utils/error";

export async function generateAISummary(
  data: string,
  token: string,
  correlationId: string | null = null
): Promise<string> {
  try {
    // 準備請求 payload
    const payload: { data: string; correlation_id?: string } = { data };
    
    // 如果有 correlation_id，加入 payload
    if (correlationId) {
      payload.correlation_id = correlationId;
    }
    
    // 準備 headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    
    // 如果有 correlation_id，也可以加入 header（雙重保障）
    if (correlationId) {
      headers["X-Correlation-ID"] = correlationId;
    }
    
    // 發送請求
    const response = await post<typeof payload, AISummaryResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/table/ai-summary`,
      payload,
      {
        headers,
        context: ErrorContext.ANALYSIS
      }
    );
    
    // 提取摘要
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