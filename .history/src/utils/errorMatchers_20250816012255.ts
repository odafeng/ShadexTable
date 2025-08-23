// test-utils/errorMatchers.ts

import { expect } from 'vitest';

import type { AppError } from '@/types/errors';
import { ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors';

/**
 * 部分 AppError 型別，用於測試比較
 * 允許某些欄位為 optional 以便靈活匹配
 */
export interface PartialAppError {
  code?: ErrorCode;
  message?: string;
  userMessage?: string;
  context?: ErrorContext;
  severity?: ErrorSeverity;
  correlationId?: string;
  timestamp?: Date;
  action?: string;
  canRetry?: boolean;
  stack?: string;
  cause?: Error;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * 動態欄位的介面定義
 */
interface DynamicFields {
  correlationId?: string;
  timestamp?: Date;
  stack?: string;
}

/**
 * 錯誤匹配選項
 */
export interface ErrorMatchOptions {
  /** 是否檢查 correlationId 格式 */
  checkCorrelationId?: boolean;
  /** 是否檢查 timestamp */
  checkTimestamp?: boolean;
  /** 是否檢查 stack trace */
  checkStack?: boolean;
  /** 自訂 correlationId 格式的正則表達式 */
  correlationIdPattern?: RegExp;
  /** 是否忽略額外的欄位 */
  ignoreExtraFields?: boolean;
}

/**
 * 預設的錯誤匹配選項
 */
const DEFAULT_OPTIONS: ErrorMatchOptions = {
  checkCorrelationId: true,
  checkTimestamp: true,
  checkStack: false,
  correlationIdPattern: /^[a-zA-Z0-9-]+$/,
  ignoreExtraFields: false,
};

/**
 * UUID v4 格式的正則表達式
 */
export const UUID_V4_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/**
 * 時間戳格式的 correlationId 正則表達式
 */
export const TIMESTAMP_CORRELATION_PATTERN = /^[a-zA-Z-]+-\d{13,}$/;

/**
 * 檢查錯誤是否匹配預期的錯誤物件
 * 
 * @param actualError - 實際拋出的錯誤
 * @param expectedError - 預期的錯誤物件（不包含動態欄位）
 * @param options - 匹配選項
 * 
 * @example
 * ```typescript
 * const error = new AppError(...);
 * expectErrorToMatch(error, {
 *   code: ErrorCode.VALIDATION_ERROR,
 *   message: '驗證失敗',
 *   severity: ErrorSeverity.MEDIUM
 * });
 * ```
 */
export function expectErrorToMatch(
  actualError: unknown,
  expectedError: PartialAppError,
  options: ErrorMatchOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 型別守衛：確保 actualError 是物件
  if (!actualError || typeof actualError !== 'object') {
    throw new Error('實際錯誤必須是一個物件');
  }

  const error = actualError as AppError;

  // 提取動態欄位
  const { correlationId, timestamp, stack, ...staticFields } = error;
  
  // 從預期錯誤中也移除動態欄位（如果存在）
  const { 
    correlationId: _expectedCorrelationId, 
    timestamp: _expectedTimestamp, 
    stack: _expectedStack,
    ...expectedStaticFields 
  } = expectedError;

  // 比較靜態欄位
  if (opts.ignoreExtraFields) {
    expect(staticFields).toMatchObject(expectedStaticFields);
  } else {
    expect(staticFields).toEqual(expectedStaticFields);
  }

  // 檢查 correlationId
  if (opts.checkCorrelationId) {
    expect(correlationId).toBeDefined();
    expect(typeof correlationId).toBe('string');
    
    if (correlationId && opts.correlationIdPattern) {
      expect(correlationId).toMatch(opts.correlationIdPattern);
    }
  }

  // 檢查 timestamp
  if (opts.checkTimestamp && timestamp !== undefined) {
    expect(timestamp).toBeInstanceOf(Date);
    
    // 確保時間戳是合理的（不是太舊或未來的時間）
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);
    
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(tenMinutesAgo.getTime());
    expect(timestamp.getTime()).toBeLessThanOrEqual(oneMinuteFromNow.getTime());
  }

  // 檢查 stack trace
  if (opts.checkStack && stack !== undefined) {
    expect(typeof stack).toBe('string');
    expect(stack.length).toBeGreaterThan(0);
  }
}

/**
 * 建立一個錯誤匹配器，用於 expect().rejects.toEqual()
 * 
 * @param expectedError - 預期的錯誤物件
 * @param options - 匹配選項
 * @returns 可用於 Jest/Vitest expect 的匹配器物件
 * 
 * @example
 * ```typescript
 * await expect(someAsyncFunction()).rejects.toEqual(
 *   createErrorMatcher({
 *     code: ErrorCode.VALIDATION_ERROR,
 *     message: '驗證失敗'
 *   })
 * );
 * ```
 */
export function createErrorMatcher(
  expectedError: PartialAppError,
  options: ErrorMatchOptions = {}
): Record<string, unknown> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const matcher: Record<string, unknown> = {
    ...expectedError,
  };

  // 處理動態欄位
  if (opts.checkCorrelationId) {
    matcher.correlationId = expect.stringMatching(
      opts.correlationIdPattern || DEFAULT_OPTIONS.correlationIdPattern!
    );
  }

  if (opts.checkTimestamp) {
    matcher.timestamp = expect.any(Date);
  }

  if (opts.checkStack) {
    matcher.stack = expect.any(String);
  }

  // 處理可能為 undefined 的欄位
  if (expectedError.cause !== undefined) {
    matcher.cause = expectedError.cause;
  }

  if (expectedError.details !== undefined) {
    matcher.details = expectedError.details;
  }

  if (expectedError.metadata !== undefined) {
    matcher.metadata = expectedError.metadata;
  }

  return matcher;
}

/**
 * 用於 try-catch 區塊的錯誤斷言輔助函數
 * 
 * @param fn - 預期會拋出錯誤的非同步函數
 * @param expectedError - 預期的錯誤物件
 * @param options - 匹配選項
 * 
 * @example
 * ```typescript
 * await assertThrowsError(
 *   () => service.someMethod(),
 *   {
 *     code: ErrorCode.VALIDATION_ERROR,
 *     message: '驗證失敗'
 *   }
 * );
 * ```
 */
export async function assertThrowsError(
  fn: () => Promise<unknown>,
  expectedError: PartialAppError,
  options: ErrorMatchOptions = {}
): Promise<void> {
  let thrownError: unknown;
  let errorWasThrown = false;

  try {
    await fn();
  } catch (error) {
    errorWasThrown = true;
    thrownError = error;
  }

  if (!errorWasThrown) {
    throw new Error('預期函數應該拋出錯誤，但沒有拋出');
  }

  expectErrorToMatch(thrownError, expectedError, options);
}

/**
 * 同步版本的錯誤斷言輔助函數
 * 
 * @param fn - 預期會拋出錯誤的同步函數
 * @param expectedError - 預期的錯誤物件
 * @param options - 匹配選項
 */
export function assertThrowsErrorSync(
  fn: () => unknown,
  expectedError: PartialAppError,
  options: ErrorMatchOptions = {}
): void {
  let thrownError: unknown;
  let errorWasThrown = false;

  try {
    fn();
  } catch (error) {
    errorWasThrown = true;
    thrownError = error;
  }

  if (!errorWasThrown) {
    throw new Error('預期函數應該拋出錯誤，但沒有拋出');
  }

  expectErrorToMatch(thrownError, expectedError, options);
}

/**
 * 建立一個部分錯誤物件，用於測試
 * 自動填充常見的預設值
 * 
 * @param overrides - 要覆蓋的欄位
 * @returns 完整的 PartialAppError 物件
 */
export function createTestError(overrides: Partial<PartialAppError>): PartialAppError {
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: '測試錯誤',
    userMessage: '發生測試錯誤',
    context: ErrorContext.GENERAL,
    severity: ErrorSeverity.MEDIUM,
    action: '請重試',
    canRetry: true,
    ...overrides,
  };
}

/**
 * 用於 expect.objectContaining 的錯誤匹配器工廠
 * 
 * @param expectedError - 預期的錯誤欄位
 * @returns expect.objectContaining 相容的物件
 */
export function errorContaining(
  expectedError: Partial<PartialAppError>
): ReturnType<typeof expect.objectContaining> {
  const matcher: Record<string, unknown> = {};

  // 只包含實際提供的欄位
  Object.entries(expectedError).forEach(([key, value]) => {
    if (value !== undefined) {
      matcher[key] = value;
    }
  });

  return expect.objectContaining(matcher);
}

/**
 * 驗證錯誤陣列
 * 
 * @param errors - 錯誤陣列
 * @param expectedErrors - 預期的錯誤陣列
 * @param options - 匹配選項
 */
export function expectErrorsToMatch(
  errors: unknown[],
  expectedErrors: PartialAppError[],
  options: ErrorMatchOptions = {}
): void {
  expect(errors).toHaveLength(expectedErrors.length);

  errors.forEach((error, index) => {
    expectErrorToMatch(error, expectedErrors[index], options);
  });
}

/**
 * 用於檢查錯誤是否為特定類型
 * 
 * @param error - 要檢查的錯誤
 * @param errorCode - 預期的錯誤代碼
 * @returns 是否匹配
 */
export function isErrorOfType(
  error: unknown,
  errorCode: ErrorCode
): error is AppError {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const appError = error as AppError;
  return appError.code === errorCode;
}

/**
 * 提取錯誤的靜態欄位（移除動態欄位）
 * 
 * @param error - AppError 物件
 * @returns 不包含動態欄位的錯誤物件
 */
export function extractStaticErrorFields(error: AppError): Omit<AppError, keyof DynamicFields> {
  const { correlationId, timestamp, stack, ...staticFields } = error;
  return staticFields;
}

/**
 * 比較兩個錯誤物件，忽略動態欄位
 * 
 * @param actual - 實際的錯誤
 * @param expected - 預期的錯誤
 * @returns 是否相等
 */
export function errorsEqualIgnoringDynamic(
  actual: AppError,
  expected: AppError
): boolean {
  const actualStatic = extractStaticErrorFields(actual);
  const expectedStatic = extractStaticErrorFields(expected);
  
  return JSON.stringify(actualStatic) === JSON.stringify(expectedStatic);
}