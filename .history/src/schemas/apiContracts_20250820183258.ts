// src/schemas/apiContracts.ts
import { z } from 'zod';

// table-analyze 回傳的一列（保持彈性：除 Variable/P/Method/Missing/Normal，其餘群組欄位動態）
export const TableRow = z.record(z.unknown()).refine(
  (row) => typeof row['Variable'] !== 'undefined',
  { message: '每列需包含 Variable 欄位' }
);

// /api/table/table-analyze
export const TableAnalyzeResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    table: z.array(TableRow),
    groupCounts: z.record(z.number()).optional(),
  })
});

// /api/preprocess/missing_fill（依你前端程式的「標準回傳」設計，留較寬鬆但可驗核心欄位）
export const MissingFillResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  filled_data: z.array(z.record(z.unknown())).optional(),
  summary: z.array(z.object({
    column: z.string(),
    before_pct: z.string(),
    after_pct: z.string(),
    fill_method: z.string(),
    is_continuous: z.boolean().optional(),
    is_categorical: z.boolean().optional(),
  })).optional(),
  statistics: z.object({
    total_rows: z.number(),
    total_columns: z.number(),
    validated_continuous_vars: z.array(z.string()).optional(),
    categorical_vars: z.array(z.string()).optional(),
    normality_test_results: z.record(z.union([z.boolean(), z.string()])).optional(),
    fill_methods_used: z.array(z.string()).optional(),
  }).optional()
});
