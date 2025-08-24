import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { post } from "@/lib/apiClient";
import type { ExportData, TableRow } from "@/features/step3/types";
import { ErrorContext, ErrorCode } from "@/utils/error";
import { createError, isAppError, CommonErrors } from "@/utils/error";
import type { AppError } from "@/types/errors";

// 定義可匯出的資料型別
type ExportableData = TableRow[] | Record<string, unknown>[] | Array<{
  [key: string]: string | number | boolean | null | undefined;
}>;

// 擴展 ExportData 型別定義
interface ExtendedExportData extends ExportData {
  fileName?: string;
  fileSize?: number;
  correlationId?: string;
}

// Word 匯出回應介面
interface WordExportResponse {
  storageUrl?: string;
  storageKey?: string;
  storageExpires?: string;
  storageSuccess?: boolean;
  logId?: string;
}

/**
 * 匯出資料到 Excel
 */
export async function exportToExcel(
  data: ExportableData,
  filename: string = "ai-analysis-summary.xlsx"
): Promise<void> {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, filename);
  } catch (error) {
    if (isAppError(error)) throw error;
    
    throw createError(
      ErrorCode.FILE_ERROR,
      ErrorContext.FILE_PROCESSING,
      undefined,
      {
        customMessage: "Excel 匯出失敗",
        cause: error instanceof Error ? error : undefined,
        correlation_id: crypto.randomUUID()
      }
    );
  }
}

/**
 * 匯出資料到 Word
 * 使用 apiClient 進行 API 呼叫
 */
export async function exportToWord(
  exportData: ExtendedExportData,
  filename: string = "ai-analysis-summary.docx",
  token?: string,
  correlationId?: string
): Promise<WordExportResponse> {
  try {
    const correlation_id = correlationId || crypto.randomUUID();
    
    // 準備請求標頭
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // 如果有提供 token，加入 Authorization 標頭
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // 如果有 correlation ID，加入到標頭
    if (correlation_id) {
      headers["X-Correlation-ID"] = correlation_id;
    }
    
    // 組合完整 URL
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/table/export-word`;
    
    // 使用原生 fetch 而非 post (因為需要處理 blob response)
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      // 嘗試解析錯誤回應
      let errorMessage = `Word 匯出失敗`;
      let errorDetails: any = { status: response.status };
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error;
          }
          errorDetails = { ...errorDetails, ...errorData };
        } else {
          // 如果不是 JSON，嘗試讀取文字
          const text = await response.text();
          if (text) {
            errorMessage = text.substring(0, 200); // 限制長度
          }
        }
      } catch {
        // 忽略解析錯誤
      }

      // 根據狀態碼創建對應的錯誤
      let appError: AppError;
      
      switch (response.status) {
        case 400:
          appError = createError(
            ErrorCode.VALIDATION_ERROR,
            ErrorContext.FILE_PROCESSING,
            undefined,
            {
              customMessage: errorMessage || "請求格式錯誤，請檢查資料",
              details: errorDetails,
              correlation_id
            }
          );
          break;
          
        case 401:
          appError = CommonErrors.authError(ErrorContext.FILE_PROCESSING);
          break;
          
        case 413:
          appError = createError(
            ErrorCode.FILE_SIZE_EXCEEDED,
            ErrorContext.FILE_PROCESSING,
            "file.size_exceeded",
            {
              details: errorDetails,
              correlation_id
            }
          );
          break;
          
        case 429:
          appError = CommonErrors.rateLimitError();
          break;
          
        case 500:
        case 502:
        case 503:
          appError = CommonErrors.serverError(ErrorContext.FILE_PROCESSING);
          break;
          
        default:
          appError = createError(
            ErrorCode.SERVER_ERROR,
            ErrorContext.FILE_PROCESSING,
            undefined,
            {
              customMessage: errorMessage,
              details: errorDetails,
              correlation_id
            }
          );
      }
      
      throw appError;
    }

    // 從 response headers 取得 Storage 資訊
    const storageUrl = response.headers.get("X-Storage-URL");
    const storageKey = response.headers.get("X-Storage-Key");
    const storageExpires = response.headers.get("X-Storage-Expires");
    const storageSuccess = response.headers.get("X-Storage-Success") === "true";
    const logId = response.headers.get("X-Log-ID");
    const storageError = response.headers.get("X-Storage-Error");
    
    // 記錄 Storage 資訊
    if (storageSuccess && storageUrl) {
      console.log("📦 檔案已上傳至雲端儲存");
      console.log("🔗 永久連結:", storageUrl);
      console.log("📅 連結有效至:", storageExpires);
      console.log("🆔 Log ID:", logId);
      
      // 儲存到 localStorage
      if (typeof window !== 'undefined') {
        try {
          const exportHistory = JSON.parse(
            localStorage.getItem('wordExportHistory') || '[]'
          );
          exportHistory.push({
            timestamp: new Date().toISOString(),
            fileName: filename,
            storageUrl,
            storageKey,
            expiresAt: storageExpires,
            correlationId: correlation_id,
            logId
          });
          
          // 只保留最近 10 筆記錄
          if (exportHistory.length > 10) {
            exportHistory.shift();
          }
          localStorage.setItem('wordExportHistory', JSON.stringify(exportHistory));
        } catch (e) {
          console.warn("無法儲存匯出歷史:", e);
        }
      }
    } else if (!storageSuccess && storageError) {
      console.warn("⚠️ 檔案上傳至雲端儲存失敗:", storageError);
    }

    // 取得二進位資料
    const blob = await response.blob();
    
    // 驗證回應
    if (blob.size === 0) {
      throw createError(
        ErrorCode.FILE_EMPTY,
        ErrorContext.FILE_PROCESSING,
        "file.empty_file",
        {
          correlation_id
        }
      );
    }

    // 驗證 MIME 類型
    const contentType = response.headers.get("content-type");
    const expectedType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (contentType && !contentType.includes(expectedType)) {
      console.warn("Unexpected content type for Word document:", contentType);
    }

    // 下載檔案
    saveAs(blob, filename);
    
    // 返回 Storage 資訊供調用者使用
    return {
      storageUrl: storageUrl || undefined,
      storageKey: storageKey || undefined,
      storageExpires: storageExpires || undefined,
      storageSuccess,
      logId: logId || undefined
    };
    
  } catch (error) {
    // 如果已經是 AppError，直接拋出
    if (isAppError(error)) {
      throw error;
    }
    
    // 網路錯誤處理
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw CommonErrors.networkError();
    }
    
    // 其他未知錯誤
    throw CommonErrors.unknownError(
      error instanceof Error ? error : undefined,
      "Word 匯出過程發生未預期錯誤"
    );
  }
}