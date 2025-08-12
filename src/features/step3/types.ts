// app/step3/types.ts

import { DragEndEvent } from '@dnd-kit/core';

// Define a union type for possible cell values
export type CellValue = string | number | boolean | null | undefined;

export interface TableRow {
    Variable: string;
    [key: string]: CellValue;
}

export interface BinaryMapping {
    [key: string]: string;
}

export interface GroupCounts {
    [key: string]: number;
}

export interface ExportData {
    resultTable: Array<{
        Variable?: string;  // 改為 optional
        _originalVariable?: string;
        _isSubItem?: boolean;
        [key: string]: CellValue | boolean | undefined;
    }>;
    groupVar?: string;
    groupCounts: GroupCounts;
    groupLabels?: Record<string, string>;
}

export interface TabConfig {
    key: string;
    label: string;
    activeIcon: string;
    inactiveIcon: string;
}

export interface EditState {
    displayNames: Record<string, string>;
    groupLabels: Record<string, string>;
    binaryMappings: Record<string, BinaryMapping>;
    sortedRows: TableRow[];
}

export interface AISummaryResponse {
    summary?: string;
    data?: {
        summary?: string;
    };
}

// 新增 DragEndEvent 類型導出
export type { DragEndEvent } from '@dnd-kit/core';

// 新增 TableEditState 類型（ResultsTabs 需要）
export interface TableEditState {
    sortedRows: TableRow[];
    displayNames: Record<string, string>;
    binaryMappings: Record<string, BinaryMapping>;
    groupLabels: Record<string, string>;
    editingCell: string | null;
    tempValue: string;
    setEditingCell: (cell: string | null) => void;
    setTempValue: (value: string) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    handleEditName: (variable: string, newName: string) => void;
    handleEditBinaryMapping: (variable: string, original: string, display: string) => void;
    handleEditGroupLabel: (key: string, newLabel: string) => void;
}