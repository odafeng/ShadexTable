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