// app/step3/services/dataTransformService.ts
import { ErrorCode, ErrorContext } from "@/utils/error";
import { createError } from "@/utils/error";
import type {
  TableRow,
  GroupCounts,
  BinaryMapping,
} from "@/features/step3/types";

// 定義導出資料的類型
type ExportValue = string | number | boolean | Date | null | undefined;

export interface ExportDataRow {
  Variable?: string;
  Normal?: ExportValue;
  P?: ExportValue;
  Method?: ExportValue;
  Missing?: ExportValue;
  [key: string]: ExportValue; // 允許動態的群組欄位
}

export function prepareExportData(
  sortedRows: TableRow[],
  displayNames: Record<string, string>,
  groupLabels: Record<string, string>,
  binaryMappings: Record<string, BinaryMapping>,
  groupCounts: GroupCounts,
  exportColumns: string[],
): ExportDataRow[] {
  try {
    return sortedRows.map((row, idx) => {
      const filtered: ExportDataRow = {};

      exportColumns.forEach((col) => {
        if (col === "Variable") {
          let variableName =
            displayNames[row[col]] || formatVariableName(row[col]);

          // 檢查是否為子類別項目，如果是就加上縮排
          const isSubItem = isCategorySubItem(row, sortedRows, idx);
          const isMainVariable = row[col]?.startsWith("**");

          if (isSubItem) {
            // 為子類別加上縮排和樹狀符號
            variableName = `    ├─ ${variableName}`;
          } else if (!isMainVariable && idx > 0) {
            // 檢查是否為連續變項的描述行（如 mean ± sd）
            const prevRow = sortedRows[idx - 1];
            if (
              prevRow?.Variable?.startsWith("**") &&
              !row[col]?.startsWith("**")
            ) {
              // 檢查是否包含統計描述
              const hasStats = /mean|median|±|\d+\.\d+\s*±/.test(row[col]);
              if (hasStats) {
                variableName = `    • ${variableName}`;
              }
            }
          }

          filtered[col] = variableName;
        } else {
          const isGroupCol = ![
            "Variable",
            "Normal",
            "P",
            "Method",
            "Missing",
          ].includes(col);
          const label = isGroupCol
            ? `${groupLabels[col] || col} (n=${groupCounts[col] ?? "?"})`
            : col;

          let value: ExportValue = row[col];

          if (isGroupCol && value !== undefined && value !== null) {
            const valueStr = value.toString();
            const match = valueStr.match(/^(\d+)\s*\([\d.]+%?\)$/);
            if (match && (match[1] === "0" || match[1] === "1")) {
              const binaryKey = `${row.Variable}-${col}`;
              const mapping = binaryMappings[binaryKey];
              if (mapping) {
                value = valueStr.replace(
                  /^(\d)/,
                  (m: string) => mapping[m] || m,
                );
              }
            }
          }

          filtered[label] =
            value !== "nan" && value !== undefined && value !== null
              ? value
              : "";
        }
      });
      return filtered;
    });
  } catch (error) {
    throw createError(
      ErrorCode.DATA_VALIDATION_FAILED,
      ErrorContext.DATA_VALIDATION,
      undefined,
      {
        customMessage: "資料轉換失敗",
        cause: error instanceof Error ? error : undefined,
      },
    );
  }
}

export function formatVariableName(name: string): string {
  if (!name) return "";

  const abbreviations: Record<string, string> = {
    bmi: "BMI",
    hdl: "HDL",
    ldl: "LDL",
    sbp: "SBP",
    dbp: "DBP",
    hr: "HR",
    rr: "RR",
    wbc: "WBC",
    rbc: "RBC",
    hgb: "HGB",
    plt: "PLT",
    ast: "AST",
    alt: "ALT",
    gfr: "GFR",
    egfr: "eGFR",
    ckd: "CKD",
    copd: "COPD",
    cad: "CAD",
    dm: "DM",
    htn: "HTN",
    af: "AF",
    mi: "MI",
    chf: "CHF",
    icu: "ICU",
    er: "ER",
    los: "LOS",
  };

  let cleanName = name.replace(/\*+/g, "");
  cleanName = cleanName.replace(/_/g, " ");
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, "$1 $2");
  cleanName = cleanName.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  const words = cleanName.split(/\s+/);

  const formattedWords = words.map((word) => {
    const lowerWord = word.toLowerCase();

    if (abbreviations[lowerWord]) {
      return abbreviations[lowerWord];
    }

    if (word === word.toUpperCase() && word.length <= 4) {
      return word;
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(" ");
}

export function isCategorySubItem(
  row: TableRow,
  allRows: TableRow[],
  rowIndex: number,
): boolean {
  if (row.Variable?.startsWith("**")) return false;

  const varName = row.Variable?.trim();

  let hasParentMainVar = false;
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (allRows[i]?.Variable?.startsWith("**")) {
      hasParentMainVar = true;
      break;
    }
  }

  if (!hasParentMainVar) return false;

  const excludePatterns = [
    /mean/i,
    /median/i,
    /±/,
    /\d+\.\d+\s*±/,
    /^\d+\.\d+$/,
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(varName)) {
      return false;
    }
  }

  const includePatterns = [
    /^[東西南北中]+$/,
    /^(Male|Female)$/i,
    /^(Yes|No)$/i,
    /^[A-Za-z\s]+$/,
    /^[\u4e00-\u9fa5]+$/,
    /^\d+$/,
  ];

  return includePatterns.some((pattern) => pattern.test(varName));
}

export function createCoreSummaryData(
  filteredRows: TableRow[],
  exportColumns: string[],
): string {
  return filteredRows
    .map((row) => {
      const summary = exportColumns
        .map((col) => `${col}: ${row[col] ?? "—"}`)
        .join(" | ");
      return summary;
    })
    .join("\n");
}
