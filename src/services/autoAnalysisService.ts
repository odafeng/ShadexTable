import { apiClient, reportError } from "@/lib/apiClient";
import { 
  AppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  CommonErrors 
} from "@/utils/error";

export interface AutoAnalysisRequest {
    parsedData: any[];
    fillNA: boolean;
}

export interface AutoAnalysisResponse {
    success: boolean;
    message?: string;
    group_var?: string;
    cat_vars?: string[];
    cont_vars?: string[];
    analysis?: {
        table?: any;
        groupCounts?: any;
    };
}

export class AutoAnalysisService {

    async analyzeData(request: AutoAnalysisRequest, token: string): Promise<AutoAnalysisResponse> {
        const correlationId = `auto-analysis-${Date.now()}`;
        
        try {
            // 驗證輸入參數
            if (!token) {
                throw CommonErrors.analysisAuthFailed();
            }

            if (!request.parsedData || request.parsedData.length === 0) {
                throw CommonErrors.insufficientData();
            }

            // 使用統一的 apiClient 進行 API 呼叫
            const result = await apiClient.post<AutoAnalysisResponse>(
                "/api/ai_automation/auto-analyze",
                request,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
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
                        correlationId,
                        customMessage: result.message || "AI 自動分析處理失敗"
                    }
                );
                await reportError(error, { 
                    action: "auto_analysis",
                    dataRows: request.parsedData.length,
                    response: result
                });
                throw error;
            }

            // 驗證必要的回應欄位
            if (!result.group_var && 
                (!result.cat_vars || result.cat_vars.length === 0) && 
                (!result.cont_vars || result.cont_vars.length === 0)) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { 
                        correlationId,
                        customMessage: "自動分析未能識別到有效的變項，請改用手動模式"
                    }
                );
                await reportError(error, { 
                    action: "auto_analysis",
                    response: result
                });
                throw error;
            }

            return result;

        } catch (error: any) {
            // 如果已經是 AppError，直接重新拋出
            if (error instanceof AppError) {
                throw error;
            }
            
            // 包裝為 AppError
            const appError = createError(
                ErrorCode.NETWORK_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                { 
                    correlationId,
                    customMessage: `自動分析服務連線失敗: ${error.message || error.toString()}`,
                    cause: error instanceof Error ? error : undefined
                }
            );
            
            await reportError(appError, { 
                action: "auto_analysis",
                dataRows: request.parsedData.length,
                originalError: error
            });
            throw appError;
        }
    }
}