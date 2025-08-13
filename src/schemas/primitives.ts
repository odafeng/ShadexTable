import { z } from "zod";

/** 先宣告「型別」(type)，不要用 const 變數自己指到自己 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/** 再宣告「值」(const) 的 schema，遞迴時用 JsonValue(值) 本身 */
export const JsonValue: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue), // 新版 zod: 需要 key + value
  ])
);

/** 常用的字典型別（零 any） */
export const StringRecord = z.record(z.string(), z.string());
export const NumberRecord = z.record(z.string(), z.number());
export const BooleanRecord = z.record(z.string(), z.boolean());
