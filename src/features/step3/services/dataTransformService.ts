// app/step3/services/dataTransformService.ts
import type {
  TableRow,
  GroupCounts,
  BinaryMapping,
} from "@/features/step3/types";
import { ErrorCode, ErrorContext } from "@/utils/error";
import { createError } from "@/utils/error";

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
          // 優先使用 displayNames，否則格式化變數名稱
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

  // 保存原始字串
  const originalName = name;

  // 移除星號
  let cleanName = name.replace(/\*+/g, "");

  // 檢查是否包含特殊字元（斜線、括號、方括號等）
  const hasSpecialChars = /[\/\(\[\]]/.test(cleanName);

  // 如果包含特殊字元，需要特殊處理以保持某些單詞的原始大小寫
  if (hasSpecialChars) {
    // 分析原始字串結構
    // 例如：Test/Variable (n=100) [%]
    // 我們需要保持 Variable 的大寫 V

    // 先處理斜線分隔的部分
    const parts = cleanName.split('/');
    const formattedParts = parts.map((part, index) => {
      // 檢查這部分是否包含括號或方括號
      const beforeParen = part.split(/[\(\[]/)[0].trim();
      const afterParen = part.substring(beforeParen.length);

      // 處理括號前的部分
      if (beforeParen) {
        // 檢查原始字串中這個詞的大小寫
        const originalIndex = originalName.indexOf(beforeParen);
        if (originalIndex !== -1) {
          // 如果原始是 Variable（首字母大寫），保持它
          if (beforeParen.toLowerCase() === 'variable' &&
            originalName.substring(originalIndex, originalIndex + beforeParen.length) === 'Variable') {
            return 'Variable' + afterParen;
          }
        }

        // 處理其他情況
        const lowerWord = beforeParen.toLowerCase();
        if (abbreviations[lowerWord]) {
          return abbreviations[lowerWord] + afterParen;
        }

        // 預設：首字母大寫
        return beforeParen.charAt(0).toUpperCase() +
          beforeParen.slice(1).toLowerCase() +
          afterParen;
      }

      return part;
    });

    return formattedParts.join('/');
  }

  // 處理底線，轉為空格
  cleanName = cleanName.replace(/_/g, " ");

  // 處理已知醫學縮寫的駝峰命名
  // 例如 HDLcholesterol -> HDL cholesterol
  for (const [abbr, replacement] of Object.entries(abbreviations)) {
    // 建立不區分大小寫的正則，匹配縮寫後緊接著小寫字母的情況
    const regex = new RegExp(`\\b(${abbr})([a-z])`, 'gi');
    cleanName = cleanName.replace(regex, (match, p1, p2) => {
      return `${p1} ${p2}`;
    });
  }

  // 處理一般的駝峰命名
  // 小寫字母後接大寫字母：bloodPressure -> blood Pressure
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, "$1 $2");
  // 多個大寫字母後接大寫字母加小寫字母：XMLParser -> XML Parser
  cleanName = cleanName.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  // 分割成單詞
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);

  const formattedWords = words.map((word) => {
    const lowerWord = word.toLowerCase();

    // 檢查是否為已知縮寫
    if (abbreviations[lowerWord]) {
      return abbreviations[lowerWord];
    }

    // 如果整個單詞都是大寫且長度<=4，保持大寫（如 HIV, AIDS, USA）
    if (word === word.toUpperCase() && word.length <= 4) {
      return word;
    }

    // 一般情況：首字母大寫，其餘小寫
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formattedWords.join(" ");
}

export function isCategorySubItem(
  row: TableRow,
  allRows: TableRow[],
  rowIndex: number,
): boolean {
  // 如果變數名以**開頭，則不是子項目
  if (row.Variable?.startsWith("**")) return false;

  const varName = row.Variable?.trim();
  if (!varName) return false;

  // 檢查是否有父主變數
  let hasParentMainVar = false;
  for (let i = rowIndex - 1; i >= 0; i--) {
    if (allRows[i]?.Variable?.startsWith("**")) {
      hasParentMainVar = true;
      break;
    }
  }

  // 沒有父主變數，不是子項目
  if (!hasParentMainVar) return false;

  // 排除統計描述模式
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

  // 改進包含模式，更寬鬆地識別子項目
  const includePatterns = [
    /^[東西南北中]+$/,                    // 方位
    /^(Male|Female)$/i,                   // 性別
    /^(Yes|No)$/i,                        // 是否
    /^[\u4e00-\u9fa5]+$/,                // 純中文
    /^\d+$/,                              // 純數字
    /^[A-Za-z]+$/,                        // 純英文（不含空格）
    /^(Sub\s+Item\s+\d+)$/i,             // Sub Item 模式
    /^[A-Za-z]+\s+[A-Za-z]+(\s+\d+)?$/,  // 英文詞組（可能帶數字）
  ];

  // 如果符合任何包含模式，則是子項目
  return includePatterns.some((pattern) => pattern.test(varName));
}

export function createCoreSummaryData(
  filteredRows: TableRow[],
  exportColumns: string[],
): string {
  return filteredRows
    .map((row) => {
      const summary = exportColumns
        .map((col) => {
          const value = row[col];
          // 將 null、undefined 和空字串都視為無值（向後相容）
          const displayValue =
            value === null ||
              value === undefined ||
              value === '' ||
              (typeof value === 'string' && value.trim() === '')
              ? "—"
              : value;
          return `${col}: ${displayValue}`;
        })
        .join(" | ");
      return summary;
    })
    .join("\n");
}