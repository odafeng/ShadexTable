// app/step3/services/exportService.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { ErrorContext, ErrorCode } from "@/utils/error";
import { createError, isAppError } from "@/utils/error";
import type { ExportData } from "@/app/step3/types";

export async function exportToExcel(
  data: any[],
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
  filename: string = "ai-analysis-summary.docx"
): Promise<void> {
  try {
    // 直接使用 fetch 呼叫 Next.js API route
    const response = await fetch("/api/export-word", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      throw createError(
        ErrorCode.SERVER_ERROR,
        ErrorContext.FILE_PROCESSING,
        undefined,
        {
          customMessage: `Word 匯出失敗: ${response.statusText}`,
          details: { status: response.status }
        }
      );
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (isAppError(error)) throw error;
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