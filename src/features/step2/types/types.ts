// step2/types/types.ts

// ========== 基本資料型別 ==========
export type PlotValue = string | number | null;
export type PlotConfig = Record<string, string | number | boolean>;

// ========== 圖表資料結構 ==========
export interface PlotDataPoint {
    x: string | number;
    y: number;
    label?: string;
    count?: number;
    group?: string;
}

export interface PlotMetadata {
    title: string;
    x_label: string;
    y_label: string;
    variable_type: string;
    plot_config?: PlotConfig;
}

// ========== 統計資料介面 ==========
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

// ========== API 響應介面 ==========
export interface FlattenedPlotResponse {
    success: boolean;
    message: string;
    error_code?: number;
    type: "boxplot" | "barplot" | "timeline";
    data: PlotDataPoint[];
    statistics?: BoxplotStatistics | BarplotStatistics | TimelineStatistics;
    metadata: PlotMetadata;
    plot_url?: string;
    plot_json?: {
        data: any[];
        layout: any;
    };
}

// ========== API 請求介面 ==========
export interface PlotRequest {
    data: PlotValue[];
    variable_name: string;
    variable_type: "continuous" | "categorical" | "date";
    plot_type: "boxplot" | "barplot" | "timeline";
    group_by?: string;
    group_data?: PlotValue[];
}

// ========== 變項資訊 ==========
export interface VariableInfo {
    name: string;
    type: string;
    isGroupVar: boolean;
}

// ========== 錯誤處理 ==========
export interface ApiError {
    response?: {
        data?: {
            message?: string;
            error?: string;
        };
        status?: number;
    };
    message?: string;
}

// ========== 圖表系列型別 (ApexCharts) ==========
export interface BoxPlotSeries {
    name: string;
    type: 'boxPlot';
    data: Array<{
        x: string;
        y: number[];
    }>;
}

export interface ScatterSeries {
    name: string;
    type: 'scatter';
    data: Array<{
        x: string;
        y: number;
    }>;
}

export type ChartSeries = BoxPlotSeries | ScatterSeries;

// ========== 配色常數 ==========
export const PLOT_COLORS = {
    continuous: "#047857",  // emerald-700
    categorical: "#0369a1", // sky-700
    date: "#b45309",        // amber-700
    unknown: "#737373",     // neutral-500
    primary: "#0F2844",     // 主色
    secondary: "#0369a1",   // sky-700
    accent: "#047857",      // emerald-700
    
    // 漸層色系（用於多類別）
    palette: [
        "#0369a1",  // sky-700
        "#047857",  // emerald-700
        "#b45309",  // amber-700
        "#0891b2",  // cyan-600
        "#059669",  // emerald-600
        "#ca8a04",  // yellow-600
        "#0284c7",  // sky-600
        "#10b981",  // emerald-500
        "#f59e0b",  // amber-500
        "#06b6d4",  // cyan-500
    ] as string[]  // 移除 as const，改為明確指定為 string[]
};