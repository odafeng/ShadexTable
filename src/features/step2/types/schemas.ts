/**
 * 完整的 schemas 型別定義
 * 對應後端 FastAPI 的 Pydantic schemas
 */

// ========== 遺漏值處理相關 ==========
export interface MissingFillStrategy {
    column: string;
    method: "mean" | "median" | "mode" | "knn" | "delete_column";
    column_type: "連續變項" | "類別變項" | "日期變項" | "不明";
}

export interface SelfDefinedMissingFillRequest {
    data: Array<Record<string, any>>;
    strategies: MissingFillStrategy[];
    cont_vars: string[];
    cat_vars: string[];
}

export interface SelfDefinedMissingFillResponse {
    filled_data: Array<Record<string, any>>;
    summary: Array<Record<string, any>>;
    statistics: Record<string, any>;
    processing_details?: Array<Record<string, any>>;
}

// ========== 視覺化相關 ==========
export interface PlotRequest {
    data: Array<string | number | null>;
    variable_name: string;
    variable_type: "continuous" | "categorical" | "date";
    plot_type: "boxplot" | "barplot" | "timeline";
    group_by?: string;
    group_data?: Array<string | number | null>;
}

export interface PlotDataPoint {
    x: string | number;
    y: number;
    label?: string;
    count?: number;
    group?: string;
}

export interface BoxplotStatistics {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    std: number;
    outliers: number[];
    n: number;
    missing: number;
}

export interface BarplotStatistics {
    categories: string[];
    counts: number[];
    percentages: number[];
    total: number;
    mode: string;
    unique_count: number;
}

export interface TimelineStatistics {
    start_date: string;
    end_date: string;
    date_range_days: number;
    total_points: number;
    frequency: string;
}

export interface PlotMetadata {
    title: string;
    x_label: string;
    y_label: string;
    variable_type: string;
    plot_config?: Record<string, any>;
}

export interface PlotResponse {
    type: "boxplot" | "barplot" | "timeline";
    data: PlotDataPoint[];
    statistics?: BoxplotStatistics | BarplotStatistics | TimelineStatistics;
    metadata: PlotMetadata;
    plot_url?: string;
    plot_json?: Record<string, any>;
}

export interface BatchPlotRequest {
    data: Array<Record<string, any>>;
    variables: string[];
    cat_vars?: string[];
    cont_vars?: string[];
    group_by?: string;
}

export interface BatchPlotResponse {
    plots: Record<string, PlotResponse>;
    summary: Record<string, any>;
    generated_at: string;
}

// schemas/missingFill.ts
// 遺漏值填補相關的 schemas，對齊後端 API

import type { DataRow } from '@/stores/analysisStore';

/**
 * 單一欄位的資料結構
 * 對應後端 ColumnData
 */
export interface ColumnData {
    column: string;
    missing_pct: string | number;  // 可能是 "10.5" 或 10.5
    suggested_type: string;  // "類別變項" | "連續變項" | "日期變項" | "不明"
    outlier_pct?: string | number;  // 可選：異常值百分比
}

/**
 * 遺漏值填補請求
 * 對應後端 MissingFillRequest
 */
export interface MissingFillRequest {
    columns: ColumnData[];
    data: DataRow[];  // 使用 analysisStore 的 DataRow 型別
    cont_vars: string[];
    cat_vars: string[];
    group_col: string;
}

/**
 * 填補摘要資訊
 */
export interface FillSummaryItem {
    column: string;
    before_pct: string;  // "10.5%"
    after_pct: string;   // "0.0%"
    fill_method: string;  // "平均值填補" | "中位數填補" | "眾數填補" | "KNN 填補" | "未處理"
    data_type: string;
    is_continuous: boolean;
    is_categorical: boolean;
    is_normal: boolean | null;
}

/**
 * 填補統計資訊
 */
export interface FillStatistics {
    total_rows: number;
    total_columns: number;
    validated_continuous_vars: string[];
    categorical_vars: string[];
    normality_test_results: Record<string, boolean>;
    fill_methods_used: string[];
}

/**
 * 遺漏值填補回應（扁平化後）
 * 對應後端 StandardResponse 展開後的結構
 */
export interface MissingFillResponse {
    success: boolean;
    message: string;
    filled_data: DataRow[];
    summary: FillSummaryItem[];
    statistics: FillStatistics;
    processing_details?: Array<Record<string, any>>;
    error_code?: number;
}

/**
 * Listwise deletion 請求
 * 與 MissingFillRequest 相同結構，但處理邏輯不同
 */
export interface ListwiseDeletionRequest {
    columns: ColumnData[];
    data: DataRow[];
    cont_vars: string[];
    cat_vars: string[];
    group_col: string;
}

/**
 * Listwise deletion 回應
 */
export interface ListwiseDeletionResponse {
    success: boolean;
    message: string;
    method: "listwise_deletion";
    original_n: number;
    deleted_n: number;
    retained_n: number;
    filled_data: DataRow[];  // 實際上是刪除後的資料
    error_code?: number;
}

/**
 * 從 columnTypes (ColumnInfo) 轉換為 ColumnData 的輔助函數
 */
export function columnInfoToColumnData(columnInfo: {
    column: string;
    suggested_type: string;
    missingCount?: number;
    missingPercentage?: number;  // 可能已經有百分比
    uniqueCount?: number;
}, totalRows: number): ColumnData {
    // 優先使用已有的 missingPercentage，否則計算
    let missingPct: number;
    if (columnInfo.missingPercentage !== undefined) {
        missingPct = columnInfo.missingPercentage;
    } else if (columnInfo.missingCount !== undefined && totalRows > 0) {
        missingPct = (columnInfo.missingCount / totalRows) * 100;
    } else {
        missingPct = 0;
    }

    return {
        column: columnInfo.column,
        missing_pct: missingPct.toFixed(1),  // 轉為字串格式 "10.5"
        suggested_type: columnInfo.suggested_type || "不明",
    };
}

/**
 * 建立遺漏值填補請求的輔助函數
 */
export function buildMissingFillRequest(
    parsedData: DataRow[],
    columnTypes: Array<{
        column: string;
        suggested_type: string;
        missingCount?: number;
    }>,
    contVars: string[],
    catVars: string[],
    groupVar: string
): MissingFillRequest {
    const totalRows = parsedData.length;

    const columns: ColumnData[] = columnTypes.map(col =>
        columnInfoToColumnData(col, totalRows)
    );

    return {
        columns,
        data: parsedData,
        cont_vars: contVars,
        cat_vars: catVars,
        group_col: groupVar
    };
}

/**
 * 處理填補回應的輔助函數
 */
export function processMissingFillResponse(response: MissingFillResponse) {
    const { filled_data, summary, statistics } = response;
    
    // 計算填補前後的變化
    const totalMissingBefore = summary.reduce((acc, item) => {
        const beforePct = parseFloat(item.before_pct.replace('%', ''));
        return acc + beforePct;
    }, 0);
    
    const totalMissingAfter = summary.reduce((acc, item) => {
        const afterPct = parseFloat(item.after_pct.replace('%', ''));
        return acc + afterPct;
    }, 0);
    
    const affectedColumns = summary
        .filter(item => item.fill_method !== "未處理")
        .map(item => item.column);
    
    return {
        filledData: filled_data,
        processingLog: {
            missingFilled: true,
            fillMethod: 'auto',
            fillTimestamp: Date.now(),
            affectedColumns,
            originalMissingCount: totalMissingBefore,
            filledMissingCount: totalMissingAfter,
            fillSummary: summary.map(item => ({
                column: item.column,
                before_pct: item.before_pct,
                after_pct: item.after_pct,
                fill_method: item.fill_method
            }))
        },
        statistics
    };
}