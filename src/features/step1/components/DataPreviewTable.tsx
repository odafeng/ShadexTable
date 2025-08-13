// src/features/step1/components/DataPreviewTable.tsx

import React from "react";
import Image from "next/image";
import type { DataRow, DataValue } from "@/stores/analysisStore";

interface DataPreviewTableProps {
  parsedData: DataRow[];
  maxRows?: number;
}

export default function DataPreviewTable({
  parsedData,
  maxRows = 5,
}: DataPreviewTableProps) {
  // 取得第一列的欄位名稱
  const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

  // Excel 日期序列數轉換函數
  const excelDateToJSDate = (excelDate: number): Date => {
    // Excel 的日期序列數是從 1900/1/1 開始計算
    // 但 Excel 錯誤地將 1900 年當作閏年，所以需要調整
    const excelEpoch = new Date(1899, 11, 30); // 1899/12/30
    const msPerDay = 24 * 60 * 60 * 1000;

    // 如果日期序列數大於 60，需要減 1（因為 Excel 的 1900/2/29 bug）
    const adjustedDate = excelDate > 60 ? excelDate - 1 : excelDate;

    return new Date(excelEpoch.getTime() + adjustedDate * msPerDay);
  };

  // 判斷是否為 Excel 日期序列數 - 使用 type guard
  const isExcelDateSerial = (value: unknown): value is number => {
    if (typeof value !== "number") return false;

    // Excel 日期序列數通常在 1（1900/1/1）到 2958465（9999/12/31）之間
    // 實務上常見的範圍是 30000（~1982）到 50000（~2036）
    return value >= 1 && value <= 60000 && Number.isInteger(value);
  };

  // 智能判斷欄位是否可能包含日期
  const isLikelyDateColumn = (columnName: string): boolean => {
    const dateKeywords = [
      "日期",
      "date",
      "時間",
      "time",
      "日",
      "day",
      "年",
      "year",
      "月",
      "month",
      "生日",
      "birth",
      "建立",
      "created",
      "更新",
      "updated",
      "修改",
      "modified",
      "開始",
      "start",
      "結束",
      "end",
      "到期",
      "expire",
      "登記",
      "register",
      "發生",
      "occur",
    ];

    const lowerColumn = columnName.toLowerCase();
    return dateKeywords.some((keyword) => lowerColumn.includes(keyword));
  };

  // 檢查整個欄位的值來判斷是否為日期欄位
  const checkIfDateColumn = React.useCallback(
    (columnName: string): boolean => {
      // 先用欄位名稱快速判斷
      if (isLikelyDateColumn(columnName)) {
        // 檢查前幾筆資料
        const sampleSize = Math.min(10, parsedData.length);
        let dateCount = 0;

        for (let i = 0; i < sampleSize; i++) {
          const value = parsedData[i][columnName];
          if (value && isExcelDateSerial(value)) {
            dateCount++;
          }
        }

        // 如果超過一半的樣本是日期序列數，認為是日期欄位
        return dateCount > sampleSize / 2;
      }

      return false;
    },
    [parsedData],
  );

  // 建立日期欄位的快取
  const dateColumns = React.useMemo(() => {
    const dateColSet = new Set<string>();
    columns.forEach((col) => {
      if (checkIfDateColumn(col)) {
        dateColSet.add(col);
      }
    });
    return dateColSet;
  }, [columns, checkIfDateColumn]);

  // 格式化顯示值的輔助函數
  const formatCellValue = (value: DataValue, columnName: string): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "true" : "false";

    // 如果已經是 Date 物件
    if (value instanceof Date) {
      return value.toLocaleDateString("zh-TW");
    }

    // 處理數值類型
    if (typeof value === "number") {
      // 檢查是否為日期欄位中的 Excel 序列數
      if (dateColumns.has(columnName) && isExcelDateSerial(value)) {
        try {
          const date = excelDateToJSDate(value);
          // 檢查日期是否合理（1900-2100 年之間）
          const year = date.getFullYear();
          if (year >= 1900 && year <= 2100) {
            return date.toLocaleDateString("zh-TW");
          }
        } catch {
          console.warn(`無法轉換日期: ${value}`);
        }
      }

      // 非日期的數值處理
      if (Number.isInteger(value)) {
        return String(value);
      }
      // 如果是小數，顯示到小數點後 1 位
      return value.toFixed(1);
    }

    // 檢查字串是否為日期格式
    if (typeof value === "string") {
      // 嘗試解析常見的日期格式
      const dateFormats = [
        /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/, // YYYY-MM-DD 或 YYYY/MM/DD
        /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/, // DD-MM-YYYY 或 DD/MM/YYYY
        /^\d{8}$/, // YYYYMMDD
      ];

      if (dateFormats.some((format) => format.test(value))) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("zh-TW");
          }
        } catch {
          // 如果解析失敗，返回原始值
        }
      }
    }

    return String(value);
  };

  // 提早返回，避免條件性使用 hooks
  if (parsedData.length === 0) return null;

  return (
    <div className="mt-10 lg:mt-16 space-y-2">
      <div className="flex items-center gap-2">
        <Image
          src="/step1/checkbox_icon@2x.png"
          alt="checkbox"
          width={21.33}
          height={20}
          className="-mt-10 -mr-2 lg:-mt-6 lg-mr-0"
        />
        <p className="text-xs text-[#0F2844] -mt-4 mb-2">
          以下為預覽資料（最多顯示前{maxRows}列）：
        </p>
      </div>
      <div className="overflow-auto border rounded-lg text-sm max-h-64 text-[#0F2844]">
        <table className="min-w-full border-collapse text-left">
          <thead className="bg-[#EEF2F9] text-[#586D81] sticky top-0 z-10">
            <tr>
              {columns.map((key) => (
                <th key={key} className="px-3 py-2 border-b whitespace-nowrap">
                  {key}
                  {dateColumns.has(key) && (
                    <span className="ml-1 text-xs text-gray-400"></span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsedData.slice(0, maxRows).map((row: DataRow, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map((col: string, j: number) => {
                  const value: DataValue = row[col];
                  const displayValue = formatCellValue(value, col);

                  return (
                    <td
                      key={j}
                      className="px-3 py-2 border-b whitespace-nowrap"
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
