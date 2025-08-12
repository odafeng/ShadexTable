// step1_fileAnalysisService.ts
import { FileProcessor } from "@/utils/fileProcessor";
import { SensitiveDataDetector } from "@/services/step1_sensitiveDataDetector";
import { createError, ErrorCode, ErrorContext, CommonErrors } from "@/utils/error";
import { apiClient } from "@/lib/apiClient";

export interface FileAnalysisResult {
    success: boolean;
    data?: any[];
    fileInfo?: {
        name: string;
        size: number;
        rows: number;
        columns: number;
        hasMultipleSheets?: boolean;
    };
    sensitiveColumns?: string[];
    suggestions?: string[];
    warnings?: string[];
    error?: any;
}

export interface ColumnProfile {
    column: string;
    missing_pct: string;
    suggested_type: string;
}

// 定義 API 回應類型
interface ColumnAnalysisResponse {
    data: {
        columns: ColumnProfile[];
    };
    [key: string]: any;
}

interface AutoAnalysisResponse {
    success: boolean;
    message?: string;
    [key: string]: any;
}

// 定義請求類型
interface ColumnAnalysisRequest {
    data: any[];
}

interface AutoAnalysisRequest {
    parsedData: any[];
    fillNA: boolean;
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
    static async analyzeColumns(data: any[], token: string): Promise<{
        success: boolean;
        columns?: ColumnProfile[];
        error?: any;
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

            const response = await apiClient.post<ColumnAnalysisRequest, ColumnAnalysisResponse>(
                "/api/preprocess/columns",
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

            if (response?.data?.columns && Array.isArray(response.data.columns)) {
                return {
                    success: true,
                    columns: response.data.columns
                };
            } else {
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
                            details: { response }
                        }
                    )
                };
            }

        } catch (err: unknown) {
            console.error("❌ 欄位解析錯誤:", err);
            
            if (err && typeof err === 'object' && 'response' in err) {
                const errorResponse = err as any;
                console.error("❌ 錯誤回應:", errorResponse.response?.data);
                console.error("❌ 錯誤狀態:", errorResponse.response?.status);
            }
            
            return {
                success: false,
                error: err
            };
        }
    }

    // 創建備用欄位資料
    static createFallbackColumnData(data: any[]): ColumnProfile[] {
        if (data.length === 0) return [];
        
        return Object.keys(data[0]).map(col => ({
            column: col,
            missing_pct: "0.0%",
            suggested_type: "不明"
        }));
    }

    // AI 自動分析
    static async performAutoAnalysis(
        parsedData: any[],
        fillNA: boolean,
        token: string
    ): Promise<{
        success: boolean;
        result?: any;
        error?: any;
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

            const response = await apiClient.post<AutoAnalysisRequest, AutoAnalysisResponse>(
                "/api/ai_automation/auto-analyze",
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
            return {
                success: false,
                error: err
            };
        }
    }
}