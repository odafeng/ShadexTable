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

export class FileAnalysisService {
    
    // 完整的檔案處理流程
    static async processFileComplete(
        file: File,
        userType: 'GENERAL' | 'PROFESSIONAL' = 'GENERAL'
    ): Promise<FileAnalysisResult> {
        try {
            // 1. 檔案驗證
            const validation = FileProcessor.validateFile(file, userType);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // 2. 敏感資料檢測
            const sensitiveResult = await SensitiveDataDetector.checkFileForSensitiveData(file);
            if (sensitiveResult.error) {
                return {
                    success: false,
                    error: sensitiveResult.error
                };
            }

            // 3. 檔案內容處理
            const processResult = await FileProcessor.processFile(file, userType);
            if (processResult.error) {
                return {
                    success: false,
                    error: processResult.error
                };
            }

            // 4. 組合結果
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
            
            const response = await apiClient.post<{ data: { columns: ColumnProfile[] } }>(
                "/api/preprocess/columns",
                { data },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 30000 // 30 秒超時，因為欄位分析可能需要較長時間
                }
            );

            if (response && response.data && response.data.columns && Array.isArray(response.data.columns)) {
                return {
                    success: true,
                    columns: response.data.columns
                };
            } else {
                console.warn("⚠️ API 回應格式異常");
                return {
                    success: false,
                    error: createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        'column.type_detection_failed',
                        { 
                            customMessage: "API 回應格式異常",
                            correlationId 
                        }
                    )
                };
            }

        } catch (err: unknown) {
            console.error("❌ 欄位解析錯誤:", err);
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

            const response = await apiClient.post<{ success: boolean; message?: string; [key: string]: any }>(
                "/api/ai_automation/auto-analyze",
                {
                    parsedData: parsedData,
                    fillNA: fillNA
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 60000 // AI 分析可能需要更長時間，設定 60 秒
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
            return {
                success: false,
                error: err
            };
        }
    }
}