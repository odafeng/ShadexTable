// src/schemas/logs.ts
import { z } from "zod";

export const UsageLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  timestamp: z.string().datetime(),
  group_count: z.number().int().min(0),
  ai_enabled: z.boolean(),
  points_spent: z.number().int().min(0),
  summary: z.string(),
  // 新增欄位建議
  file_name: z.string().optional(),
  file_size: z.number().int().optional(),
  analysis_type: z.enum(["table", "survival", "regression"]).optional(),
  duration_ms: z.number().int().optional(),
  error_occurred: z.boolean().default(false),
});

export const LogsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    logs: z.array(UsageLogSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  }),
});

export type UsageLog = z.infer<typeof UsageLogSchema>;
export type LogsResponse = z.infer<typeof LogsResponseSchema>;