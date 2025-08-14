// src/features/step1/hooks/useAutoAnalysis.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAutoAnalysis } from './useAutoAnalysis';
import { useAnalysisStore } from '@/stores/analysisStore';
import * as apiClient from '@/lib/apiClient';
import * as reportErrorModule from '@/lib/reportError';
import { ErrorCode, ErrorContext } from '@/types/errors';
import type { DataRow, AutoAnalysisResult } from '@/stores/analysisStore';

// Mock dependencies
vi.mock('@/lib/apiClient', () => ({
  post: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}));

vi.mock('@/stores/analysisStore', () => {
  const actualStore = vi.importActual('@/stores/analysisStore');
  return {
    ...actualStore,
    useAnalysisStore: vi.fn(),
  };
});

// Test data
const mockParsedData: DataRow[] = [
  { id: 1, name: 'Test 1', value: 100, category: 'A' },
  { id: 2, name: 'Test 2', value: 200, category: 'B' },
  { id: 3, name: 'Test 3', value: 300, category: 'A' },
];

const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });

const mockAutoAnalysisResult: AutoAnalysisResult = {
  success: true,
  message: '分析成功',
  group_var: 'category',
  cat_vars: ['name'],
  cont_vars: ['value'],
  analysis: {
    table: mockParsedData,
    groupCounts: { A: 2, B: 1 },
  },
};

// Mock store functions
const mockStoreFunctions = {
  setFile: vi.fn(),
  setGroupVar: vi.fn(),
  setCatVars: vi.fn(),
  setContVars: vi.fn(),
  setAutoAnalysisResult: vi.fn(),
  setResultTable: vi.fn(),
  setGroupCounts: vi.fn(),
};

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  };
};

describe('useAutoAnalysis Hook', () => {
  const mockGetToken = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup store mock
    (useAnalysisStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStoreFunctions);
    
    // Default successful token
    mockGetToken.mockResolvedValue('test-token-123');
    
    // Reset environment variable
    process.env.NEXT_PUBLIC_API_URL = 'http://test-api.com';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('成功情境', () => {
    it('應該成功執行自動分析並更新 store', async () => {
      // Arrange
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockAutoAnalysisResult);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken, onSuccess: mockOnSuccess }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetToken).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        'http://test-api.com/api/analysis/auto',
        { parsedData: mockParsedData, fillNA: false },
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token-123' },
          context: ErrorContext.ANALYSIS,
          timeout: 60000,
        })
      );

      expect(mockStoreFunctions.setFile).toHaveBeenCalledWith(mockFile);
      expect(mockStoreFunctions.setGroupVar).toHaveBeenCalledWith('category');
      expect(mockStoreFunctions.setCatVars).toHaveBeenCalledWith(['name']);
      expect(mockStoreFunctions.setContVars).toHaveBeenCalledWith(['value']);
      expect(mockStoreFunctions.setAutoAnalysisResult).toHaveBeenCalledWith(mockAutoAnalysisResult);
      expect(mockStoreFunctions.setResultTable).toHaveBeenCalledWith(mockParsedData);
      expect(mockStoreFunctions.setGroupCounts).toHaveBeenCalledWith({ A: 2, B: 1 });
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it('應該處理填補缺失值選項', async () => {
      // Arrange
      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockAutoAnalysisResult);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, true);

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        { parsedData: mockParsedData, fillNA: true },
        expect.any(Object)
      );
    });
  });

  describe('檔案驗證錯誤', () => {
    it('應該拒絕未選擇檔案的請求', async () => {
      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(null, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.current.error?.userMessage).toContain('請先選擇要上傳的檔案');
      expect(reportErrorModule.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
        }),
        { action: 'auto_analysis_validation' }
      );
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('應該拒絕空資料', async () => {
      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, [], false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.current.error?.userMessage).toContain('資料不足');
      expect(reportErrorModule.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
        }),
        { action: 'auto_analysis_validation' }
      );
    });

    it('應該處理不支援的檔案格式', async () => {
      // Arrange
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const errorResponse = {
        code: ErrorCode.FILE_FORMAT_UNSUPPORTED,
        userMessage: '不支援的檔案格式',
        context: ErrorContext.FILE_UPLOAD,
      };
      
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(errorResponse);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(invalidFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(reportErrorModule.reportError).toHaveBeenCalled();
    });
  });

  describe('認證錯誤', () => {
    it('應該處理 token 獲取失敗', async () => {
      // Arrange
      mockGetToken.mockResolvedValue(null);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.AUTH_ERROR);
      expect(result.current.error?.context).toBe(ErrorContext.ANALYSIS);
      expect(reportErrorModule.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.AUTH_ERROR,
        }),
        { action: 'auto_analysis_auth' }
      );
    });

    it('應該處理 token 異常錯誤', async () => {
      // Arrange
      const tokenError = new Error('Token service unavailable');
      mockGetToken.mockRejectedValue(tokenError);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.AUTH_ERROR);
      expect(reportErrorModule.reportError).toHaveBeenCalled();
    });
  });

  describe('API 錯誤處理', () => {
    it('應該處理 API 回傳的分析錯誤', async () => {
      // Arrange
      const apiError = {
        code: ErrorCode.ANALYSIS_ERROR,
        message: '分析失敗',
        userMessage: '資料分析過程中發生錯誤',
        context: ErrorContext.ANALYSIS,
        severity: 'HIGH',
        correlationId: 'test-correlation-id',
        timestamp: new Date(),
        action: '請重試或檢查資料格式',
        canRetry: true,
      };
      
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(apiError);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.ANALYSIS_ERROR);
      expect(reportErrorModule.reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.ANALYSIS_ERROR,
        }),
        expect.objectContaining({
          action: 'auto_analysis_error',
          fileName: 'test.csv',
          dataSize: 3,
        })
      );
    });

    it('應該處理網路錯誤', async () => {
      // Arrange
      const networkError = new Error('Network timeout');
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(networkError);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.ANALYSIS_ERROR);
      expect(reportErrorModule.reportError).toHaveBeenCalled();
    });

    it('應該處理分析超時', async () => {
      // Arrange
      const timeoutError = {
        code: ErrorCode.ANALYSIS_TIMEOUT,
        message: '分析超時',
        userMessage: '分析超時，請稍後重試',
        context: ErrorContext.ANALYSIS,
      };
      
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(timeoutError);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.ANALYSIS_TIMEOUT);
    });
  });

  describe('錯誤清除與重置', () => {
    it('應該能清除錯誤狀態', async () => {
      // Arrange
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Test error')
      );

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.clearError();

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });

    it('應該能重置 mutation 狀態', async () => {
      // Arrange
      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Test error')
      );

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      result.current.setError();

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('缺少必要欄位', () => {
    it('應該處理缺少關鍵欄位的資料', async () => {
      // Arrange
      const incompleteData: DataRow[] = [
        { id: 1 }, // 缺少 name, value, category
        { id: 2 },
      ];

      const incompleteResult = {
        success: true,
        message: '分析成功但識別變項有限',
        group_var: undefined,
        cat_vars: [],
        cont_vars: [],
      };

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(incompleteResult);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, incompleteData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.userMessage).toContain('自動分析未能識別到有效的變項');
      expect(reportErrorModule.reportError).toHaveBeenCalled();
    });

    it('應該處理部分成功的分析結果', async () => {
      // Arrange
      const partialResult: AutoAnalysisResult = {
        success: true,
        message: '部分分析成功',
        group_var: 'category',
        cat_vars: [],  // 沒有類別變項
        cont_vars: ['value'],  // 只有連續變項
      };

      (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue(partialResult);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(null);
      expect(mockStoreFunctions.setGroupVar).toHaveBeenCalledWith('category');
      expect(mockStoreFunctions.setCatVars).toHaveBeenCalledWith([]);
      expect(mockStoreFunctions.setContVars).toHaveBeenCalledWith(['value']);
    });
  });

  describe('檔案大小限制', () => {
    it('應該處理超過大小限制的檔案', async () => {
      // Arrange
      const sizeError = {
        code: ErrorCode.FILE_SIZE_EXCEEDED,
        message: '檔案超過大小限制',
        userMessage: '檔案大小超過 50MB 限制',
        context: ErrorContext.FILE_UPLOAD,
        details: {
          actualSize: 100 * 1024 * 1024,
          maxSize: 50 * 1024 * 1024,
        },
      };

      (apiClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(sizeError);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      result.current.handleAutoAnalyze(largeFile, mockParsedData, false);

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
      expect(reportErrorModule.reportError).toHaveBeenCalled();
    });
  });

  describe('Loading 狀態管理', () => {
    it('應該正確管理 loading 狀態', async () => {
      // Arrange
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue(pendingPromise);

      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      expect(result.current.loading).toBe(false);

      result.current.handleAutoAnalyze(mockFile, mockParsedData, false);

      // Assert - Loading should be true
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!(mockAutoAnalysisResult);

      // Assert - Loading should be false after completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Mutation 物件暴露', () => {
    it('應該暴露完整的 mutation 物件供進階使用', () => {
      // Act
      const { result } = renderHook(
        () => useAutoAnalysis({ getToken: mockGetToken }),
        { wrapper: createWrapper() }
      );

      // Assert
      expect(result.current.mutation).toBeDefined();
      expect(result.current.mutation.mutate).toBeDefined();
      expect(result.current.mutation.mutateAsync).toBeDefined();
      expect(result.current.mutation.reset).toBeDefined();
    });
  });
});