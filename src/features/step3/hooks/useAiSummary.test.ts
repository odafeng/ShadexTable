// src/features/step3/hooks/useAiSummary.test.ts
import { useAuth } from '@clerk/nextjs';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useAISummary } from '@/features/step3/hooks/useAiSummary';
import { generateAISummary } from '@/features/step3/services/aiSummaryService';
import { createCoreSummaryData } from '@/features/step3/services/dataTransformService';
import type { TableRow } from '@/features/step3/types';
import { reportError } from '@/lib/reportError';
import { createError, ErrorCode, ErrorContext } from '@/utils/error';

// Mock 相依套件
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/step3/services/aiSummaryService', () => ({
  generateAISummary: vi.fn(),
}));

vi.mock('@/features/step3/services/dataTransformService', () => ({
  createCoreSummaryData: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('useAISummary', () => {
  const mockGetToken = vi.fn();
  
  // 測試資料
  const mockFilteredRows: TableRow[] = [
    { Variable: 'Age', 'Group A': '25.5 ± 3.2', 'Group B': '28.3 ± 4.1', P: '0.023' },
    { Variable: 'Gender', 'Group A': '15 (50%)', 'Group B': '18 (60%)', P: '0.456' },
  ];
  
  const mockExportColumns = ['Variable', 'Group A', 'Group B', 'P'];
  const mockCoreSummaryData = 'Variable: Age | Group A: 25.5 ± 3.2 | Group B: 28.3 ± 4.1 | P: 0.023';
  const mockSummaryText = 'This is an AI generated summary of the statistical analysis results.';

  beforeEach(() => {
    vi.clearAllMocks();
    
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
    
    // 設定預設的成功回應
    vi.mocked(createCoreSummaryData).mockReturnValue(mockCoreSummaryData);
    vi.mocked(generateAISummary).mockResolvedValue(mockSummaryText);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始狀態', () => {
    it('應該初始化為正確的預設值', () => {
      const { result } = renderHook(() => useAISummary());

      expect(result.current.summaryText).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(typeof result.current.handleGenerateAIResult).toBe('function');
      expect(typeof result.current.handleCopySummary).toBe('function');
    });
  });

  describe('handleGenerateAIResult', () => {
    it('應該成功生成 AI 摘要', async () => {
      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 驗證取得 token
      expect(mockGetToken).toHaveBeenCalledTimes(1);

      // 驗證資料轉換
      expect(createCoreSummaryData).toHaveBeenCalledWith(mockFilteredRows, mockExportColumns);

      // 驗證呼叫 AI 摘要服務
      expect(generateAISummary).toHaveBeenCalledWith(mockCoreSummaryData, 'test-token');

      // 驗證結果
      expect(result.current.summaryText).toBe(mockSummaryText);
      expect(result.current.loading).toBe(false);
    });

    it('應該正確處理載入狀態', async () => {
      // 使用 Promise 控制非同步流程
      let resolveGenerate: (value: string) => void;
      const generatePromise = new Promise<string>((resolve) => {
        resolveGenerate = resolve;
      });
      
      vi.mocked(generateAISummary).mockReturnValue(generatePromise);

      const { result } = renderHook(() => useAISummary());

      // 開始生成但不等待完成
      const generateAct = act(() => {
        void result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 在 Promise 解析前檢查載入狀態
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      expect(result.current.summaryText).toBeNull();

      // 解析 Promise
      act(() => {
        resolveGenerate!(mockSummaryText);
      });

      // 等待生成完成
      await generateAct;

      // 檢查完成狀態
      expect(result.current.loading).toBe(false);
      expect(result.current.summaryText).toBe(mockSummaryText);
    });

    it('應該在沒有 token 時處理認證錯誤', async () => {
      mockGetToken.mockResolvedValue(null);

      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 驗證錯誤報告
      expect(reportError).toHaveBeenCalled();
      
      // 驗證錯誤訊息顯示 - 修正為 ❌
      expect(result.current.summaryText).toContain('❌');
      expect(result.current.summaryText).toContain('Authentication token missing');
      expect(result.current.loading).toBe(false);

      // 驗證沒有呼叫 AI 服務
      expect(generateAISummary).not.toHaveBeenCalled();
    });

    it('應該處理 AI 服務錯誤', async () => {
      const mockError = createError(
        ErrorCode.ANALYSIS_ERROR,
        ErrorContext.ANALYSIS,
        undefined,
        { customMessage: 'AI 服務暫時無法使用' }
      );
      
      vi.mocked(generateAISummary).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 驗證錯誤報告
      expect(reportError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.ANALYSIS_ERROR,
          context: ErrorContext.ANALYSIS,
        })
      );

      // 驗證錯誤訊息顯示 - 修正為 ❌
      expect(result.current.summaryText).toContain('❌');
      expect(result.current.summaryText).toContain('AI 服務暫時無法使用');
      expect(result.current.loading).toBe(false);
    });

    it('應該處理資料轉換錯誤', async () => {
      const transformError = new Error('Data transformation failed');
      vi.mocked(createCoreSummaryData).mockImplementation(() => {
        throw transformError;
      });

      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 驗證錯誤報告
      expect(reportError).toHaveBeenCalled();
      
      // 驗證沒有呼叫 AI 服務
      expect(generateAISummary).not.toHaveBeenCalled();
      
      // 驗證錯誤狀態 - 修正為 ❌
      expect(result.current.summaryText).toContain('❌');
      expect(result.current.summaryText).toContain('Data transformation failed');
      expect(result.current.loading).toBe(false);
    });

    it('應該處理空資料', async () => {
      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult([], []);
      });

      // 應該仍然嘗試生成摘要（即使是空資料）
      expect(createCoreSummaryData).toHaveBeenCalledWith([], []);
      expect(generateAISummary).toHaveBeenCalled();
    });

    it('應該在每次生成前清除舊的摘要', async () => {
      const { result } = renderHook(() => useAISummary());

      // 第一次生成
      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      expect(result.current.summaryText).toBe(mockSummaryText);

      // 設定延遲以觀察清除行為
      let resolveGenerate: (value: string) => void;
      const generatePromise = new Promise<string>((resolve) => {
        resolveGenerate = resolve;
      });
      vi.mocked(generateAISummary).mockReturnValue(generatePromise);

      // 第二次生成
      const generateAct = act(() => {
        void result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 應該清除舊的摘要
      await waitFor(() => {
        expect(result.current.summaryText).toBeNull();
      });

      // 完成生成
      act(() => {
        resolveGenerate!('New summary');
      });

      await generateAct;

      // 應該有新的摘要
      expect(result.current.summaryText).toBe('New summary');
    });

    it('應該處理未預期的錯誤類型', async () => {
      // 模擬非 Error 物件的錯誤
      vi.mocked(generateAISummary).mockRejectedValue('String error');

      const { result } = renderHook(() => useAISummary());

      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 驗證錯誤被處理
      expect(reportError).toHaveBeenCalled();
      // 修正為 ❌
      expect(result.current.summaryText).toContain('❌');
      expect(result.current.summaryText).toContain('String error');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('handleCopySummary', () => {
    it('應該成功複製摘要文字', async () => {
      const { result } = renderHook(() => useAISummary());

      // 先生成摘要
      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 複製摘要
      act(() => {
        result.current.handleCopySummary();
      });

      // 驗證複製到剪貼簿
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSummaryText);
      
      // 驗證複製狀態
      expect(result.current.copied).toBe(true);

      // 等待複製狀態重置
      await waitFor(
        () => {
          expect(result.current.copied).toBe(false);
        },
        { timeout: 2000 }
      );
    });

    it('應該在沒有摘要時不執行複製', () => {
      const { result } = renderHook(() => useAISummary());

      // 在沒有摘要的情況下嘗試複製
      act(() => {
        result.current.handleCopySummary();
      });

      // 不應該呼叫剪貼簿 API
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(result.current.copied).toBe(false);
    });

    it('應該處理複製失敗的情況', async () => {
      // 模擬剪貼簿 API 失敗
      vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
        new Error('Clipboard write failed')
      );

      const { result } = renderHook(() => useAISummary());

      // 先生成摘要
      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 嘗試複製（會失敗但不應該崩潰）
      await act(async () => {
        result.current.handleCopySummary();
      });

      // 驗證有嘗試複製
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSummaryText);
    });

    it('應該在 1.5 秒後重置複製狀態', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => useAISummary());

      // 先生成摘要
      await act(async () => {
        await result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 複製摘要
      act(() => {
        result.current.handleCopySummary();
      });

      expect(result.current.copied).toBe(true);

      // 快進 1.5 秒
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(result.current.copied).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('並發處理', () => {
    it('應該正確處理多次快速呼叫', async () => {
      const { result } = renderHook(() => useAISummary());

      // 同時發起多個請求
      await act(async () => {
        await Promise.all([
          result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns),
          result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns),
          result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns),
        ]);
      });

      // 最後一次的結果應該被保留
      expect(result.current.summaryText).toBe(mockSummaryText);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('元件卸載處理', () => {
    it('應該在元件卸載時保持最後狀態', async () => {
      const { result, unmount } = renderHook(() => useAISummary());

      // 設定延遲回應
      let resolveGenerate: (value: string) => void;
      const generatePromise = new Promise<string>((resolve) => {
        resolveGenerate = resolve;
      });
      vi.mocked(generateAISummary).mockReturnValue(generatePromise);

      // 開始生成但不等待
      act(() => {
        void result.current.handleGenerateAIResult(mockFilteredRows, mockExportColumns);
      });

      // 確認載入中
      expect(result.current.loading).toBe(true);
      
      // 儲存卸載前的狀態
      const stateBeforeUnmount = {
        loading: result.current.loading,
        summaryText: result.current.summaryText,
      };

      // 立即卸載
      unmount();

      // 完成非同步操作
      act(() => {
        resolveGenerate!(mockSummaryText);
      });

      // 等待一個 tick
      await new Promise(resolve => setTimeout(resolve, 0));

      // 卸載後 result.current 會保留最後的狀態（這是 @testing-library/react 的行為）
      // 驗證狀態沒有被更新（仍然是卸載前的狀態）
      expect(result.current.loading).toBe(stateBeforeUnmount.loading);
      expect(result.current.summaryText).toBe(stateBeforeUnmount.summaryText);
      
      // 重要：驗證沒有錯誤發生（React 不會因為嘗試更新已卸載的元件而報錯）
      // 這個測試主要是確保不會有 memory leak 或 warning
    });
  });
});