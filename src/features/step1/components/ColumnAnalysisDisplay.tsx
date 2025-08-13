// step1/components/ColumnAnalysisDisplay.tsx
import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  TableProperties,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { typeColorClass } from "@/lib/constants";
import { useAnalysisStore } from "@/stores/analysisStore";

type SortDirection = "asc" | "desc" | null;
type SortField = "dataType" | "missingPercentage" | null;

export default function ColumnAnalysisDisplay() {
  // 使用 columnProfile，不需要任何類型轉換
  const columnProfile = useAnalysisStore((state) => state.columnProfile);
  const showPreview = useAnalysisStore((state) => state.showPreview);
  const columnAnalysisLoading = useAnalysisStore(
    (state) => state.columnAnalysisLoading,
  );

  // 排序狀態
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 定義資料類型的排序順序（對應後端的中文類型）
  const dataTypeOrder: Record<string, number> = {
    id: 1,
    ID: 1,
    類別變項: 2,
    categorical: 2,
    連續變項: 3,
    continuous: 3,
    日期變項: 4,
    date: 4,
    text: 5,
    文字: 5,
    boolean: 6,
    布林: 6,
    mixed: 7,
    混合: 7,
    unknown: 8,
    不明: 8,
    錯誤: 9,
  };

  // 排序後的資料
  const sortedColumnProfile = useMemo(() => {
    if (!columnProfile || !Array.isArray(columnProfile)) {
      return columnProfile;
    }

    if (sortField === null || sortDirection === null) {
      return columnProfile;
    }

    // 創建新陣列進行排序
    const sorted = [...columnProfile].sort((a, b) => {
      if (sortField === "dataType") {
        // 資料類型排序
        const typeA = a.dataType || "不明";
        const typeB = b.dataType || "不明";

        const orderA = dataTypeOrder[typeA] || 999;
        const orderB = dataTypeOrder[typeB] || 999;

        // 如果類型相同，按欄位名稱排序
        if (orderA === orderB) {
          const nameA = a.column || "";
          const nameB = b.column || "";
          return sortDirection === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }

        return sortDirection === "asc" ? orderA - orderB : orderB - orderA;
      } else if (sortField === "missingPercentage") {
        // 遺漏值比例排序
        const missingA = a.missingPercentage ?? 0;
        const missingB = b.missingPercentage ?? 0;

        // 如果遺漏值相同，按欄位名稱排序
        if (missingA === missingB) {
          const nameA = a.column || "";
          const nameB = b.column || "";
          return nameA.localeCompare(nameB);
        }

        return sortDirection === "asc"
          ? missingA - missingB
          : missingB - missingA;
      }

      return 0;
    });

    return sorted;
  }, [columnProfile, sortField, sortDirection]);

  // 處理排序切換
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同一個欄位，切換排序方向
      if (sortDirection === null) {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      // 不同欄位，重新開始排序
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 取得排序圖標
  const getSortIcon = (field: SortField) => {
    if (sortField !== field || sortDirection === null) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    } else if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1 text-gray-600" />;
    } else {
      return <ArrowDown className="h-4 w-4 ml-1 text-gray-600" />;
    }
  };

  return (
    <div className="mt-8 lg:mt-10">
      {/* 載入狀態 */}
      {columnAnalysisLoading && (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">🔍 正在分析欄位特性...</p>
          <p className="text-gray-500 text-sm mt-1">
            系統正在自動識別資料類型和統計特徵
          </p>
        </div>
      )}

      {/* 成功狀態 - 顯示表格 */}
      {!columnAnalysisLoading &&
        showPreview &&
        columnProfile &&
        columnProfile.length > 0 && (
          <Accordion
            type="multiple"
            defaultValue={["column-preview"]}
            className="w-full"
          >
            <AccordionItem value="column-preview">
              <AccordionTrigger
                className="text-[#0F2844] text-[20px] font-medium tracking-[1.5px] flex items-center justify-between group"
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                <div className="flex items-center gap-2">
                  <TableProperties className="text-[#0F2844]" size={20} />
                  <span className="cursor-pointer">
                    自動欄位解析結果 ({columnProfile.length} 個欄位)
                  </span>
                  <ChevronDown className="h-5 w-5 text-[#0F2844] transition-transform duration-300 group-data-[state=open]:rotate-180 cursor-pointer" />
                </div>
              </AccordionTrigger>

              <AccordionContent className="mt-2">
                <div className="overflow-auto max-h-64 rounded-lg border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#EEF2F9] sticky top-0 text-[#586D81] border-b border-gray-300">
                      <tr>
                        <th className="px-3 py-2 text-left whitespace-nowrap">
                          欄位名稱
                        </th>
                        <th
                          className="px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-[#DDE5F0] transition-colors"
                          onClick={() => handleSort("missingPercentage")}
                        >
                          <div className="flex items-center">
                            遺漏值比例
                            {getSortIcon("missingPercentage")}
                          </div>
                        </th>
                        <th
                          className="px-3 py-2 text-left whitespace-nowrap cursor-pointer hover:bg-[#DDE5F0] transition-colors"
                          onClick={() => handleSort("dataType")}
                        >
                          <div className="flex items-center">
                            資料類型
                            {getSortIcon("dataType")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sortedColumnProfile || columnProfile || []).map(
                        (col, i) => {
                          // 使用原始索引作為 key，避免重新渲染問題
                          const originalIndex =
                            columnProfile?.indexOf(col) ?? i;
                          return (
                            <tr
                              key={`${col.column}-${originalIndex}`}
                              className="hover:bg-gray-50 border-b border-gray-200"
                            >
                              <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                {col.column || `欄位 ${originalIndex + 1}`}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                {col.missingPercentage !== undefined
                                  ? `${col.missingPercentage.toFixed(1)}%`
                                  : "0.0%"}
                              </td>

                              <td
                                className={`px-3 py-2 whitespace-nowrap font-medium ${
                                  typeColorClass[col.dataType] ||
                                  "text-gray-500"
                                }`}
                              >
                                {col.dataType ?? "不明"}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 排序說明 */}
                {sortField !== null && sortDirection !== null && (
                  <div className="mt-2 text-xs text-gray-500 px-3">
                    💡 提示：目前按
                    {sortField === "dataType" ? "資料類型" : "遺漏值比例"}
                    {sortDirection === "asc" ? "升序" : "降序"}
                    排列，再次點擊可切換排序或恢復原始順序
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
    </div>
  );
}
