// app/step3/components/ResultsTabs.tsx
"use client";

import { useState, useEffect, JSX } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, CheckCircle, Info, Edit2, Check, X } from "lucide-react";
import ActionButton2 from "@/components/ui/custom/ActionButton2";
import ActionButton from "@/components/ui/custom/ActionButton";
import { CheckCircle2, ClipboardCopy } from "lucide-react";
import { motion } from "framer-motion";
import { useAnalysisStore } from "@/stores/analysisStore";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableRow from "./SortableRow";
import type { TableRow, TabConfig, TableEditState, CellValue } from "../types";
import DOMPurify from 'isomorphic-dompurify';

// TableEditState 類型已從 types.ts 導入，不需要在此定義

interface Props {
  columns: string[];
  groupCounts: Record<string, number>;
  summaryText: string | null;
  loading: boolean;
  canExport: () => boolean;
  exportToExcel: () => void;
  exportToWord: () => void;
  handleGenerateAIResult: () => void;
  handleCopySummary: () => void;
  autoMode?: boolean;
  tableEditState: TableEditState;
}

const tabs: TabConfig[] = [
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
  groupCounts,
  summaryText,
  loading,
  canExport,
  exportToExcel,
  exportToWord,
  handleGenerateAIResult,
  handleCopySummary,
  autoMode = false,
  tableEditState
}: Props) {
  const [currentTab, setCurrentTab] = useState("table");
  const [currentPage, setCurrentPage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);

  // 只訂閱需要的狀態 - 使用選擇器
  const groupVar = useAnalysisStore((state) => state.groupVar);
  const autoAnalysisResult = useAnalysisStore((state) => state.autoAnalysisResult);

  const rowsPerPage = 10;
  const pageCount = Math.ceil(tableEditState.sortedRows.length / rowsPerPage);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Loading animation
  useEffect(() => {
    if (loading) {
      setCurrentStepIndex(0);
      setShowCompleted(false);

      const timer1 = setTimeout(() => {
        if (loading) {
          setCurrentStepIndex(1);
        }
      }, 2000);

      return () => clearTimeout(timer1);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && currentStepIndex > 0) {
      setCurrentStepIndex(2);
      setShowCompleted(true);

      const hideTimer = setTimeout(() => {
        setShowCompleted(false);
        setCurrentStepIndex(0);
      }, 1500);

      return () => clearTimeout(hideTimer);
    }
  }, [loading, currentStepIndex]);

  const handleCopyClick = () => {
    handleCopySummary();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderCell = (val: CellValue): JSX.Element => {
    if (val === undefined || val === null || val === "nan" || val === "undefined" || val?.toString().trim() === "—") {
      return <span className="text-gray-400 italic">&mdash;</span>;
    }
    // 對表格單元格內容也進行清理
    const cleanValue = DOMPurify.sanitize(String(val), {
      ALLOWED_TAGS: [], // 不允許任何 HTML 標籤
      ALLOWED_ATTR: []
    });
    return <>{cleanValue}</>;
  };

  // 安全地處理 AI 摘要文本
  const renderSummaryText = (text: string | null): string => {
    if (text === null || text === undefined) {
      return "尚未產生摘要，請點擊按鈕產出。";
    }
    // 將任何類型轉換為字串，並進行 HTML 清理
    const textStr = typeof text === 'string' ? text : String(text);
    // 使用 DOMPurify 清理內容，移除所有 HTML 標籤和潛在的 XSS 攻擊向量
    return DOMPurify.sanitize(textStr, {
      ALLOWED_TAGS: [], // 不允許任何 HTML 標籤，只保留純文字
      ALLOWED_ATTR: [], // 不允許任何屬性
      KEEP_CONTENT: true // 保留文字內容
    });
  };

  const currentPageRows = tableEditState.sortedRows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const sortableItems = currentPageRows.map((row: TableRow, idx: number) => {
    const cleanVar = row.Variable?.replace(/\*+/g, '');
    return `sortable-${currentPage * rowsPerPage + idx}-${cleanVar}`;
  });

  return (
    <div>
      {/* Auto mode indicator */}
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
                    {groupVar || "無"}
                  </span>
                </div>
                <p className="text-xs mt-2">
                  💡 以上分類由 AI 自動識別完成<br />
                  📝 類別變項的選項可透過拖曳重新排序
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
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

      {/* Tab content */}
      {currentTab === "table" ? (
        <>
          {/* 編輯提示訊息 - 新增的低調提醒 */}
          <div className="mb-3 px-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Info className="w-3.5 h-3.5" />
              <span>提示：將滑鼠移至變項名稱可編輯名稱，類別選項可拖曳重新排序</span>
            </div>
          </div>

          {/* Table with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={tableEditState.handleDragEnd}
          >
            <div className="overflow-x-auto w-full rounded-md border border-[#CED6E0]">
              <table className="min-w-[700px] w-full text-[18px] text-[#0F2844] table-auto">
                <thead className="bg-[#F0F4F8] sticky top-0 z-10 border-b border-[#CED6E0] text-[#5B6D81] leading-[32px] tracking-[2px]">
                  <tr>
                    {columns.map((key) => {
                      const isGroupColumn = !["Variable", "Normal", "P", "Method", "Missing"].includes(key);
                      const isEditingHeader = tableEditState.editingCell === `header-${key}`;

                      return (
                        <th
                          key={key}
                          className="px-6 py-3 font-semibold whitespace-nowrap text-center"
                        >
                          {key === "Variable" ? (
                            <HoverCard>
                              <HoverCardTrigger className="flex items-center justify-center gap-1 cursor-help">
                                <span>變項</span>
                                <Info className="w-3.5 h-3.5 opacity-50" />
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm w-80">
                                <div className="space-y-2">
                                  <p className="font-semibold">互動功能說明：</p>
                                  <ul className="space-y-1 text-xs">
                                    <li className="flex items-start gap-1">
                                      <span className="text-gray-400">•</span>
                                      <span>滑鼠移至變項名稱，點擊編輯圖示可修改顯示名稱</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-gray-400">•</span>
                                      <span>類別變項的選項可透過拖曳手柄 ⋮⋮ 重新排序</span>
                                    </li>
                                    <li className="flex items-start gap-1">
                                      <span className="text-gray-400">•</span>
                                      <span>類別變項可點擊編輯自訂標籤</span>
                                    </li>
                                  </ul>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : key === "Normal" ? "Normality"
                            : key === "P" ? "P"
                              : key === "Method" ? "Method"
                                : key === "Missing" ? "Missing"
                                  : isEditingHeader ? (
                                    // 編輯模式
                                    <div className="flex items-center justify-center gap-2">
                                      <input
                                        type="text"
                                        value={tableEditState.tempValue}
                                        onChange={(e) => tableEditState.setTempValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            tableEditState.handleEditGroupLabel(key, tableEditState.tempValue);
                                            tableEditState.setEditingCell(null);
                                          } else if (e.key === 'Escape') {
                                            tableEditState.setEditingCell(null);
                                            tableEditState.setTempValue('');
                                          }
                                        }}
                                        className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#0F2844] max-w-[150px] text-center"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          tableEditState.handleEditGroupLabel(key, tableEditState.tempValue);
                                          tableEditState.setEditingCell(null);
                                        }}
                                        className="text-green-600 hover:text-green-700"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          tableEditState.setEditingCell(null);
                                          tableEditState.setTempValue('');
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    // 顯示模式 - 包含組別標籤和樣本數
                                    <div className="flex items-center justify-center gap-2 group">
                                      <span>
                                        {isGroupColumn ? (
                                          <>
                                            {tableEditState.groupLabels[key] || key}
                                            <span className="ml-1 text-xs opacity-75">
                                              (n={groupCounts?.[key] ?? "?"})
                                            </span>
                                          </>
                                        ) : (
                                          key
                                        )}
                                      </span>
                                      {isGroupColumn && (
                                        <button
                                          onClick={() => {
                                            tableEditState.setEditingCell(`header-${key}`);
                                            tableEditState.setTempValue(tableEditState.groupLabels[key] || key);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <Edit2 className="w-3 h-3 text-gray-500" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <SortableContext
                    items={sortableItems}
                    strategy={verticalListSortingStrategy}
                  >
                    {currentPageRows.map((row: TableRow, idx: number) => (
                      <SortableRow
                        key={`${row.Variable}-${currentPage}-${idx}`}
                        row={row}
                        rowIndex={currentPage * rowsPerPage + idx}
                        columns={columns}
                        renderCell={renderCell}
                        displayNames={tableEditState.displayNames}
                        binaryMappings={tableEditState.binaryMappings}
                        onEditName={tableEditState.handleEditName}
                        onEditBinaryMapping={tableEditState.handleEditBinaryMapping}
                        editingCell={tableEditState.editingCell}
                        setEditingCell={tableEditState.setEditingCell}
                        tempValue={tableEditState.tempValue}
                        setTempValue={tableEditState.setTempValue}
                        groupCounts={groupCounts}
                        allRows={tableEditState.sortedRows}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </DndContext>

          {/* Pagination */}
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
              disabled={(currentPage + 1) * rowsPerPage >= tableEditState.sortedRows.length}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="bg-transparent hover:bg-transparent hover:text-[#008587] cursor-pointer"
            >
              下一頁 ▶
            </Button>
          </div>

          {/* Export buttons */}
          <TooltipProvider>
            <div className="flex flex-col items-center sm:flex-row sm:justify-end gap-3 mt-6">
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
                        onClick={exportToWord}
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
        // AI Summary tab
        <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-800 relative">
          <strong className="block text-primary mb-2">AI 產出摘要：</strong>
          <pre className="whitespace-pre-wrap font-sans overflow-x-auto">
            {renderSummaryText(summaryText)}
          </pre>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleCopyClick}
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