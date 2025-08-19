// src/features/step3/hooks/useTableEdit.ts
import { useState, useEffect, useRef } from "react";

import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { formatVariableName } from "@/features/step3/services/dataTransformService";
import type { TableRow, BinaryMapping } from "@/features/step3/types";

export function useTableEdit(
  filteredRows: TableRow[],
  groupCounts: Record<string, number>,
) {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [binaryMappings, setBinaryMappings] = useState<
    Record<string, BinaryMapping>
  >({});
  const [sortedRows, setSortedRows] = useState<TableRow[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  // 使用 ref 來追蹤資料的 fingerprint
  const dataFingerprintRef = useRef<string>("");
  const hasEditedRef = useRef<boolean>(false);

  // 計算資料的 fingerprint
  const getDataFingerprint = (
    rows: TableRow[],
    counts: Record<string, number>,
  ) => {
    // 使用變數名稱和群組名稱來建立唯一識別碼
    const rowsKey = rows.map((r) => r.Variable || "").join("|");
    const groupsKey = Object.keys(counts).sort().join("|");
    return `${rowsKey}::${groupsKey}::${rows.length}`;
  };

  // 判斷是否為顯著變化（需要重新初始化）
  const isSignificantChange = (
    oldFingerprint: string,
    newFingerprint: string,
    oldRowsLength: number,
    newRowsLength: number,
  ) => {
    // 如果 fingerprint 完全不同，視為顯著變化
    if (oldFingerprint !== newFingerprint) {
      // 檢查是否只是小幅修改（例如數值變化但結構相同）
      const [oldRows, oldGroups, _oldLength] = oldFingerprint.split("::");
      const [newRows, newGroups, _newLength] = newFingerprint.split("::");

      // 如果變數名稱或群組完全改變，需要重新初始化
      if (oldRows !== newRows || oldGroups !== newGroups) {
        return true;
      }

      // 如果長度差異很大（超過 5 行），需要重新初始化
      if (Math.abs(oldRowsLength - newRowsLength) > 5) {
        return true;
      }
    }

    return false;
  };

  // 初始化和重新初始化邏輯
  useEffect(() => {
    const currentFingerprint = getDataFingerprint(filteredRows, groupCounts);
    const previousRowsLength = sortedRows.length;

    // 檢查是否需要初始化或重新初始化
    const shouldInitialize =
      filteredRows.length > 0 &&
      (dataFingerprintRef.current === "" || // 首次初始化
        isSignificantChange(
          dataFingerprintRef.current,
          currentFingerprint,
          previousRowsLength,
          filteredRows.length,
        ));

    if (shouldInitialize) {
      // 重新初始化所有狀態
      const initialNames: Record<string, string> = {};
      filteredRows.forEach((row) => {
        if (row.Variable) {
          initialNames[row.Variable] = formatVariableName(row.Variable);
        }
      });
      setDisplayNames(initialNames);

      const initialGroupLabels: Record<string, string> = {};
      Object.keys(groupCounts).forEach((group) => {
        initialGroupLabels[group] = formatVariableName(group);
      });
      setGroupLabels(initialGroupLabels);

      setSortedRows(filteredRows);

      // 只在真正的重新初始化時清空這些狀態（不是首次初始化）
      if (dataFingerprintRef.current !== "") {
        setBinaryMappings({}); // 清空二進制映射
        setEditingCell(null); // 清空編輯狀態
        setTempValue(""); // 清空臨時值
        hasEditedRef.current = false; // 重置編輯標記
      }

      // 更新 fingerprint
      dataFingerprintRef.current = currentFingerprint;
    } else if (filteredRows.length > 0) {
      // 小幅更新：只更新 sortedRows，保留編輯狀態
      // 但要確保 sortedRows 中的資料是最新的
      setSortedRows((prevRows) => {
        // 如果用戶有編輯過順序，嘗試保留順序
        if (hasEditedRef.current) {
          // 建立變數名稱到新資料的映射
          const newRowsMap = new Map<string, TableRow>();
          filteredRows.forEach((row) => {
            if (row.Variable) {
              newRowsMap.set(row.Variable, row);
            }
          });

          // 更新現有順序中的資料
          const updatedRows = prevRows
            .map((row) => {
              if (row.Variable && newRowsMap.has(row.Variable)) {
                const newRow = newRowsMap.get(row.Variable);
                return newRow !== undefined ? newRow : null;
              }
              return null;
            })
            .filter((row): row is TableRow => row !== null);

          // 添加新出現的行
          filteredRows.forEach((row) => {
            if (
              row.Variable &&
              !updatedRows.some((r) => r.Variable === row.Variable)
            ) {
              updatedRows.push(row);
            }
          });

          return updatedRows;
        }

        // 如果沒有編輯過，直接使用新資料
        return filteredRows;
      });
    }
  }, [filteredRows, groupCounts, sortedRows.length]);

  const handleEditName = (originalName: string, newName: string) => {
    setDisplayNames((prev) => ({
      ...prev,
      [originalName]: newName,
    }));
    hasEditedRef.current = true;
  };

  const handleEditGroupLabel = (originalGroup: string, newLabel: string) => {
    setGroupLabels((prev) => ({
      ...prev,
      [originalGroup]: newLabel,
    }));
    hasEditedRef.current = true;
  };

  const handleEditBinaryMapping = (
    variable: string,
    original: string,
    display: string,
  ) => {
    setBinaryMappings((prev) => ({
      ...prev,
      [variable]: { "0": original, "1": display },
    }));
    hasEditedRef.current = true;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSortedRows((items) => {
      const oldIndex = items.findIndex((item, idx) => {
        const itemId = `sortable-${idx}-${item.Variable?.replace(/\*+/g, "")}`;
        return itemId === active.id;
      });

      const newIndex = items.findIndex((item, idx) => {
        const itemId = `sortable-${idx}-${item.Variable?.replace(/\*+/g, "")}`;
        return itemId === over.id;
      });

      if (oldIndex !== -1 && newIndex !== -1) {
        // 找出這個範圍內的主變數
        let mainVarIndex = -1;
        for (let i = Math.min(oldIndex, newIndex); i >= 0; i--) {
          if (items[i].Variable?.startsWith("**")) {
            mainVarIndex = i;
            break;
          }
        }

        // 檢查是否在同一個群組內
        let isSameGroup = true;
        const start = Math.min(oldIndex, newIndex);
        const end = Math.max(oldIndex, newIndex);
        for (let i = start; i <= end; i++) {
          if (items[i].Variable?.startsWith("**") && i !== mainVarIndex) {
            isSameGroup = false;
            break;
          }
        }

        if (isSameGroup) {
          hasEditedRef.current = true;
          return arrayMove(items, oldIndex, newIndex);
        }
      }
      return items;
    });
  };

  return {
    displayNames,
    groupLabels,
    binaryMappings,
    sortedRows,
    editingCell,
    tempValue,
    setEditingCell,
    setTempValue,
    handleEditName,
    handleEditGroupLabel,
    handleEditBinaryMapping,
    handleDragEnd,
  };
}
