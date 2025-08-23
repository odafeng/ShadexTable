// step1_fileAnalysisService.ts
import { SensitiveDataDetector } from "@/features/step1/services/sensitiveDataDetector";
import { post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import type { DataRow } from "@/stores/analysisStore";
import { AppError } from "@/types/errors";
import {
  createError,
  ErrorCode,
  ErrorContext,
  CommonErrors,
  isAppError,
} from "@/utils/error";
import { FileProcessor } from "@/utils/fileProcessor";

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

export interface ColumnAnalysisResult {
  columns: ColumnProfile[];
  success: boolean;
  error?: AppError;
}

interface AutoAnalysisResponse {
  success: boolean;
  message?: string;
  group_var?: string;  // 現在由前端傳入，後端回傳相同值
  cat_vars?: string[];
  cont_vars?: string[];
  classification?: Record<string, string>;
  analysis?: {
    table?: DataRow[];
    groupCounts?: Record<string, number>;
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
  groupVar?: string;  // 新增：使用者指定的分組變項
  correlation_id?: string;  // 新增：用於追蹤請求的 ID
}

export class FileAnalysisService {
  // 🔥 完整的檔案處理流程 - 這個方法必須存在！
  static async processFileComplete(
    file: File,
    userType: "GENERAL" | "PROFESSIONAL" = "GENERAL",
  ): Promise<FileAnalysisResult> {
    try {
      // 1. 檔案驗證（副檔名、大小）
      const validation = FileProcessor.validateFile(file, userType);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // 2. MIME 類型額外驗證
      const allowedMimeTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "",
      ];

      if (file.type && !allowedMimeTypes.includes(file.type)) {
        const ext = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        if (![".csv", ".xls", ".xlsx"].includes(ext)) {
          return {
            success: false,
            error: CommonErrors.fileFormatUnsupported(),
          };
        }
      }

      // 3. 檔案內容處理
      const processResult = await FileProcessor.processFile(file, userType);
      if (processResult.error) {
        return {
          success: false,
          error: processResult.error,
        };
      }

      // 4. 檢查是否為空檔案
      if (!processResult.data || processResult.data.length === 0) {
        return {
          success: false,
          error: CommonErrors.fileEmpty(),
        };
      }

      // 5. 敏感資料檢測
      const columns = Object.keys(processResult.data[0]);
      console.log("📊 從解析資料取得的欄位:", columns);
      const sensitiveResult =
        await SensitiveDataDetector.checkFileForSensitiveData(file);
      console.log("🔍 敏感資料檢測結果:", sensitiveResult);
      console.log("📊 檢測到的敏感欄位:", sensitiveResult.sensitiveColumns);

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
        warnings,
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
            cause: err instanceof Error ? err : undefined,
          },
        ),
      };
    }
  }

  // 整合後的欄位分析 - 包含所有優點
  static async analyzeColumns(
    data: DataRow[],
    token?: string,  // Token 改為可選，支援向下相容
  ): Promise<ColumnAnalysisResult> {
    const correlation_id = crypto.randomUUID();

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

      if (!process.env.NEXT_PUBLIC_API_URL) {
        throw createError(
          ErrorCode.SERVER_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          { customMessage: "API URL 未配置" },
        );
      }

      const requestBody: ColumnAnalysisRequest = {
        data: data,
      };

      console.log("📤 發送欄位分析請求:");
      console.log("  - API URL:", process.env.NEXT_PUBLIC_API_URL);
      console.log("  - 資料筆數:", data.length);
      console.log(
        "  - 欄位數:",
        data.length > 0 ? Object.keys(data[0]).length : 0,
      );

      // 使用統一的 apiClient 進行 API 呼叫
      interface ColumnsApiResponse {
        data: {
          columns: ColumnProfile[];
        };
      }
      
      const response = await post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/columns`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          context: ErrorContext.ANALYSIS,
          correlation_id,
          timeout: 30000
        }
      ) as ColumnsApiResponse;

      console.log("📥 收到欄位分析回應:", response);

      // 檢查回應格式
      if (response && response.data && response.data.columns && Array.isArray(response.data.columns)) {
        return {
          columns: response.data.columns,
          success: true
        };
      } else {
        console.warn("⚠️ API 回應格式異常，使用備用方案");
        const fallback = FileAnalysisService.createFallbackColumnDataComplete(data);
        const error = createError(
          ErrorCode.SERVER_ERROR,
          ErrorContext.ANALYSIS,
          'column.type_detection_failed',
          {
            correlation_id,
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

    } catch (error: unknown) {
      console.error("❌ 欄位解析錯誤：", error);

      // 如果已經是 AppError，直接使用
      if (isAppError(error)) {
        await reportError(error, {
          action: "column_analysis",
          dataRows: data.length
        });
        
        // 嘗試使用備用方案
        try {
          const fallback = FileAnalysisService.createFallbackColumnDataComplete(data);
          return {
            ...fallback,
            error
          };
        } catch {
          return {
            columns: [],
            success: false,
            error
          };
        }
      }

      // 包裝為 AppError
      const appError = createError(
        ErrorCode.ANALYSIS_ERROR,
        ErrorContext.ANALYSIS,
        'column.type_detection_failed',
        {
          correlation_id,
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
        const fallback = FileAnalysisService.createFallbackColumnDataComplete(data);
        return {
          ...fallback,
          error: appError
        };
      } catch {
        return {
          columns: [],
          success: false,
          error: appError
        };
      }
    }
  }

  // 完整的備用方案：創建基本的欄位資訊
  static createFallbackColumnDataComplete(data: DataRow[]): ColumnAnalysisResult {
    if (data.length === 0) {
      const error = createError(
        ErrorCode.VALIDATION_ERROR,
        ErrorContext.ANALYSIS,
        'column.no_valid_columns',
        {
          correlation_id: `fallback-${Date.now()}`
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
        missing_pct: FileAnalysisService.calculateMissingPercentage(data, col),
        suggested_type: FileAnalysisService.inferColumnType(data, col)
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
          correlation_id: `fallback-error-${Date.now()}`,
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

  // 簡化版備用欄位資料（保留原有方法供其他地方使用）
  static createFallbackColumnData(data: DataRow[]): ColumnProfile[] {
    if (data.length === 0) return [];

    return Object.keys(data[0]).map((col) => ({
      column: col,
      missing_pct: "0.0%",
      suggested_type: "不明",
    }));
  }

  // 計算遺失值百分比
  private static calculateMissingPercentage(data: DataRow[], column: string): string {
    try {
      const totalRows = data.length;
      const missingCount = data.filter(row =>
        row[column] === null ||
        row[column] === undefined ||
        row[column] === '' ||
        (typeof row[column] === 'string' && (row[column] as string).trim() === '')
      ).length;

      const percentage = ((missingCount / totalRows) * 100).toFixed(1);
      return `${percentage}%`;
    } catch {
      return "0.0%";
    }
  }

  // 完整的類型推斷
  private static inferColumnType(data: DataRow[], column: string): string {
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
        const date = new Date(val as string);
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
      const uniqueValues = [...new Set(sample.map(v => String(v)))];
      if (uniqueValues.length <= Math.min(10, sample.length * 0.5)) {
        return "分類";
      }

      return "文字";
    } catch {
      return "未知";
    }
  }

  // AI 自動分析 - 更新支援使用者指定的分組變項
  static async performAutoAnalysis(
    parsedData: DataRow[],
    fillNA: boolean,
    token: string,
    groupVar?: string,  // 新增：使用者指定的分組變項
    correlation_id?: string
  ): Promise<{
    success: boolean;
    result?: AutoAnalysisResponse;
    error?: ServiceError | AppError;
  }> {
    try {
      const corrId = correlation_id || crypto.randomUUID();
      const requestBody: AutoAnalysisRequest = {
        parsedData: parsedData,
        fillNA: fillNA,
        groupVar: groupVar,
        correlation_id: corrId
      };

      console.log("📤 發送自動分析請求:");
      console.log("  - 資料筆數:", parsedData.length);
      console.log("  - 填補缺值:", fillNA);
      console.log("  - 分組變項:", groupVar || "無");

      const response = await post<AutoAnalysisRequest, AutoAnalysisResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai_automation/auto-analyze`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Correlation-ID': corrId
          },
          context: ErrorContext.ANALYSIS,
          correlation_id: corrId,
          timeout: 60000,
        },
      );

      if (!response.success) {
        throw createError(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          "analysis.auto_failed",
          {
            customMessage: response.message || "自動分析失敗",
            correlation_id,
          },
        );
      }

      // 確保回傳的 group_var 與使用者選擇的一致
      if (response.group_var !== groupVar) {
        console.log("📝 後端返回的分組變項與前端不一致，使用前端值");
        response.group_var = groupVar;
      }

      return {
        success: true,
        result: response,
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
            { customMessage: err.message, cause: err },
          ),
        };
      }

      return {
        success: false,
        error: createError(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          { customMessage: "自動分析發生未知錯誤" },
        ),
      };
    }
  }
}