import { useState, useEffect } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import type { TableRow, BinaryMapping } from "@/app/step3/types";
import { formatVariableName } from "@/services/step3_dataTransformService";

export function useTableEdit(
  filteredRows: TableRow[],
  groupCounts: Record<string, number>
) {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [binaryMappings, setBinaryMappings] = useState<Record<string, BinaryMapping>>({});
  const [sortedRows, setSortedRows] = useState<TableRow[]>([]);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);

  // 初始化
  useEffect(() => {
    if (!hasInitialized && filteredRows.length > 0) {
      const initialNames: Record<string, string> = {};
      filteredRows.forEach(row => {
        if (row.Variable) {
          initialNames[row.Variable] = formatVariableName(row.Variable);
        }
      });
      setDisplayNames(initialNames);
      
      const initialGroupLabels: Record<string, string> = {};
      Object.keys(groupCounts).forEach(group => {
        initialGroupLabels[group] = formatVariableName(group);
      });
      setGroupLabels(initialGroupLabels);
      
      setSortedRows(filteredRows);
      setHasInitialized(true);
    }
  }, [filteredRows, groupCounts, hasInitialized]);

  // 檢測資料變更
  useEffect(() => {
    const firstRow = filteredRows[0];
    const currentFirstRow = sortedRows[0];
    
    if (firstRow && currentFirstRow && 
        firstRow.Variable !== currentFirstRow.Variable && 
        Math.abs(filteredRows.length - sortedRows.length) > 5) {
      setHasInitialized(false);
    }
  }, [filteredRows, sortedRows]);

  const handleEditName = (originalName: string, newName: string) => {
    setDisplayNames(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  const handleEditGroupLabel = (originalGroup: string, newLabel: string) => {
    setGroupLabels(prev => ({
      ...prev,
      [originalGroup]: newLabel
    }));
  };

  const handleEditBinaryMapping = (key: string, mapping: BinaryMapping) => {
    setBinaryMappings(prev => ({
      ...prev,
      [key]: mapping
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setSortedRows((items) => {
      const oldIndex = items.findIndex((item, idx) => {
        const itemId = `sortable-${idx}-${item.Variable?.replace(/\*+/g, '')}`;
        return itemId === active.id;
      });
      
      const newIndex = items.findIndex((item, idx) => {
        const itemId = `sortable-${idx}-${item.Variable?.replace(/\*+/g, '')}`;
        return itemId === over.id;
      });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        let mainVarIndex = -1;
        for (let i = Math.min(oldIndex, newIndex); i >= 0; i--) {
          if (items[i].Variable?.startsWith("**")) {
            mainVarIndex = i;
            break;
          }
        }
        
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