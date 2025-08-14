// src/hooks/step1_useAnalysisTrigger.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysisTrigger } from './useAnalysisTrigger';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { CommonErrors } from '@/utils/error';
import type { DataRow } from '@/stores/analysisStore';
import { createErrorMatcher } from '@/utils/errorMatchers';

// Mock 相依套件
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/step1/services/fileAnalysisService', () => ({
  FileAnalysisService: {
    performAutoAnalysis: vi.fn(),
  },
}));

// 測試資料
const mockParsedData: DataRow[] = [
  { id: 1, name: 'Test 1', value: 100 },
  { id: 2, name: 'Test 2', value: 200 },
];

const mockSetFile = vi.fn();
const mockSetGroupVar = vi.fn();
const mockSetCatVars = vi.fn();
const mockSetContVars = vi.fn();
const mockSetAutoAnalysisResult = vi.fn();
const mockSetResultTable = vi.fn();
const mockSetGroupCounts = vi.fn();

// 創建一個完整的 mock store 狀態
const createMockStore = (overrides = {}) => ({
  // File State
  file: null,
  fileName: '',
  fileSize: 0,
  uploadedAt: null,
  parsedData: mockParsedData,
  dataShape: { rows: 2, columns: 3 },
  setFile: mockSetFile,
  setParsedData: vi.fn(),
  updateDataShape: vi.fn(),
  clearFileData: vi.fn(),
  
  // Variable State
  groupVar: '',
  catVars: [] as string[],
  contVars: [] as string[],
  excludedVars: [] as string[],
  fillNA: false,
  imputationMethod: 'none' as const,
  setGroupVar: mockSetGroupVar,
  setCatVars: mockSetCatVars,
  setContVars: mockSetContVars,
  toggleVariable: vi.fn(),
  setFillNA: vi.fn(),
  setImputationMethod: vi.fn(),
  resetVariables: vi.fn(),
  
  // Column State
  columnTypes: [],
  columnProfile: [],
  columnsPreview: [],
  showPreview: false,
  columnAnalysisLoading: false,
  columnAnalysisProgress: 0,
  columnErrors: {},
  setColumnTypes: vi.fn(),
  setColumnProfile: vi.fn(),
  setColumnsPreview: vi.fn(),
  setShowPreview: vi.fn(),
  setColumnAnalysisLoading: vi.fn(),
  setColumnAnalysisProgress: vi.fn(),
  setColumnError: vi.fn(),
  clearColumnErrors: vi.fn(),
  clearColumnData: vi.fn(),
  
  // Result State
  resultTable: [],
  currentResult: null,
  resultHistory: [],
  groupCounts: {},
  aiDiagnosis: null,
  exportFormat: 'excel' as const,
  isExporting: false,
  setResultTable: mockSetResultTable,
  setCurrentResult: vi.fn(),
  addToHistory: vi.fn(),
  setGroupCounts: mockSetGroupCounts,
  setAiDiagnosis: vi.fn(),
  setExportFormat: vi.fn(),
  setIsExporting: vi.fn(),
  clearResults: vi.fn(),
  clearHistory: vi.fn(),
  
  // Auto Analysis State
  autoAnalysisResult: null,
  skipManualStep: false,
  autoAnalysisMode: 'semi' as const,
  aiModel: 'gpt-4' as const,
  setAutoAnalysisResult: mockSetAutoAnalysisResult,
  setSkipManualStep: vi.fn(),
  setAutoAnalysisMode: vi.fn(),
  setAiModel: vi.fn(),
  clearAutoAnalysis: vi.fn(),
  
  // UI State
  currentStep: 1 as const,
  isLoading: false,
  loadingMessage: '',
  errors: [] as string[],
  warnings: [] as string[],
  isDirty: false,
  setCurrentStep: vi.fn(),
  setIsLoading: vi.fn(),
  addError: vi.fn(),
  addWarning: vi.fn(),
  clearErrors: vi.fn(),
  clearWarnings: vi.fn(),
  setIsDirty: vi.fn(),
  
  // Global Actions
  resetAll: vi.fn(),
  resetForNewAnalysis: vi.fn(),
  exportState: vi.fn(),
  importState: vi.fn(),
  
  ...overrides,
});

let mockStoreState = createMockStore();

vi.mock('@/stores/analysisStore', () => ({
  useAnalysisStore: vi.fn((selector) => {
    if (selector) {
      return selector(mockStoreState);
    }
    return mockStoreState;
  }),
}));

describe('useAnalysisTrigger', () => {
  // Mock 函數
  const mockPush = vi.fn();
  const mockGetToken = vi.fn();

  // 測試資料
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
  
  // 使用與 fileAnalysisService 相同的 AutoAnalysisResponse 型別
  const mockAutoAnalysisResponseData = {
    success: true,
    message: 'Analysis completed successfully',
    group_var: 'name',
    cat_vars: ['category'],
    cont_vars: ['value'],
    classification: { col1: 'categorical', col2: 'continuous' },
    analysis: {
      summary: 'Test summary',
      details: { key: 'value' },
      table: mockParsedData,
      groupCounts: { 'Group A': 10, 'Group B': 15 },
    },
    confidence: 0.95,
    suggestions: ['Suggestion 1'],
  };

  // 這是 performAutoAnalysis 實際返回的型別
  const mockSuccessResponse = {
    success: true,
    result: mockAutoAnalysisResponseData,
  };

  beforeEach(() => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 重置 store 狀態
    mockStoreState = createMockStore();

    // 設定 useRouter mock
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any);

    // 設定 useAuth mock
    vi.mocked(useAuth).mockReturnValue({
      getToken: mockGetToken,
      userId: 'test-user-id',
      isLoaded: true,
      isSignedIn: true,
      sessionId: 'test-session',
      signOut: vi.fn(),
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: vi.fn(),
    } as any);

    // 設定預設的成功 token
    mockGetToken.mockResolvedValue('test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始狀態', () => {
    it('應該初始化為正確的預設值', () => {
      const { result } = renderHook(() => useAnalysisTrigger());

      expect(result.current.loading).toBe(false);
      expect(result.current.autoMode).toBe(false);
      expect(typeof result.current.setAutoMode).toBe('function');
      expect(typeof result.current.triggerAnalysis).toBe('function');
    });
  });

  describe('setAutoMode', () => {
    it('應該能正確設定自動模式', () => {
      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      expect(result.current.autoMode).toBe(true);

      act(() => {
        result.current.setAutoMode(false);
      });

      expect(result.current.autoMode).toBe(false);
    });
  });

  describe('手動分析模式', () => {
    it('應該在手動模式下正確處理檔案', async () => {
      const { result } = renderHook(() => useAnalysisTrigger());

      await act(async () => {
        await result.current.triggerAnalysis(mockFile);
      });

      // 驗證設定檔案
      expect(mockSetFile).toHaveBeenCalledWith(mockFile);
      expect(mockSetFile).toHaveBeenCalledTimes(1);

      // 驗證清除自動分析結果
      expect(mockSetAutoAnalysisResult).toHaveBeenCalledWith(null);

      // 驗證導航到 step2
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/step2');
      });
    });

    it('應該在沒有檔案時拋出錯誤', async () => {
      const { result } = renderHook(() => useAnalysisTrigger());

      // 使用 createErrorMatcher 來忽略動態欄位
      const expectedError = createErrorMatcher(
        {
          code: CommonErrors.fileNotSelected().code,
          message: CommonErrors.fileNotSelected().message,
          context: CommonErrors.fileNotSelected().context,
          severity: CommonErrors.fileNotSelected().severity,
          action: CommonErrors.fileNotSelected().action,
          canRetry: CommonErrors.fileNotSelected().canRetry,
          userMessage: CommonErrors.fileNotSelected().userMessage,
        },
        {
          checkCorrelationId: true,
          checkTimestamp: true,
          ignoreExtraFields: true,
        }
      );

      await expect(async () => {
        await act(async () => {
          await result.current.triggerAnalysis(null);
        });
      }).rejects.toMatchObject(expectedError);

      expect(mockSetFile).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('自動分析模式', () => {
    beforeEach(() => {
      vi.mocked(FileAnalysisService.performAutoAnalysis).mockResolvedValue(
        mockSuccessResponse as any
      );
    });

    it('應該在自動模式下成功執行分析', async () => {
      const { result } = renderHook(() => useAnalysisTrigger());

      // 設定為自動模式
      act(() => {
        result.current.setAutoMode(true);
      });

      await act(async () => {
        await result.current.triggerAnalysis(mockFile);
      });

      // 驗證檔案設定
      expect(mockSetFile).toHaveBeenCalledWith(mockFile);

      // 驗證取得 token
      expect(mockGetToken).toHaveBeenCalled();

      // 驗證呼叫自動分析服務
      expect(FileAnalysisService.performAutoAnalysis).toHaveBeenCalledWith(
        mockParsedData,
        false,
        'test-token'
      );

      // 驗證更新 store 狀態
      expect(mockSetGroupVar).toHaveBeenCalledWith('name');
      expect(mockSetCatVars).toHaveBeenCalledWith(['category']);
      expect(mockSetContVars).toHaveBeenCalledWith(['value']);
      expect(mockSetAutoAnalysisResult).toHaveBeenCalledWith(mockAutoAnalysisResponseData);
      expect(mockSetResultTable).toHaveBeenCalledWith(mockParsedData);
      expect(mockSetGroupCounts).toHaveBeenCalledWith({ 
        'Group A': 10, 
        'Group B': 15 
      });

      // 驗證導航到 step3
      expect(mockPush).toHaveBeenCalledWith('/step3');
    });

    it('應該在沒有解析資料時拋出錯誤', async () => {
      // 設定空的解析資料
      mockStoreState = createMockStore({ parsedData: [] });

      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      // 使用 createErrorMatcher
      const expectedError = createErrorMatcher(
        {
          code: CommonErrors.fileNotSelected().code,
          message: CommonErrors.fileNotSelected().message,
          context: CommonErrors.fileNotSelected().context,
          severity: CommonErrors.fileNotSelected().severity,
          action: CommonErrors.fileNotSelected().action,
          canRetry: CommonErrors.fileNotSelected().canRetry,
          userMessage: CommonErrors.fileNotSelected().userMessage,
        },
        {
          checkCorrelationId: true,
          checkTimestamp: true,
          ignoreExtraFields: true,
        }
      );

      await expect(async () => {
        await act(async () => {
          await result.current.triggerAnalysis(mockFile);
        });
      }).rejects.toMatchObject(expectedError);

      expect(FileAnalysisService.performAutoAnalysis).not.toHaveBeenCalled();
    });

    it('應該在沒有 token 時拋出認證錯誤', async () => {
      mockGetToken.mockResolvedValue(null);

      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      // 使用 createErrorMatcher
      const expectedError = createErrorMatcher(
        {
          code: CommonErrors.analysisAuthFailed().code,
          message: CommonErrors.analysisAuthFailed().message,
          context: CommonErrors.analysisAuthFailed().context,
          severity: CommonErrors.analysisAuthFailed().severity,
          action: CommonErrors.analysisAuthFailed().action,
          canRetry: CommonErrors.analysisAuthFailed().canRetry,
          userMessage: CommonErrors.analysisAuthFailed().userMessage,
        },
        {
          checkCorrelationId: true,
          checkTimestamp: true,
          ignoreExtraFields: true,
        }
      );

      await expect(async () => {
        await act(async () => {
          await result.current.triggerAnalysis(mockFile);
        });
      }).rejects.toMatchObject(expectedError);

      expect(FileAnalysisService.performAutoAnalysis).not.toHaveBeenCalled();
    });

    it('應該處理自動分析失敗的情況', async () => {
      const analysisError = new Error('Analysis failed');
      const failedResponse = {
        success: false,
        error: analysisError,
      };
      
      vi.mocked(FileAnalysisService.performAutoAnalysis).mockResolvedValue(
        failedResponse as any
      );

      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.triggerAnalysis(mockFile);
        });
      }).rejects.toThrow('Analysis failed');

      expect(mockSetGroupVar).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalledWith('/step3');
    });

    it('應該處理部分結果缺失的情況', async () => {
      // 模擬部分結果缺失
      const partialResponse = {
        success: true,
        result: {
          success: true,
          group_var: 'partial_group',
          cat_vars: undefined,
          cont_vars: undefined,
          analysis: undefined,
        },
      };
      
      vi.mocked(FileAnalysisService.performAutoAnalysis).mockResolvedValue(
        partialResponse as any
      );

      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      await act(async () => {
        await result.current.triggerAnalysis(mockFile);
      });

      // 驗證使用預設值
      expect(mockSetGroupVar).toHaveBeenCalledWith('partial_group');
      expect(mockSetCatVars).toHaveBeenCalledWith([]);
      expect(mockSetContVars).toHaveBeenCalledWith([]);
      expect(mockSetResultTable).not.toHaveBeenCalled();
      expect(mockSetGroupCounts).not.toHaveBeenCalled();
    });
  });

  describe('fillNA 參數處理', () => {
    it('應該正確傳遞 fillNA 參數', async () => {
      // 模擬 fillNA 為 true
      mockStoreState = createMockStore({ fillNA: true });

      vi.mocked(FileAnalysisService.performAutoAnalysis).mockResolvedValue(
        mockSuccessResponse as any
      );

      const { result } = renderHook(() => useAnalysisTrigger());

      act(() => {
        result.current.setAutoMode(true);
      });

      await act(async () => {
        await result.current.triggerAnalysis(mockFile);
      });

      expect(FileAnalysisService.performAutoAnalysis).toHaveBeenCalledWith(
        mockParsedData,
        true, // 驗證 fillNA 為 true
        'test-token'
      );
    });
  });
});