// tests/types/test-schemas.ts
export interface MockFile extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath?: string;
}

export interface MockAnalysisResponse {
  success: boolean;
  message?: string;
  group_var?: string;
  cat_vars?: string[];
  cont_vars?: string[];
  classification?: Record<string, string>;
  analysis?: {
    table?: Array<Record<string, unknown>>;
    groupCounts?: Record<string, number>;
    summary?: string;
  };
}

export interface MockFillMissingResponse {
  success: boolean;
  message: string;
  filled_data?: Array<Record<string, unknown>>;
  summary?: Array<{
    column: string;
    before_pct: string;
    after_pct: string;
    fill_method: string;
  }>;
  statistics?: {
    total_rows: number;
    total_columns: number;
    validated_continuous_vars: string[];
    categorical_vars: string[];
  };
}

export interface MockTableAnalysisResponse {
  success: boolean;
  message?: string;
  data?: {
    table?: Array<Record<string, unknown>>;
    groupCounts?: Record<string, number>;
  };
}