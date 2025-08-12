// step1_fileAnalysisService.ts
import { FileProcessor } from "@/utils/fileProcessor";
import { SensitiveDataDetector } from "@/features/step1/services/sensitiveDataDetector";
import { createError, ErrorCode, ErrorContext, CommonErrors } from "@/utils/error";
import { AppError } from "@/types/errors"
// 移除未使用的 apiClient
import { post } from "@/lib/apiClient";
// 從 analysisStore 引入類型
import type { DataRow } from "@/stores/analysisStore";

// 定義錯誤類型
interface ServiceError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

// 定義檔案資訊類型
interface FileInfo {
    name: string;
    size: number;
    rows: number;
    columns: number;
    hasMultipleSheets?: boolean;
}

export interface FileAnalysisResult {
    success: boolean;
    data?: DataRow[];
    fileInfo?: FileInfo;
    sensitiveColumns?: string[];
    suggestions?: string[];
    warnings?: string[];
    error?: ServiceError | AppError;
}

export interface ColumnProfile {
    column: string;
    missing_pct: string;
    suggested_type: string;
}

interface AutoAnalysisResponse {
    success: boolean;
    message?: string;
    group_var?: string;
    cat_vars?: string[];
    cont_vars?: string[];
    classification?: Record<string, string>;
    analysis?: {
        summary?: string;
        details?: Record<string, unknown>;
    };
    confidence?: number;
    suggestions?: string[];
}

// 定義請求類型
interface ColumnAnalysisRequest {
    data: DataRow[];
}

interface AutoAnalysisRequest {
    parsedData: DataRow[];
    fillNA: boolean;
}

// 定義 HTTP 錯誤回應類型
interface HttpErrorResponse {
    response?: {
        data?: unknown;
        status?: number;
    };
}

export class FileAnalysisService {

    // 🔥 完整的檔案處理流程 - 這個方法必須存在！
    static async processFileComplete(
        file: File,
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): Promise<FileAnalysisResult> {
        try {
            // 1. 檔案驗證（副檔名、大小）
            const validation = FileProcessor.validateFile(file, userType);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // 2. MIME 類型額外驗證
            const allowedMimeTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ''
            ];

            if (file.type && !allowedMimeTypes.includes(file.type)) {
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                if (!['.csv', '.xls', '.xlsx'].includes(ext)) {
                    return {
                        success: false,
                        error: CommonErrors.fileFormatUnsupported()
                    };
                }
            }

            // 3. 檔案內容處理
            const processResult = await FileProcessor.processFile(file, userType);
            if (processResult.error) {
                return {
                    success: false,
                    error: processResult.error
                };
            }

            // 4. 檢查是否為空檔案
            if (!processResult.data || processResult.data.length === 0) {
                return {
                    success: false,
                    error: CommonErrors.fileEmpty()
                };
            }

            // 5. 敏感資料檢測
            const sensitiveResult = await SensitiveDataDetector.checkFileForSensitiveData(file);

            // 6. 組合結果
            const warnings: string[] = [];
            if (validation.warnings) {
                warnings.push(...validation.warnings);
            }

            return {
                success: true,
                data: processResult.data,
                fileInfo: processResult.fileInfo,
                sensitiveColumns: sensitiveResult.sensitiveColumns,
                suggestions: sensitiveResult.suggestions,
                warnings
            };

        } catch (err: unknown) {
            console.error("❌ 完整檔案處理失敗:", err);
            return {
                success: false,
                error: createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_PROCESSING,
                    undefined,
                    {
                        customMessage: `檔案處理失敗: ${err instanceof Error ? err.message : String(err)}`,
                        cause: err instanceof Error ? err : undefined
                    }
                )
            };
        }
    }

    // 欄位分析
    static async analyzeColumns(data: DataRow[], token: string): Promise<{
        success: boolean;
        columns?: ColumnProfile[];
        error?: ServiceError | AppError;
    }> {
        try {
            if (!process.env.NEXT_PUBLIC_API_URL) {
                throw createError(
                    ErrorCode.SERVER_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: "API URL 未配置" }
                );
            }

            const correlationId = crypto.randomUUID();

            const requestBody: ColumnAnalysisRequest = {
                data: data
            };

            console.log("📤 發送欄位分析請求:");
            console.log("  - API URL:", process.env.NEXT_PUBLIC_API_URL);
            console.log("  - 資料筆數:", data.length);
            console.log("  - 欄位數:", data.length > 0 ? Object.keys(data[0]).length : 0);

            // 先用 unknown 接收，再做型別檢查
            const response = await post<ColumnAnalysisRequest, unknown>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/columns`,
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 30000
                }
            );

            console.log("📥 收到欄位分析回應:", response);

            // 型別守衛來檢查回應結構
            if (response && typeof response === 'object') {
                const res = response as Record<string, unknown>;

                // 檢查 data.columns 結構
                if (res.data && typeof res.data === 'object') {
                    const data = res.data as Record<string, unknown>;
                    if (data.columns && Array.isArray(data.columns)) {
                        return {
                            success: true,
                            columns: data.columns as ColumnProfile[]
                        };
                    }
                }

                // 檢查直接 columns 結構
                if (res.columns && Array.isArray(res.columns)) {
                    return {
                        success: true,
                        columns: res.columns as ColumnProfile[]
                    };
                }
            }

            console.warn("⚠️ API 回應格式異常:", response);
            return {
                success: false,
                error: createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    'column.type_detection_failed',
                    {
                        customMessage: "API 回應格式異常",
                        correlationId,
                        details: { response: JSON.stringify(response) }
                    }
                )
            };

        } catch (err: unknown) {
            console.error("❌ 欄位解析錯誤:", err);

            if (err && typeof err === 'object' && 'response' in err) {
                const errorResponse = err as HttpErrorResponse;
                console.error("❌ 錯誤回應:", errorResponse.response?.data);
                console.error("❌ 錯誤狀態:", errorResponse.response?.status);
            }

            if (err instanceof Error) {
                return {
                    success: false,
                    error: createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        undefined,
                        { customMessage: err.message, cause: err }
                    )
                };
            }

            return {
                success: false,
                error: createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: "欄位分析發生未知錯誤" }
                )
            };
        }
    }

    // 創建備用欄位資料
    static createFallbackColumnData(data: DataRow[]): ColumnProfile[] {
        if (data.length === 0) return [];

        return Object.keys(data[0]).map(col => ({
            column: col,
            missing_pct: "0.0%",
            suggested_type: "不明"
        }));
    }

    // AI 自動分析
    static async performAutoAnalysis(
        parsedData: DataRow[],
        fillNA: boolean,
        token: string
    ): Promise<{
        success: boolean;
        result?: AutoAnalysisResponse;
        error?: ServiceError | AppError;
    }> {
        try {
            const correlationId = crypto.randomUUID();

            const requestBody: AutoAnalysisRequest = {
                parsedData: parsedData,
                fillNA: fillNA
            };

            console.log("📤 發送自動分析請求:");
            console.log("  - 資料筆數:", parsedData.length);
            console.log("  - 填補缺值:", fillNA);

            const response = await post<AutoAnalysisRequest, AutoAnalysisResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/ai_automation/auto-analyze`,
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 60000
                }
            );

            if (!response.success) {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    'analysis.auto_failed',
                    {
                        customMessage: response.message || "自動分析失敗",
                        correlationId
                    }
                );
            }

            return {
                success: true,
                result: response
            };

        } catch (err: unknown) {
            console.error("❌ 自動分析錯誤:", err);

            // 類型安全的錯誤處理
            if (err instanceof Error) {
                return {
                    success: false,
                    error: createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        undefined,
                        { customMessage: err.message, cause: err }
                    )
                };
            }

            return {
                success: false,
                error: createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: "自動分析發生未知錯誤" }
                )
            };
        }
    }
}