// src/schemas/apiContracts.ts
import { z } from 'zod';

// Missing Fill API 回應 Schema
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
    is_normal: z.boolean().nullable().optional(),
    data_type: z.string().optional(),
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

// Table Analyze API 回應 Schema
export const TableAnalyzeResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    table: z.array(z.record(z.unknown())),
    groupCounts: z.record(z.number()).optional(),
    warnings: z.array(z.string()).optional(),
  }).optional(),
  // Flattened fields (因為後端使用 dict_with_flatten)
  table: z.array(z.record(z.unknown())).optional(),
  groupCounts: z.record(z.number()).optional(),
  warnings: z.array(z.string()).optional(),
  log_id: z.number().nullable().optional(),
});