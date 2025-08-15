// app/step3/components/SortableRow.tsx
"use client";

import { JSX } from "react";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Check, X } from "lucide-react";

import { formatVariableName, isCategorySubItem } from "@/features/step3/services/dataTransformService";

import type { TableRow, BinaryMapping, CellValue } from "../types";


interface SortableRowProps {
  row: TableRow;
  rowIndex: number;
  columns: string[];
  renderCell: (val: CellValue) => JSX.Element;
  displayNames: Record<string, string>;
  binaryMappings: Record<string, BinaryMapping>;
  onEditName: (originalName: string, newName: string) => void;
  onEditBinaryMapping: (variable: string, original: string, display: string) => void;
  editingCell: string | null;
  setEditingCell: (cell: string | null) => void;
  tempValue: string;
  setTempValue: (value: string) => void;
  groupCounts: Record<string, number>;
  allRows: TableRow[];
}

export default function SortableRow({
  row,
  rowIndex,
  columns,
  renderCell,
  displayNames,
  binaryMappings,
  onEditName,
  onEditBinaryMapping,
  editingCell,
  setEditingCell,
  tempValue,
  setTempValue,
  allRows
}: SortableRowProps) {
  const cleanVariable = row.Variable.replace(/\*+/g, '');
  const isMainVariable = row.Variable.startsWith("**");
  const isDraggableRow = isCategorySubItem(row, allRows, rowIndex);
  
  // 使用包含頁面索引的唯一 ID
  const uniqueId = `sortable-${rowIndex}-${cleanVariable}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: uniqueId,
    disabled: !isDraggableRow
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`border-b border-[#E5EAF0] hover:bg-[#F8FAFC] ${
        isDragging ? 'bg-blue-50 shadow-lg z-50' : ''
      }`}
    >
      {columns.map((key: string, i: number) => {
        // 變項名稱欄位
        if (key === "Variable") {
          const originalName = row[key];
          const displayName = displayNames[originalName] || formatVariableName(originalName);
          const isEditing = editingCell === `${row.Variable}-name`;

          return (
            <td key={key} className="whitespace-nowrap px-6 py-3 text-left font-medium">
              <div className="flex items-center gap-2">
                {/* 美化的拖動手柄 - 六個點 */}
                {isDraggableRow ? (
                  <div className="group">
                    <div 
                      {...attributes} 
                      {...listeners} 
                      className="cursor-move rounded-md p-1 transition-all duration-200 flex-shrink-0 hover:bg-gray-100"
                      title="拖動以重新排序"
                      style={{ touchAction: 'none', minWidth: '20px' }}
                    >
                      <svg 
                        width="12" 
                        height="20" 
                        viewBox="0 0 12 20" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-30 group-hover:opacity-60 transition-opacity duration-200"
                      >
                        <circle cx="3" cy="3" r="1.5" fill="currentColor" className="text-gray-500"/>
                        <circle cx="9" cy="3" r="1.5" fill="currentColor" className="text-gray-500"/>
                        <circle cx="3" cy="10" r="1.5" fill="currentColor" className="text-gray-500"/>
                        <circle cx="9" cy="10" r="1.5" fill="currentColor" className="text-gray-500"/>
                        <circle cx="3" cy="17" r="1.5" fill="currentColor" className="text-gray-500"/>
                        <circle cx="9" cy="17" r="1.5" fill="currentColor" className="text-gray-500"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-5 flex-shrink-0" />
                )}
                
                {/* 變項名稱編輯 */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onEditName(originalName, tempValue);
                          setEditingCell(null);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                          setTempValue('');
                        }
                      }}
                      className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        onEditName(originalName, tempValue);
                        setEditingCell(null);
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingCell(null);
                        setTempValue('');
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className={`
                      ${isMainVariable ? "font-bold" : ""} 
                      ${!isMainVariable && isDraggableRow ? "ml-4" : ""}
                      ${!isMainVariable && !isDraggableRow ? "ml-2" : ""}
                    `}>
                      {displayName}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCell(`${row.Variable}-name`);
                        setTempValue(displayName);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>
            </td>
          );
        } 
        
        // 二元變項的值顯示與編輯
        else if (isDraggableRow && !["P", "Method", "Normal", "Missing"].includes(key)) {
          const value = row[key];
          const isEditing = editingCell === `${row.Variable}-${key}`;
          
          // 檢查是否為 0/1 格式
          const match = value?.toString().match(/^(\d+)\s*\([\d.]+%?\)$/);
          if (match && (match[1] === '0' || match[1] === '1')) {
            const binaryKey = `${row.Variable}-${key}`;
            const mapping = binaryMappings[binaryKey] || { '0': 'No', '1': 'Yes' };
            const displayValue = value != null ? value.toString().replace(/^(\d)/, (m: string) => mapping[m] || m) : '';

            if (isEditing) {
              return (
                <td key={key} className="whitespace-nowrap px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="0=No, 1=Yes"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const parts = tempValue.split(',').map((p: string) => p.trim());
                          const newMapping: BinaryMapping = {};
                          parts.forEach((part: string) => {
                            const [k, v] = part.split('=').map((s: string) => s.trim());
                            if (k && v) newMapping[k] = v;
                          });
                          onEditBinaryMapping(binaryKey, newMapping['0'] || 'No', newMapping['1'] || 'Yes');
                          setEditingCell(null);
                        } else if (e.key === 'Escape') {
                          setEditingCell(null);
                          setTempValue('');
                        }
                      }}
                      className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        const parts = tempValue.split(',').map((p: string) => p.trim());
                        const newMapping: BinaryMapping = {};
                        parts.forEach((part: string) => {
                          const [k, v] = part.split('=').map((s: string) => s.trim());
                          if (k && v) newMapping[k] = v;
                        });
                        onEditBinaryMapping(binaryKey, newMapping['0'] || 'No', newMapping['1'] || 'Yes');
                        setEditingCell(null);
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              );
            }

            return (
              <td key={key} className="whitespace-nowrap px-6 py-3 text-right">
                <div className="group flex items-center justify-end gap-2">
                  <span>{displayValue}</span>
                  <button
                    onClick={() => {
                      setEditingCell(`${row.Variable}-${key}`);
                      setTempValue(`0=${mapping['0']}, 1=${mapping['1']}`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </td>
            );
          }
        }
        
        // 其他欄位的預設處理
        return (
          <td
            key={key}
            className={`whitespace-nowrap px-6 py-3 ${
              i === 0 ? "text-left font-medium" : "text-right"
            }`}
          >
            {key === "P" && typeof row[key] === "string" && row[key].includes("*") ? (
              <span className="text-[#155EEF] font-medium">{row[key]}</span>
            ) : (
              renderCell(row[key])
            )}
          </td>
        );
      })}
    </tr>
  );
}