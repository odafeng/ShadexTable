"use client";

import { JSX, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

interface Props {
  columns: string[];
  filteredRows: any[];
  groupCounts: Record<string, number>;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageCount: number;
  summaryText: string | null;
  loading: boolean;
  canExport: () => boolean;
  exportToExcel: () => void;
  exportToWord: () => void;
  handleGenerateAIResult: () => void;
  handleCopySummary: () => void;
  renderCell: (val: any) => JSX.Element;
}

const tabs = [
  {
    key: "table",
    label: "統計表",
    activeIcon: "/step3/tab_icon_1_active@2x.png",
    inactiveIcon: "/step3/tab_icon_1_inactive@2x.png",
  },
  {
    key: "summary",
    label: "AI摘要",
    activeIcon: "/step3/tab_icon_2_active@2x.png",
    inactiveIcon: "/step3/tab_icon_2@2x.png",
  },
];

export default function Step3Tabs({
  columns,
  filteredRows,
  groupCounts,
  currentPage,
  setCurrentPage,
  pageCount,
  summaryText,
  loading,
  canExport,
  exportToExcel,
  exportToWord,
  handleGenerateAIResult,
  handleCopySummary,
  renderCell,
}: Props) {
  const [currentTab, setCurrentTab] = useState("table");

  return (
    <div>
      {/* Tabs 切換區 */}
      <div className="w-full max-h-[60px] flex border-b border-[#D9D9D9] mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-md transition-all ${isActive ? "bg-[#EEF2F9]" : "bg-transparent"
                }`}
            >
              <Image
                src={isActive ? tab.activeIcon : tab.inactiveIcon}
                alt={`${tab.label} icon`}
                width={0}
                height={0}
                className="w-[20px] h-[20px] lg:w-[24px] lg:h-[24px]"
              />
              <span
                className={`text-[18px] sm:text-[22px] leading-[28px] sm:leading-[36px] tracking-[1.5px] sm:tracking-[2.5px] ${isActive ? "text-[#0F2844]" : "text-[#C4C8D0]"
                  }`}
                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 內容區 */}
      {currentTab === "table" ? (
        <>
          {/* 統計表 Table */}
          <div className="overflow-x-auto w-full rounded-md border border-[#CED6E0]">
            <table className="min-w-[700px] w-full text-[18px] text-[#0F2844] table-auto">
              <thead className="bg-[#F0F4F8] sticky top-0 z-10 border-b border-[#CED6E0] text-[#5B6D81] leading-[32px] tracking-[2px]">
                <tr>
                  {columns.map((key) => (
                    <th key={key} className="px-6 py-3 font-semibold text-left whitespace-nowrap">
                      {key === "Variable" ? (
                        <HoverCard>
                          <HoverCardTrigger>變項</HoverCardTrigger>
                          <HoverCardContent className="text-sm">本列為各項變數名稱與描述統計</HoverCardContent>
                        </HoverCard>
                      ) : key === "Normal"
                        ? "Normality"
                        : key === "P"
                          ? "P"
                          : key === "Method"
                            ? "Method"
                            : key === "Missing"
                              ? "Missing"
                              : `${key} (n = ${groupCounts?.[key] ?? "?"})`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows
                  .slice(currentPage * 10, (currentPage + 1) * 10)
                  .map((row, idx) => (
                    <tr key={idx} className="border-b border-[#E5EAF0] hover:bg-[#F8FAFC]">
                      {columns.map((key, i) => (
                        <td
                          key={key}
                          className={`whitespace-nowrap px-6 py-3 ${i === 0 ? "text-left font-medium" : "text-right"}`}
                        >
                          {key === "P" && typeof row[key] === "string" && row[key].includes("*") ? (
                            <span className="text-[#155EEF] font-medium">{row[key]}</span>
                          ) : i === 0 && typeof row[key] === "string" && row[key].startsWith("**") ? (
                            <strong>{row[key].replace(/\*\*/g, "")}</strong>
                          ) : (
                            renderCell(row[key])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 分頁控制 */}
          <div className="flex justify-center items-center gap-4 mt-4 text-sm text-[#637381] whitespace-nowrap">
            <Button
              variant="ghost"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="bg-transparent hover:bg-transparent hover:text-[#008587]"
            >
              ◀ 上一頁
            </Button>

            <span>
              Page {currentPage + 1} / {pageCount}
            </span>

            <Button
              variant="ghost"
              disabled={(currentPage + 1) * 10 >= filteredRows.length}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-transparent hover:bg-transparent hover:text-[#008587]"
            >
              下一頁 ▶
            </Button>
          </div>


          {/* 匯出與 AI 按鈕 */}
          <TooltipProvider>
            <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-3 mt-6">
              {/* Excel + Word 一排 */}
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={exportToExcel}
                        className="w-[160px] h-[50px] rounded-2xl flex items-center justify-center gap-2 text-[#0F2844] font-normal text-[18px] tracking-[2px] leading-[32px] bg-transparent"
                        disabled={!canExport()}
                      >
                        <Image src="/step3/export_icon@2x.png" alt="匯出圖示" width={21.49} height={24} />
                        導出 Excel
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canExport() && (
                    <TooltipContent className="hidden sm:block">
                      需有分組（兩組或以上）才可匯出
                    </TooltipContent>
                  )}
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        onClick={exportToWord}
                        className="w-[160px] h-[50px] rounded-2xl flex items-center justify-center gap-2 text-[#0F2844] font-normal text-[18px] tracking-[2px] leading-[32px] bg-transparent"
                        disabled={!canExport()}
                      >
                        <Image src="/step3/export_icon@2x.png" alt="匯出圖示" width={21.49} height={24} />
                        導出 Word
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canExport() && (
                    <TooltipContent className="hidden sm:block">
                      需有分組（兩組或以上）才可匯出
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* AI 按鈕一整排 */}
              <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                <Button
                  onClick={handleGenerateAIResult}
                  disabled={loading}
                  className="mt-2 sm:mt-0 w-full sm:w-auto gap-2 bg-[#0F2844] rounded-2xl text-white hover:bg-transparent hover:text-[#0F2844] hover:border-[#0F2844]"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "產生中..." : "AI 產生結果摘要"}
                </Button>
              </div>
            </div>
          </TooltipProvider>



        </>
      ) : (
        // AI摘要區塊
        <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap relative">
          <strong className="block text-primary mb-2"> AI 產出摘要：</strong>
          <div>{summaryText || "尚未產生摘要，請點擊按鈕產出。"}</div>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 text-xs"
            onClick={handleCopySummary}
          >
            📋 複製
          </Button>
        </div>
      )}
    </div>
  );
}
