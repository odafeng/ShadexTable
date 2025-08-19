// app/step3/components/DndTableWrapper.tsx
"use client";

import { JSX } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Info, Edit2, Check, X } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

import SortableRow from "./SortableRow";
import type { TableRow, TableEditState, CellValue } from "../types";

interface DndTableWrapperProps {
  columns: string[];
  currentPageRows: TableRow[];
  currentPage: number;
  rowsPerPage: number;
  tableEditState: TableEditState;
  renderCell: (val: CellValue) => JSX.Element;
  groupCounts: Record<string, number>;
}

export default function DndTableWrapper({
  columns,
  currentPageRows,
  currentPage,
  rowsPerPage,
  tableEditState,
  renderCell,
  groupCounts
}: DndTableWrapperProps) {
  // DnD sensors - 現在可以安全地在組件內使用 hooks
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

  const sortableItems = currentPageRows.map((row: TableRow, idx: number) => {
    const cleanVar = row.Variable?.replace(/\*+/g, '');
    return `sortable-${currentPage * rowsPerPage + idx}-${cleanVar}`;
  });

  return (
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
  );
}