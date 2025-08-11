// app/step3/types.ts
export interface TableRow {
    Variable: string;
    [key: string]: any;
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
        [key: string]: any;
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