import { apiClient, reportError } from "@/lib/apiClient";
import { 
  AppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  CommonErrors 
} from "@/utils/error";

export interface ColumnProfile {
    column: string;
    missing_pct: string;
    suggested_type: string;
}

export interface ColumnAnalysisResult {
    columns: ColumnProfile[];
    success: boolean;
    error?: AppError;
}

export class ColumnAnalysisService {

    async analyzeColumns(data: any[], token?: string): Promise<ColumnAnalysisResult> {
        const correlationId = `column-analysis-${Date.now()}`;
        
        try {
            // 驗證輸入資料
            if (!data || data.length === 0) {
                const error = CommonErrors.insufficientData();
                return {
                    columns: [],
                    success: false,
                    error
                };
            }

            // 使用傳入的 token 或從 localStorage 獲取（向下相容）
            const authToken = token || localStorage.getItem("__session") || "";

            if (!authToken) {
                const error = CommonErrors.authTokenMissing();
                await reportError(error, { action: "column_analysis", dataRows: data.length });
                return {
                    columns: [],
                    success: false,
                    error
                };
            }

            // 使用統一的 apiClient 進行 API 呼叫
            const response = await apiClient.post<any>(
                "/api/preprocess/columns",
                { data },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlationId,
                    timeout: 30000
                }
            );

            // 檢查回應格式
            if (response && response.data && response.data.columns && Array.isArray(response.data.columns)) {
                return {
                    columns: response.data.columns,
                    success: true
                };
            } else {
                console.warn("⚠️ API 回應格式異常，使用備用方案");
                const fallback = this.createFallbackColumnData(data);
                const error = createError(
                    ErrorCode.SERVER_ERROR,
                    ErrorContext.ANALYSIS,
                    'column.type_detection_failed',
                    { 
                        correlationId,
                        customMessage: "欄位分析服務回應異常，已使用基本解析"
                    }
                );
                await reportError(error, { 
                    action: "column_analysis", 
                    dataRows: data.length,
                    responseFormat: typeof response
                });
                return {
                    ...fallback,
                    error
                };
            }

        } catch (error: any) {
            console.error("❌ 欄位解析錯誤：", error);
            
            // 如果已經是 AppError，直接使用
            if (error instanceof AppError) {
                return {
                    columns: [],
                    success: false,
                    error
                };
            }
            
            // 包裝為 AppError
            const appError = createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                'column.type_detection_failed',
                { 
                    correlationId,
                    cause: error instanceof Error ? error : undefined
                }
            );
            
            await reportError(appError, { 
                action: "column_analysis", 
                dataRows: data.length,
                originalError: error
            });
            
            // 嘗試使用備用方案
            try {
                const fallback = this.createFallbackColumnData(data);
                return {
                    ...fallback,
                    error: appError
                };
            } catch (fallbackError) {
                return {
                    columns: [],
                    success: false,
                    error: appError
                };
            }
        }
    }

    // 備用方案：創建基本的欄位資訊
    private createFallbackColumnData(data: any[]): ColumnAnalysisResult {
        if (data.length === 0) {
            const error = createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorContext.ANALYSIS,
                'column.no_valid_columns',
                { 
                    correlationId: `fallback-${Date.now()}`
                }
            );
            return {
                columns: [],
                success: false,
                error
            };
        }

        try {
            const columns: ColumnProfile[] = Object.keys(data[0]).map(col => ({
                column: col,
                missing_pct: this.calculateMissingPercentage(data, col),
                suggested_type: this.inferColumnType(data, col)
            }));

            return {
                columns,
                success: true
            };
        } catch (error) {
            const appError = createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                'column.type_detection_failed',
                { 
                    correlationId: `fallback-error-${Date.now()}`,
                    cause: error instanceof Error ? error : undefined
                }
            );
            return {
                columns: [],
                success: false,
                error: appError
            };
        }
    }

    // 計算遺失值百分比
    private calculateMissingPercentage(data: any[], column: string): string {
        try {
            const totalRows = data.length;
            const missingCount = data.filter(row => 
                row[column] === null || 
                row[column] === undefined || 
                row[column] === '' ||
                (typeof row[column] === 'string' && row[column].trim() === '')
            ).length;
            
            const percentage = ((missingCount / totalRows) * 100).toFixed(1);
            return `${percentage}%`;
        } catch (error) {
            return "0.0%";
        }
    }

    // 簡單的類型推斷
    private inferColumnType(data: any[], column: string): string {
        try {
            const sample = data.slice(0, Math.min(100, data.length))
                .map(row => row[column])
                .filter(val => val !== null && val !== undefined && val !== '');

            if (sample.length === 0) return "未知";

            // 檢查是否為數字
            const numericSample = sample.filter(val => !isNaN(Number(val)));
            if (numericSample.length / sample.length > 0.8) {
                // 檢查是否為整數
                const integerSample = numericSample.filter(val => Number.isInteger(Number(val)));
                if (integerSample.length / numericSample.length > 0.9) {
                    return "整數";
                } else {
                    return "小數";
                }
            }

            // 檢查是否為日期
            const dateSample = sample.filter(val => {
                const date = new Date(val);
                return !isNaN(date.getTime());
            });
            if (dateSample.length / sample.length > 0.8) {
                return "日期";
            }

            // 檢查是否為布林值
            const boolSample = sample.filter(val => 
                val === true || val === false || 
                val === 'true' || val === 'false' ||
                val === 'True' || val === 'False' ||
                val === '是' || val === '否' ||
                val === 'Y' || val === 'N'
            );
            if (boolSample.length / sample.length > 0.8) {
                return "布林";
            }

            // 檢查是否為分類變項（唯一值較少）
            const uniqueValues = [...new Set(sample)];
            if (uniqueValues.length <= Math.min(10, sample.length * 0.5)) {
                return "分類";
            }

            return "文字";
        } catch (error) {
            return "未知";
        }
    }
}