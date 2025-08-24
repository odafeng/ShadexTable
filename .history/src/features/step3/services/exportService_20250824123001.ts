// app/step3/services/exportService.ts
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { useAuth } from "@clerk/nextjs";

import type { ExportData, TableRow } from "@/features/step3/types";
import { ErrorContext, ErrorCode } from "@/utils/error";
import { createError, isAppError } from "@/utils/error";

// 定義可匯出的資料型別
type ExportableData = TableRow[] | Record<string, unknown>[] | Array<{
  [key: string]: string | number | boolean | null | undefined;
}>;

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
        cause: error instanceof Error ? error : undefined
      }
    );
  }
}

export async function exportToWord(
  exportData: ExportData,
  filename: string = "ai-analysis-summary.docx",
  token?: string  // 添加 token 參數
): Promise<void> {
  try {
    // 準備請求標頭
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    // 如果有提供 token，加入 Authorization 標頭
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // 呼叫後端 API 端點 - 對齊現有 table API 路徑格式
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/table/export-word`, {
      method: "POST",
      headers,
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      // 嘗試解析錯誤回應
      let errorMessage = `Word 匯出失敗: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // 如果無法解析 JSON，使用預設錯誤訊息
      }

      throw createError(
        ErrorCode.SERVER_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        {
          customMessage: errorMessage,
          details: { status: response.status }
        }
      );
    }

    // 取得二進位資料
    const blob = await response.blob();
    
    // 驗證回應是否為有效的 Word 文件
    if (blob.size === 0) {
      throw createError(
        ErrorCode.FILE_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        {
          customMessage: "收到空的 Word 文件"
        }
      );
    }

    // 驗證 MIME 類型
    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      console.warn("Unexpected content type for Word document:", contentType);
    }

    // 下載檔案
    saveAs(blob, filename);
    
  } catch (error) {
    if (isAppError(error)) throw error;
    
    // 網路錯誤處理
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw createError(
        ErrorCode.NETWORK_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        {
          customMessage: "無法連接到伺服器，請檢查網路連線",
          cause: error
        }
      );
    }
    
    throw createError(
      ErrorCode.FILE_ERROR,
      ErrorContext.FILE_PROCESSING,
      undefined,
      {
        customMessage: "Word 匯出失敗",
        cause: error instanceof Error ? error : undefined
      }
    );
  }
}