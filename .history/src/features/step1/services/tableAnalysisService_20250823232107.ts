import { post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import type { DataRow } from '@/stores/analysisStore';
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    CommonErrors
} from "@/utils/error";


export interface TableAnalysisRequest {
    data: DataRow[];
    group_col: string;
    cat_vars: string[];
    cont_vars: string[];
    fill_na: boolean;
}

export interface TableAnalysisResponse {
    success: boolean;
    message?: string;
    data?: {
        table: DataRow[];
        groupCounts?: Record<string, number>;
    };
}

export class TableAnalysisService {

    async analyzeTable(request: TableAnalysisRequest, token: string): Promise<TableAnalysisResponse> {
        const correlation_id = `table-analysis-${Date.now()}`;

        try {
            // 驗證 token
            if (!token || token.trim() === '') {
                throw createError(
                    ErrorCode.AUTH_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "缺少授權令牌"
                    }
                );
            }

            // 驗證 API URL
            if (!process.env.NEXT_PUBLIC_API_URL) {
                throw createError(
                    ErrorCode.SERVER_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "API URL 未配置"
                    }
                );
            }

            // 驗證資料
            if (!request.data || request.data === null) {
                throw createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorContext.DATA_VALIDATION,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "資料不足，無法進行分析"
                    }
                );
            }

            // 檢查是否為空資料（但不拋錯，允許空資料分析）
            if (request.data.length === 0) {
                // 空資料是允許的，繼續處理
            }

            // 驗證變項選擇
            const hasGroupVar = request.group_col && request.group_col.trim().length > 0;
            const hasCatVars = request.cat_vars && request.cat_vars.length > 0;
            const hasContVars = request.cont_vars && request.cont_vars.length > 0;

            if (!hasGroupVar && !hasCatVars && !hasContVars) {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "未選擇任何分析變項"
                    }
                );
            }

            // 使用統一的 apiClient 進行 API 呼叫
            const result = await post<TableAnalysisRequest, TableAnalysisResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/table/table-analyze`,
                request,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id,
                    timeout: 60000 // 表格分析需要較長時間
                }
            );

            // 檢查回應基本格式 - 檢查是否有 success 屬性
            if (result === undefined || result === null || !('success' in result)) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "表格分析處理失敗"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    dataRows: request.data.length,
                    response: result
                });
                throw error;
            }

            // 檢查 success 狀態
            if (!result.success) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: result.message || "Analysis failed due to data issues"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    dataRows: request.data.length,
                    response: result
                });
                throw error;
            }

            // 檢查是否有資料
            if (!result.data) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "分析服務未返回結果資料"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    response: result
                });
                throw error;
            }

            // 檢查表格資料
            if (!result.data.table) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "分析結果缺少表格資料"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    response: result
                });
                throw error;
            }

            if (!Array.isArray(result.data.table)) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        customMessage: "分析結果表格格式不正確"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    tableType: typeof result.data.table
                });
                throw error;
            }

            // 不檢查表格是否為空 - 空表格是合法的結果

            return result;

        } catch (error: unknown) {
            // 如果已經是 AppError，直接拋出
            if (isAppError(error)) {
                throw error;
            }

            // 處理網路錯誤
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isNetworkError = errorMessage.includes('Network') || 
                                   errorMessage.includes('timeout') ||
                                   errorMessage.includes('ECONNREFUSED');
            
            const appError = createError(
                ErrorCode.NETWORK_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    correlation_id,
                    customMessage: `表格分析服務連線失敗: ${errorMessage}`,
                    cause: error instanceof Error ? error : undefined
                }
            );

            await reportError(appError, {
                action: "table_analysis",
                dataRows: request.data?.length || 0,
                originalError: error,
                request: request.data ? {
                    groupCol: request.group_col,
                    catVars: request.cat_vars,
                    contVars: request.cont_vars
                } : undefined
            });
            throw appError;
        }
    }

    // 驗證分析請求的輔助方法
    validateAnalysisRequest(request: TableAnalysisRequest): void {
        if (!request.data || !Array.isArray(request.data) || request.data.length === 0) {
            throw CommonErrors.insufficientData();
        }

        // 檢查資料列的基本結構
        const firstRow = request.data[0];
        if (!firstRow || typeof firstRow !== 'object') {
            throw createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    customMessage: "資料格式不正確，請確認上傳的是有效的表格資料"
                }
            );
        }

        // 檢查是否有選擇變項
        const hasGroupVar = request.group_col && request.group_col.trim().length > 0;
        const hasCatVars = request.cat_vars && request.cat_vars.length > 0;
        const hasContVars = request.cont_vars && request.cont_vars.length > 0;

        if (!hasGroupVar && !hasCatVars && !hasContVars) {
            throw CommonErrors.noVariablesSelected();
        }

        // 檢查選擇的變項是否存在於資料中
        const availableColumns = Object.keys(firstRow);

        if (hasGroupVar && !availableColumns.includes(request.group_col)) {
            throw createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    customMessage: `選擇的分組變項「${request.group_col}」在資料中不存在`
                }
            );
        }

        // 檢查類別變項
        if (hasCatVars) {
            const invalidCatVars = request.cat_vars.filter(v => !availableColumns.includes(v));
            if (invalidCatVars.length > 0) {
                throw createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        customMessage: `以下類別變項在資料中不存在: ${invalidCatVars.join(', ')}`
                    }
                );
            }
        }

        // 檢查連續變項
        if (hasContVars) {
            const invalidContVars = request.cont_vars.filter(v => !availableColumns.includes(v));
            if (invalidContVars.length > 0) {
                throw createError(
                    ErrorCode.VALIDATION_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        customMessage: `以下連續變項在資料中不存在: ${invalidContVars.join(', ')}`
                    }
                );
            }
        }
    }
}