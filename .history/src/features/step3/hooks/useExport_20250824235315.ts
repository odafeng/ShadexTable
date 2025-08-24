import { useAuth } from "@clerk/nextjs";
import { prepareExportData, isCategorySubItem } from "@/features/step3/services/dataTransformService";
import { exportToExcel, exportToWord } from "@/features/step3/services/exportService";
import type { TableRow, GroupCounts, BinaryMapping, CellValue } from "@/features/step3/types";
import { reportError } from "@/lib/reportError";
import { createErrorHandler, isAppError, extractErrorMessage } from "@/utils/error";
import type { AppError } from "@/types/errors";
import { ErrorSeverity } from "@/types/errors";
import { useAnalysisStore } from "@/stores/analysisStore";

interface UseExportParams {
  sortedRows: TableRow[];
  displayNames: Record<string, string>;
  groupLabels: Record<string, string>;
  binaryMappings: Record<string, BinaryMapping>;
  groupCounts: GroupCounts;
  groupVar?: string;
}

interface ExportRow extends Record<string, CellValue> {
  Variable?: string;
  _originalVariable?: string;
  _isSubItem?: boolean;
}

interface ExportResult {
  success: boolean;
  storageUrl?: string;
  message?: string;
}

export function useExport({
  sortedRows,
  displayNames,
  groupLabels,
  binaryMappings,
  groupCounts,
  groupVar
}: UseExportParams) {
  const { getToken } = useAuth();
  
  // 重要修正：只使用一次 useAnalysisStore，避免多重訂閱
  const storeData = useAnalysisStore((state) => ({
    correlation_id: state.correlation_id,
    fileName: state.fileName,
    fileSize: state.fileSize
  }));
  
  // 創建統一的錯誤處理器
  const handleError = createErrorHandler(
    (appError: AppError, context?: string) => {
      // 根據錯誤嚴重程度決定如何處理
      if (appError.severity === ErrorSeverity.CRITICAL) {
        // 嚴重錯誤：上報並顯示詳細訊息
        reportError(appError, { context });
        alert(`系統錯誤：${appError.userMessage}\n建議操作：${appError.action}`);
      } else if (appError.severity === ErrorSeverity.HIGH) {
        // 高嚴重度：上報並顯示用戶訊息
        reportError(appError, { context });
        alert(appError.userMessage);
      } else {
        // 中低嚴重度：只顯示訊息
        alert(appError.userMessage);
      }
      
      // 記錄到控制台（開發環境）
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Export Error - ${context}]`, {
          code: appError.code,
          message: appError.message,
          userMessage: appError.userMessage,
          correlation_id: appError.correlation_id,
          canRetry: appError.canRetry,
          details: appError.details
        });
      }
    },
    {
      shouldLog: true,
      shouldReport: true
    }
  );

  /**
   * 檢查是否可以匯出
   */
  const canExport = (): boolean => {
    if (!groupVar) return false;
    const uniqueGroups = Object.keys(groupCounts);
    return uniqueGroups.length >= 2;
  };

  /**
   * 處理 Excel 匯出
   */
  const handleExportToExcel = async (): Promise<void> => {
    try {
      const exportColumns = ["Variable", ...Object.keys(groupCounts), "P", "Method"];
      const data = prepareExportData(
        sortedRows,
        displayNames,
        groupLabels,
        binaryMappings,
        groupCounts,
        exportColumns
      );
      
      await exportToExcel(data);
      
      console.log("✅ Excel 檔案匯出成功");
    } catch (error) {
      handleError(error, "Excel export");
    }
  };

  /**
   * 處理 Word 匯出
   */
  const handleExportToWord = async (): Promise<ExportResult> => {
    try {
      // 使用從 store 取得的資料
      const { correlation_id, fileName, fileSize } = storeData;
      
      // 檢查 correlation_id
      if (!correlation_id) {
        console.warn("⚠️ No correlation_id found in store");
      } else {
        console.log("📌 Using correlation_id from store:", correlation_id);
      }
      
      // 取得認證 token
      const token = await getToken();
      
      // 準備匯出資料
      const exportData = {
        resultTable: sortedRows.map((row, idx) => {
          const cleanRow: ExportRow = {};
          
          Object.keys(row).forEach(key => {
            if (!key.startsWith('_')) {
              if (key === 'Variable') {
                cleanRow[key] = displayNames[row.Variable] || row.Variable;
              } else {
                let value: CellValue = row[key];
                
                const isGroupCol = Object.keys(groupCounts).includes(key);
                if (isGroupCol && value !== undefined && value !== null) {
                  const valueStr = value.toString();
                  const match = valueStr.match(/^(\d+)\s*\([\d.]+%?\)$/);
                  if (match && (match[1] === '0' || match[1] === '1')) {
                    const binaryKey = `${row.Variable}-${key}`;
                    const mapping = binaryMappings[binaryKey];
                    if (mapping) {
                      value = valueStr.replace(/^(\d)/, (m: string) => mapping[m] || m);
                    }
                  }
                }
                
                cleanRow[key] = value;
              }
            }
          });
          
          cleanRow._originalVariable = row.Variable;
          cleanRow._isSubItem = isCategorySubItem(row, sortedRows, idx);
          
          return cleanRow;
        }),
        groupVar,
        groupCounts: Object.keys(groupCounts).reduce((acc, key) => {
          const newKey = groupLabels[key] || key;
          acc[newKey] = groupCounts[key];
          return acc;
        }, {} as Record<string, number>),
        groupLabels,
        // 使用從 store 取得的資料
        fileName: fileName || "table_export.docx",
        fileSize: fileSize || undefined,
        correlationId: correlation_id || undefined  // 明確傳遞 correlation_id
      };

      console.log("📤 Sending export request with:", {
        fileName: exportData.fileName,
        fileSize: exportData.fileSize,
        correlationId: exportData.correlationId,
        rowCount: exportData.resultTable.length
      });

      // 執行匯出
      const result = await exportToWord(
        exportData, 
        "ai-analysis-summary.docx", 
        token || undefined,
        correlation_id || undefined  // 傳遞 correlation_id
      );
      
      // 成功訊息
      let message = "✅ Word 檔案匯出成功";
      if (result.storageSuccess && result.storageUrl) {
        message += "\n📦 檔案已備份到雲端";
        console.log("雲端備份連結:", result.storageUrl);
        console.log("連結有效至:", result.storageExpires);
      }
      
      console.log(message);
      
      return {
        success: true,
        storageUrl: result.storageUrl,
        message
      };
      
    } catch (error) {
      handleError(error, "Word export");
      
      // 檢查是否可重試
      if (isAppError(error) && error.canRetry) {
        console.log("💡 提示：此錯誤可以重試");
      }
      
      return {
        success: false,
        message: extractErrorMessage(error)
      };
    }
  };

  return {
    canExport,
    handleExportToExcel,
    handleExportToWord
  };
}