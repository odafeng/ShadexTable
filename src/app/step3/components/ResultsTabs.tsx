"use client";

import { JSX, useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Bot, CheckCircle } from "lucide-react";
import ActionButton2 from "@/components/ActionButton2";
import ActionButton from "@/components/ActionButton";
import { CheckCircle2, ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion";
import { useAnalysis } from "@/context/AnalysisContext";

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
  autoMode?: boolean;
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

const loadingSteps = [
  "正在解析結果表格...",
  "正在撰寫論文等級摘要...",
  "完成！"
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
  autoMode = false,
}: Props) {
  const [currentTab, setCurrentTab] = useState("table");
  const [copied, setCopied] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // 获取 AI 分析结果
  const { groupVar, catVars, contVars, autoAnalysisResult } = useAnalysis();

  // 处理加载状态的动画效果
  useEffect(() => {
    if (loading) {
      setCurrentStepIndex(0);
      setShowCompleted(false);
      
      // 第一步：解析結果表格 (顯示2秒)
      const timer1 = setTimeout(() => {
        if (loading) { // 確保還在loading狀態才切換
          setCurrentStepIndex(1);
        }
      }, 2000);
      
      return () => {
        clearTimeout(timer1);
      };
    }
  }, [loading]);

  // 單獨處理完成狀態
  useEffect(() => {
    if (!loading && currentStepIndex > 0) {
      // loading 結束時，顯示完成狀態
      setCurrentStepIndex(2);
      setShowCompleted(true);
      
      // 完成狀態顯示1.5秒後隱藏
      const hideTimer = setTimeout(() => {
        setShowCompleted(false);
        setCurrentStepIndex(0);
      }, 1500);
      
      return () => clearTimeout(hideTimer);
    }
  }, [loading, currentStepIndex]);

  // 安全渲染函數
  const renderSafeText = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return String(value);
  };

  // 安全渲染陣列
  const renderSafeArray = (arr: any): string[] => {
    if (!Array.isArray(arr)) {
      console.warn("⚠️ 預期陣列但收到:", typeof arr, arr);
      return [];
    }
    return arr.map(item => renderSafeText(item));
  };

  // 安全渲染摘要文本的函數
  const renderSummaryText = (text: any): string => {
    if (text === null || text === undefined) {
      return "尚未產生摘要，請點擊按鈕產出。";
    }
    
    if (typeof text === 'string') {
      return text;
    }
    
    if (typeof text === 'object') {
      if (text.msg) {
        return `錯誤：${text.msg}`;
      }
      if (text.message) {
        return `錯誤：${text.message}`;
      }
      if (text.detail) {
        return `錯誤：${text.detail}`;
      }
      try {
        return `物件內容：\n${JSON.stringify(text, null, 2)}`;
      } catch (e) {
        return "無法顯示摘要內容（物件轉換失敗）";
      }
    }
    
    return String(text);
  };

  const handleClick = () => {
    handleCopySummary();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportToWordHandler = async () => {
    try {
      // 創建一個自訂的請求來處理二進制響應
      const controller = new AbortController();
      const timeout = 30000; // 30秒超時
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch("/api/export-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Correlation-Id": crypto.randomUUID(),
        },
        body: JSON.stringify({ resultTable: filteredRows, groupVar, groupCounts }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`❌ API 回應錯誤: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 檢查 Content-Type
      const contentType = response.headers.get('content-type');
            
      if (!contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        console.warn('⚠️ 回應的 Content-Type 不是 DOCX，但繼續處理');
      }

      // 獲取二進制數據
      const blob = await response.blob();
        
      if (!blob || blob.size === 0) {
        throw new Error("收到空的檔案");
      }

      // 創建下載鏈接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai-analysis-summary.docx";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("❌ 匯出超時");
      } else {
        console.error("❌ 匯出 Word 失敗:", error);
      }
      // 根據錯誤類型提供不同的用戶提示
    }
  };

  return (
    <div>
      {/* 🔧 只在自動模式且有自動分析結果時顯示 */}
      {autoMode && autoAnalysisResult?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-green-700 space-y-4">
                <div>
                  <strong>分組變項：</strong>
                  <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs">
                    {renderSafeText(groupVar) || "無"}
                  </span>
                </div>
                <div>
                  <strong>類別變項：</strong>
                  <span className="ml-2">
                    {renderSafeArray(catVars).length > 0 ? (
                      renderSafeArray(catVars).map((catVar, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs mr-1 mb-1">
                          {catVar}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">無</span>
                    )}
                  </span>
                </div>
                <div>
                  <strong>連續變項：</strong>
                  <span className="ml-2">
                    {renderSafeArray(contVars).length > 0 ? (
                      renderSafeArray(contVars).map((contVar, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs mr-1 mb-1">
                          {contVar}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">無</span>
                    )}
                  </span>
                </div>
                <p className="text-xs mt-2">
                  💡 以上分類由 AI 自動識別完成，已直接應用於統計分析中
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs 切換區 */}
      <div className="w-full max-h-[60px] flex border-b border-[#D9D9D9] mb-6 overflow-x-auto no-scrollbar whitespace-nowrap cursor-pointer">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-md transition-all cursor-pointer ${isActive ? "bg-[#EEF2F9]" : "bg-transparent"
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
              className="bg-transparent hover:bg-transparent hover:text-[#008587] cursor-pointer"
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
              className="bg-transparent hover:bg-transparent hover:text-[#008587] cursor-pointer"
            >
              下一頁 ▶
            </Button>
          </div>

          {/* 匯出與 AI 按鈕 */}
          <TooltipProvider>
            <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-3 mt-6">
              {/* 导出按鈕區塊 */}
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <ActionButton2
                        text="導出 Excel"
                        onClick={exportToExcel}
                        disabled={!canExport()}
                        className="rounded-2xl px-6 w-[160px]"
                        iconSrc="/step3/export_icon@2x.png"
                        iconGraySrc="/step3/export_icon@2x.png"
                        iconHoverSrc="/step3/export_icon_white.png"
                      />
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
                      <ActionButton2
                        text="導出 Word"
                        onClick={exportToWordHandler}
                        disabled={!canExport()}
                        className="rounded-2xl px-6 w-[160px]"
                        iconSrc="/step3/export_icon@2x.png"
                        iconGraySrc="/step3/export_icon@2x.png"
                        iconHoverSrc="/step3/export_icon_white.png"
                      />
                    </span>
                  </TooltipTrigger>
                  {!canExport() && (
                    <TooltipContent className="hidden sm:block">
                      需有分組（兩組或以上）才可匯出
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>

              {/* AI 按鈕區塊 */}
              <div className="w-full sm:w-auto flex justify-center sm:justify-start relative">
                <ActionButton
                  text="AI 產生結果摘要"
                  onClick={handleGenerateAIResult}
                  disabled={loading}
                  loading={loading}
                  loadingText="產生中..."
                  icon={Sparkles}
                  className="mt-2 sm:mt-0 w-full sm:w-auto px-6"
                />

                {/* 動態狀態提示文字 - 絕對定位在按鈕上方 */}
                {(loading || showCompleted) && (
                  <motion.div
                    key={`${loading}-${showCompleted}-${currentStepIndex}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                  >
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      {loading && (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {!loading && showCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {loading ? loadingSteps[currentStepIndex] : "完成！"}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </TooltipProvider>
        </>
      ) : (
        // AI摘要區塊
        <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap relative">
          <strong className="block text-primary mb-2"> AI 產出摘要：</strong>
          <div>{renderSummaryText(summaryText)}</div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleClick}
            disabled={!summaryText}
            className={`absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border
              ${copied
                ? "bg-[#e6f4ea] text-green-700 border-green-300"
                : "bg-white text-gray-700 border-gray-300 hover:bg-[#0F2844] hover:text-white hover:border-[#0F2844]"
              }
              ${!summaryText ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-sm active:shadow-inner"}
            `}
          >
            {copied ? (
              <>
                <CheckCircle2 size={25} className="mt-[1px]" />
                已複製
              </>
            ) : (
              <>
                <ClipboardCopy size={25} className="mt-[1px]" />
                複製
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}