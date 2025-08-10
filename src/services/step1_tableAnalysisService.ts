import { apiClient, reportError } from "@/lib/apiClient";
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    CommonErrors
} from "@/utils/error";

import { AppError } from "@/types/errors"

export interface TableAnalysisRequest {
    data: any[];
    group_col: string;
    cat_vars: string[];
    cont_vars: string[];
    fillNA: boolean;
}

export interface TableAnalysisResponse {
    success: boolean;
    message?: string;
    data?: {
        table: any[];
        groupCounts?: Record<string, number>;
    };
}

export class TableAnalysisService {

    async analyzeTable(request: TableAnalysisRequest, token: string): Promise<TableAnalysisResponse> {
        const correlationId = `table-analysis-${Date.now()}`;

        console.log("📤 請求內容:", {
            ...request,
            data: `${request.data.length} rows`
        });

        try {
            // 驗證輸入參數
            if (!token) {
                throw CommonErrors.analysisAuthFailed();
            }

            if (!request.data || request.data.length === 0) {
                throw CommonErrors.insufficientData();
            }

            // 驗證變項選擇
            if (!request.group_col &&
                (!request.cat_vars || request.cat_vars.length === 0) &&
                (!request.cont_vars || request.cont_vars.length === 0)) {
                throw CommonErrors.noVariablesSelected();
            }

            // 使用統一的 apiClient 進行 API 呼叫
            const result = await apiClient.post<TableAnalysisResponse>(
                "/api/table/table-analyze",
                request,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 60000 // 表格分析需要較長時間
                }
            );

            // 檢查回應基本格式
            if (!result.success) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlationId,
                        customMessage: result.message || "表格分析處理失敗"
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
                        correlationId,
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
                        correlationId,
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
                        correlationId,
                        customMessage: "分析結果表格格式不正確"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    tableType: typeof result.data.table
                });
                throw error;
            }

            // 檢查表格是否為空
            if (result.data.table.length === 0) {
                const error = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlationId,
                        customMessage: "分析未產生任何結果，請檢查變項設定或資料內容"
                    }
                );
                await reportError(error, {
                    action: "table_analysis",
                    request: {
                        groupCol: request.group_col,
                        catVars: request.cat_vars,
                        contVars: request.cont_vars
                    }
                });
                throw error;
            }

            console.log("✅ 表格分析成功", {
                tableRows: result.data.table.length,
                hasGroupCounts: !!result.data.groupCounts
            });

            return result;

        } catch (error: any) {
            if (isAppError(error)) {
                throw error;
            }

            // 包裝為 AppError
            const appError = createError(
                ErrorCode.NETWORK_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    correlationId,
                    customMessage: `表格分析服務連線失敗: ${error.message || error.toString()}`,
                    cause: error instanceof Error ? error : undefined
                }
            );

            await reportError(appError, {
                action: "table_analysis",
                dataRows: request.data.length,
                originalError: error,
                request: {
                    groupCol: request.group_col,
                    catVars: request.cat_vars,
                    contVars: request.cont_vars
                }
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