import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ColumnAnalysisService, ColumnProfile, ColumnAnalysisResult } from './columnAnalysisService';
import * as apiClient from '@/lib/apiClient';
import * as reportErrorModule from '@/lib/reportError';
import * as errorUtils from '@/utils/error';
import { ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors';
import type { DataRow } from '@/stores/analysisStore';
import type { AppError } from '@/types/errors';
import { expectErrorToMatch, TIMESTAMP_CORRELATION_PATTERN } from '@/utils/errorMatchers';

// Mock 相關模組
vi.mock('@/lib/apiClient');
vi.mock('@/lib/reportError');
vi.mock('@/utils/error', async () => {
  const actual = await vi.importActual<typeof errorUtils>('@/utils/error');
  return {
    ...actual,
    isAppError: vi.fn(),
    createError: vi.fn(),
    CommonErrors: {
      insufficientData: vi.fn(),
      authTokenMissing: vi.fn(),
    },
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ColumnAnalysisService', () => {
  let service: ColumnAnalysisService;
  
  // 測試資料
  const mockDataRows: DataRow[] = [
    { id: 1, name: 'Alice', age: 25, active: true },
    { id: 2, name: 'Bob', age: 30, active: false },
    { id: 3, name: 'Charlie', age: null, active: true },
    { id: 4, name: '', age: 35, active: true },
    { id: 5, name: 'Diana', age: 28, active: null },
  ];

  const mockColumnProfiles: ColumnProfile[] = [
    { column: 'id', missing_pct: '0.0%', suggested_type: '整數' },
    { column: 'name', missing_pct: '20.0%', suggested_type: '文字' },
    { column: 'age', missing_pct: '20.0%', suggested_type: '整數' },
    { column: 'active', missing_pct: '20.0%', suggested_type: '布林' },
  ];

  const mockApiResponse = {
    data: {
      columns: mockColumnProfiles,
    },
  };

  beforeEach(() => {
    service = new ColumnAnalysisService();
    vi.clearAllMocks();
    
    // 設定預設的 mock 行為
    localStorageMock.getItem.mockReturnValue('mock-token');
    vi.mocked(reportErrorModule.reportError).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeColumns', () => {
    describe('成功情境', () => {
      it('應該成功分析欄位並返回結果', async () => {
        // Arrange
        vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse);

        // Act
        const result = await service.analyzeColumns(mockDataRows);

        // Assert
        expect(result).toEqual({
          columns: mockColumnProfiles,
          success: true,
        });

        expect(apiClient.post).toHaveBeenCalledTimes(1);
        expect(apiClient.post).toHaveBeenCalledWith(
          `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/columns`,
          mockDataRows,
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer mock-token',
            },
            context: ErrorContext.ANALYSIS,
            correlationId: expect.stringMatching(TIMESTAMP_CORRELATION_PATTERN),
            timeout: 30000,
          })
        );
      });
    });

    describe('錯誤情境', () => {
      it('當缺少認證 token 時應返回錯誤', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(null);
        const authError: AppError = {
          code: ErrorCode.AUTH_TOKEN_MISSING,
          message: '認證失敗',
          userMessage: '認證失敗，請重新登入',
          context: ErrorContext.ANALYSIS,
          severity: ErrorSeverity.HIGH,
          correlationId: `test-${Date.now()}`,
          timestamp: new Date(),
          action: '請重新登入',
          canRetry: false,
        };
        vi.mocked(errorUtils.CommonErrors.authTokenMissing).mockReturnValue(authError);

        // Act
        const result = await service.analyzeColumns(mockDataRows);

        // Assert
        expect(result.success).toBe(false);
        
        if (result.error) {
          // 使用 ignoreExtraFields 選項來只檢查指定的欄位
          expectErrorToMatch(result.error, {
            code: ErrorCode.AUTH_TOKEN_MISSING,
            severity: ErrorSeverity.HIGH,
            userMessage: '認證失敗，請重新登入',
          }, {
            correlationIdPattern: TIMESTAMP_CORRELATION_PATTERN,
            ignoreExtraFields: true  // 忽略額外欄位，使用 toMatchObject
          });
        }
        
        expect(reportErrorModule.reportError).toHaveBeenCalledWith(
          authError,
          { action: 'column_analysis', dataRows: mockDataRows.length }
        );
        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('當 API 請求失敗時應處理錯誤並嘗試備用方案', async () => {
        // Arrange
        const apiError = new Error('Network error');
        vi.mocked(apiClient.post).mockRejectedValue(apiError);
        vi.mocked(errorUtils.isAppError).mockReturnValue(false);
        
        const mockAppError: AppError = {
          code: ErrorCode.ANALYSIS_ERROR,
          message: '分析錯誤',
          userMessage: '分析過程中發生錯誤',
          context: ErrorContext.ANALYSIS,
          severity: ErrorSeverity.MEDIUM,
          correlationId: `column-analysis-${Date.now()}`,
          timestamp: new Date(),
          action: '請重試',
          canRetry: true,
        };
        vi.mocked(errorUtils.createError).mockReturnValue(mockAppError);

        // Act
        const result = await service.analyzeColumns(mockDataRows);

        // Assert
        expect(result.success).toBe(true); // 備用方案成功
        expect(result.columns).toHaveLength(4);
        
        if (result.error) {
          // 使用 ignoreExtraFields 選項來只檢查指定的欄位
          expectErrorToMatch(result.error, {
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS,
            severity: ErrorSeverity.MEDIUM,
          }, {
            correlationIdPattern: TIMESTAMP_CORRELATION_PATTERN,
            ignoreExtraFields: true  // 忽略額外欄位，使用 toMatchObject
          });
        }
        
        expect(reportErrorModule.reportError).toHaveBeenCalled();
      });
    });
  });
});