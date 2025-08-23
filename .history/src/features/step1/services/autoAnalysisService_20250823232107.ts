import { post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import type { DataRow } from "@/stores/analysisStore";
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    CommonErrors
} from "@/utils/error";

export interface AutoAnalysisRequest {
    parsedData: DataRow[];
    fill_na: boolean;
    groupVar?: string;  // 新增：使用者指定的分組變項
}

export interface AutoAnalysisResponse {
    success: boolean;
    message?: string;
    group_var?: string;
    cat_vars?: string[];
    cont_vars?: string[];
    classification?: Record<string, string>;  // AI 分類結果
    analysis?: {
        table?: DataRow[];
        groupCounts?: Record<string, number>;
        summary?: string;
        details?: Record<string, unknown>;
    };
}

export class AutoAnalysisService {
    /**
     * 執行自動分析
     * @param request - 包含分析資料、填補缺值設定和分組變項
     * @param token - 認證令牌
     * @returns 分析結果
     */
    async analyzeData(request: AutoAnalysisRequest, token: string): Promise<AutoAnalysisResponse> {
        const correlation_id = `auto-analysis-${Date.now()}`;

        try {
            // 驗證輸入參數
            if (!token) {
                throw CommonErrors.analysisAuthFailed();
            }

            if (!request.parsedData || request.parsedData.length === 0) {
                throw CommonErrors.insufficientData();
            }

            // 使用統一的 apiClient 進行 API 呼叫
            const result = await post<AutoAnalysisRequest, AutoAnalysisResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/ai_automation/auto-analyze`,
                request,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id,
                    timeout: 60000 // 自動分析需要較長時間
                }
            );

            // 檢查回應格式
            if (!result.success) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    'analysis.auto_failed',
                    {
                        correlation_id,
                        customMessage: result.message || "AI 自動分析處理失敗"
                    }
                );
                await reportError(error, {
                    action: "auto_analysis",
                    dataRows: request.parsedData.length,
                    groupVar: request.groupVar,
                    response: result
                });
                throw error;
            }

            // 驗證必要的回應欄位
            // 不再要求必須有 group_var，因為使用者可能選擇「不分組」
            if ((!result.cat_vars || result.cat_vars.length === 0) &&
                (!result.cont_vars || result.cont_vars.length === 0)) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "自動分析未能識別到有效的變項，請改用手動模式"
                    }
                );
                await reportError(error, {
                    action: "auto_analysis",
                    groupVar: request.groupVar,
                    response: result
                });
                throw error;
            }

            return result;

        } catch (error: unknown) {
            // 如果已經是 AppError，直接重新拋出
            if (isAppError(error) && error.code && error.userMessage) {
                throw error;
            }

            // 取得錯誤訊息
            let errorMessage = "自動分析服務連線失敗";
            if (error instanceof Error) {
                errorMessage = `自動分析服務連線失敗: ${error.message}`;
            } else if (typeof error === 'string') {
                errorMessage = `自動分析服務連線失敗: ${error}`;
            }

            // 包裝為 AppError
            const appError = createError(
                ErrorCode.NETWORK_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    correlation_id,
                    customMessage: errorMessage,
                    cause: error instanceof Error ? error : undefined
                }
            );

            await reportError(appError, {
                action: "auto_analysis",
                dataRows: request.parsedData.length,
                groupVar: request.groupVar,
                originalError: error
            });
            throw appError;
        }
    }
}

// 建立單例實例
export const autoAnalysisService = new AutoAnalysisService();