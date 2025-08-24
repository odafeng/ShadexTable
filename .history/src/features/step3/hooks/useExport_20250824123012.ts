import { useAuth } from "@clerk/nextjs";
import { prepareExportData, isCategorySubItem } from "@/features/step3/services/dataTransformService";
import { exportToExcel, exportToWord } from "@/features/step3/services/exportService";
import type { TableRow, GroupCounts, BinaryMapping, CellValue } from "@/features/step3/types";
import { reportError } from "@/lib/reportError";
import { createErrorHandler } from "@/utils/error";

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

export function useExport({
  sortedRows,
  displayNames,
  groupLabels,
  binaryMappings,
  groupCounts,
  groupVar
}: UseExportParams) {
  const { getToken } = useAuth();  // 使用 Clerk 認證
  
  const handleError = createErrorHandler((appError) => {
    reportError(appError);
    alert(appError.userMessage);
  });

  const canExport = (): boolean => {
    if (!groupVar) return false;
    const uniqueGroups = Object.keys(groupCounts);
    return uniqueGroups.length >= 2;
  };

  const handleExportToExcel = async () => {
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
    } catch (error) {
      handleError(error, "Excel export");
    }
  };

  const handleExportToWord = async () => {
    try {
      // 取得認證 token
      const token = await getToken();
      
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
        groupLabels
      };

      // 傳遞 token 給 exportToWord
      await exportToWord(exportData, "ai-analysis-summary.docx", token || undefined);
    } catch (error) {
      handleError(error, "Word export");
    }
  };

  return {
    canExport,
    handleExportToExcel,
    handleExportToWord
  };
}