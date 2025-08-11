// app/step3/hooks/useExport.ts
import { createErrorHandler } from "@/utils/error";
import { reportError } from "@/lib/apiClient";  // ← 從 apiClient 引入 reportError
import { exportToExcel, exportToWord } from "@/services/step3_exportService";
import { prepareExportData, isCategorySubItem } from "@/services/step3_dataTransformService";
import type { TableRow, GroupCounts, BinaryMapping } from "@/app/step3/types";

interface UseExportParams {
  sortedRows: TableRow[];
  displayNames: Record<string, string>;
  groupLabels: Record<string, string>;
  binaryMappings: Record<string, BinaryMapping>;
  groupCounts: GroupCounts;
  groupVar?: string;
}

export function useExport({
  sortedRows,
  displayNames,
  groupLabels,
  binaryMappings,
  groupCounts,
  groupVar
}: UseExportParams) {
  const handleError = createErrorHandler((appError) => {
    reportError(appError);  // 使用從 apiClient 引入的 reportError
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
      const exportData = {
        resultTable: sortedRows.map((row, idx) => {
          const cleanRow: Record<string, any> = {};
          
          Object.keys(row).forEach(key => {
            if (!key.startsWith('_')) {
              if (key === 'Variable') {
                cleanRow[key] = displayNames[row.Variable] || row.Variable;
              } else {
                let value = row[key];
                
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

      await exportToWord(exportData);
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