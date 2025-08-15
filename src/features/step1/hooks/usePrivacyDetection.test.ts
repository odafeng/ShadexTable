// src/features/step1/hooks/usePrivacyDetection.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { usePrivacyDetection } from '@/features/step1/hooks/usePrivacyDetection';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import type { FileAnalysisResult } from '@/features/step1/services/fileAnalysisService';
import type { DataRow } from '@/stores/analysisStore';
import { CommonErrors, createError, ErrorCode, ErrorContext } from '@/utils/error';

// Mock 依賴模組
vi.mock('@/features/step1/services/fileAnalysisService');
vi.mock('@/features/auth/hooks/useUserLimits', () => ({
  useUserLimits: vi.fn(() => ({
    userType: 'GENERAL',
    plan: 'free',
    limits: {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      maxRows: 10000,
      maxColumns: 100,
      allowedExtensions: ['.csv', '.xls', '.xlsx'], // 添加 allowedExtensions
    },
    formattedLimits: {
      maxSize: '10 MB',
      maxRows: '10,000',
      maxColumns: '100',
      userTypeName: '一般版',
      planName: '免費版',
    },
    isLoading: false,
    canUpgradeFile: true,
    upgradeMessage: '升級到專業版可享有更大的檔案限制',
  })),
}));

// 測試用的模擬資料
const mockDataRows: DataRow[] = [
  { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
];

const createMockFile = (
  name: string = 'test.csv',
  size: number = 1024,
  type: string = 'text/csv'
): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
};

describe('usePrivacyDetection Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重設 console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // 重新設置 FileAnalysisService mock
    vi.mocked(FileAnalysisService.processFileComplete).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始狀態', () => {
    it('應該返回正確的初始狀態', () => {
      const { result } = renderHook(() => usePrivacyDetection());

      expect(result.current.showPrivacyDialog).toBe(false);
      expect(result.current.sensitiveColumns).toEqual([]);
      expect(result.current.privacySuggestions).toEqual([]);
      expect(result.current.fileBasicInfo).toBeNull();
      expect(result.current.sensitiveDetectionLoading).toBe(false);
      expect(result.current.pendingFile).toBeNull();
    });

    it('應該提供所有必要的方法', () => {
      const { result } = renderHook(() => usePrivacyDetection());

      expect(typeof result.current.detectSensitiveData).toBe('function');
      expect(typeof result.current.confirmPrivacy).toBe('function');
      expect(typeof result.current.cancelPrivacy).toBe('function');
      expect(typeof result.current.resetPrivacyState).toBe('function');
    });
  });

  describe('detectSensitiveData - 成功情境', () => {
    it('應該成功處理沒有敏感資料的檔案', async () => {
      const mockFile = createMockFile('data.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      // 等待異步更新
      await waitFor(() => {
        expect(result.current.showPrivacyDialog).toBe(true);
      });

      expect(detectResult).toEqual({
        success: true,
        sensitiveColumns: [],
        suggestions: [],
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        data: mockDataRows,
      });

      expect(result.current.sensitiveColumns).toEqual([]);
      expect(result.current.fileBasicInfo).toEqual({
        name: 'data.csv',
        size: 1024,
        rows: 3,
        columns: 4,
        hasMultipleSheets: false,
      });
    });

    it('應該成功檢測到敏感資料並顯示對話框', async () => {
      const mockFile = createMockFile('sensitive.csv', 2048);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'sensitive.csv',
          size: 2048,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['email', 'ssn', 'phone'],
        suggestions: [
          '建議移除電子郵件欄位',
          '建議移除身分證字號欄位',
          '建議移除電話號碼欄位',
        ],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult).toEqual({
        success: true,
        sensitiveColumns: ['email', 'ssn', 'phone'],
        suggestions: [
          '建議移除電子郵件欄位',
          '建議移除身分證字號欄位',
          '建議移除電話號碼欄位',
        ],
        fileInfo: {
          name: 'sensitive.csv',
          size: 2048,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        data: mockDataRows,
      });

      expect(result.current.showPrivacyDialog).toBe(true);
      expect(result.current.sensitiveColumns).toEqual(['email', 'ssn', 'phone']);
      expect(result.current.privacySuggestions).toEqual([
        '建議移除電子郵件欄位',
        '建議移除身分證字號欄位',
        '建議移除電話號碼欄位',
      ]);
    });

    it('應該處理多工作表 Excel 檔案', async () => {
      const mockFile = createMockFile('data.xlsx', 5000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.xlsx',
          size: 5000,
          rows: 100,
          columns: 20,
          hasMultipleSheets: true,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: ['檔案包含多個工作表，僅處理第一個工作表'],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      await waitFor(() => {
        expect(result.current.fileBasicInfo?.hasMultipleSheets).toBe(true);
      });
    });
  });

  describe('detectSensitiveData - 錯誤情境', () => {
    it('應該處理檔案格式不支援的錯誤', async () => {
      const mockFile = createMockFile('data.pdf', 1024, 'application/pdf');
      const mockError = CommonErrors.fileFormatUnsupported();
      const mockResult: FileAnalysisResult = {
        success: false,
        error: mockError,
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult).toEqual({
        success: false,
        sensitiveColumns: [],
        suggestions: [],
        fileInfo: null,
        error: mockError,
      });

      expect(result.current.showPrivacyDialog).toBe(false);
      expect(result.current.sensitiveColumns).toEqual([]);
    });

    it('應該處理檔案大小超過限制的錯誤', async () => {
      const mockFile = createMockFile('large.csv', 20 * 1024 * 1024); // 20MB
      const mockError = CommonErrors.fileSizeExceeded(20 * 1024 * 1024, 10 * 1024 * 1024);
      const mockResult: FileAnalysisResult = {
        success: false,
        error: mockError,
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult.success).toBe(false);
      expect(detectResult.error?.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
      expect(result.current.sensitiveDetectionLoading).toBe(false);
    });

    it('應該處理檔案為空的錯誤', async () => {
      const mockFile = createMockFile('empty.csv', 0);
      const mockError = CommonErrors.fileEmpty();
      const mockResult: FileAnalysisResult = {
        success: false,
        error: mockError,
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult.success).toBe(false);
      expect(detectResult.error?.code).toBe(ErrorCode.FILE_EMPTY);
    });

    it('應該處理檔案損壞的錯誤', async () => {
      const mockFile = createMockFile('corrupted.csv', 1024);
      const mockError = CommonErrors.fileCorrupted();
      const mockResult: FileAnalysisResult = {
        success: false,
        error: mockError,
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult.success).toBe(false);
      expect(detectResult.error?.code).toBe(ErrorCode.FILE_CORRUPTED);
    });

    it('應該處理服務拋出的例外', async () => {
      const mockFile = createMockFile('error.csv', 1024);
      const errorMessage = '網路連線錯誤';
      
      vi.mocked(FileAnalysisService.processFileComplete).mockRejectedValue(
        createError(
          ErrorCode.NETWORK_ERROR,
          ErrorContext.FILE_PROCESSING,
          undefined,
          { customMessage: errorMessage }
        )
      );

      const { result } = renderHook(() => usePrivacyDetection());

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult.success).toBe(false);
      expect(detectResult.error?.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('confirmPrivacy 方法', () => {
    it('應該正確處理用戶確認隱私', async () => {
      const mockFile = createMockFile('data.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['email'],
        suggestions: ['建議移除電子郵件欄位'],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 先檢測檔案
      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      expect(result.current.showPrivacyDialog).toBe(true);

      // 確認隱私
      act(() => {
        result.current.confirmPrivacy();
      });

      expect(result.current.showPrivacyDialog).toBe(false);
      // 注意：確認後不會清除敏感資料資訊，因為可能需要在後續流程中使用
      expect(result.current.sensitiveColumns).toEqual(['email']);
    });

    it('應該在沒有敏感資料時也能確認', async () => {
      const mockFile = createMockFile('safe.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'safe.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      await waitFor(() => {
        expect(result.current.showPrivacyDialog).toBe(true);
      });

      act(() => {
        result.current.confirmPrivacy();
      });

      expect(result.current.showPrivacyDialog).toBe(false);
    });
  });

  describe('cancelPrivacy 方法', () => {
    it('應該正確處理用戶取消上傳', async () => {
      const mockFile = createMockFile('data.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['email', 'phone'],
        suggestions: ['建議移除電子郵件欄位', '建議移除電話號碼欄位'],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      // 建立模擬的 file input element
      const mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      mockFileInput.id = 'file-upload';
      // 不要設定 value，瀏覽器不允許
      document.body.appendChild(mockFileInput);

      const { result } = renderHook(() => usePrivacyDetection());

      // 先檢測檔案
      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      expect(result.current.showPrivacyDialog).toBe(true);
      expect(result.current.sensitiveColumns).toEqual(['email', 'phone']);

      // 取消上傳
      act(() => {
        result.current.cancelPrivacy();
      });

      expect(result.current.showPrivacyDialog).toBe(false);
      expect(result.current.sensitiveColumns).toEqual([]);
      expect(result.current.privacySuggestions).toEqual([]);
      expect(result.current.fileBasicInfo).toBeNull();
      expect(result.current.pendingFile).toBeNull();
      // file input 的 value 應該被清空
      expect(mockFileInput.value).toBe('');

      // 清理
      document.body.removeChild(mockFileInput);
    });

    it('應該在沒有 file input 元素時正常處理', () => {
      const { result } = renderHook(() => usePrivacyDetection());

      // 確保沒有 file-upload 元素
      const existingInput = document.getElementById('file-upload');
      if (existingInput) {
        existingInput.remove();
      }

      // 不應該拋出錯誤
      expect(() => {
        act(() => {
          result.current.cancelPrivacy();
        });
      }).not.toThrow();

      expect(result.current.showPrivacyDialog).toBe(false);
    });
  });

  describe('resetPrivacyState 方法', () => {
    it('應該重置所有狀態除了 showPrivacyDialog', async () => {
      const mockFile = createMockFile('data.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['email'],
        suggestions: ['建議移除電子郵件欄位'],
        warnings: [],
      };

      vi.mocked(FileAnalysisService.processFileComplete).mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 先設置一些狀態
      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      expect(result.current.sensitiveColumns).toEqual(['email']);
      expect(result.current.fileBasicInfo).not.toBeNull();

      // 重置狀態
      act(() => {
        result.current.resetPrivacyState();
      });

      expect(result.current.pendingFile).toBeNull();
      expect(result.current.sensitiveColumns).toEqual([]);
      expect(result.current.privacySuggestions).toEqual([]);
      expect(result.current.fileBasicInfo).toBeNull();
      // showPrivacyDialog 不會被重置
      expect(result.current.showPrivacyDialog).toBe(true);
    });
  });

  describe('載入狀態管理', () => {
    it('應該正確管理載入狀態', async () => {
      const mockFile = createMockFile('data.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'data.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: [],
      };

      // 設置延遲以測試載入狀態
      let resolvePromise: (value: FileAnalysisResult) => void;
      const delayedPromise = new Promise<FileAnalysisResult>((resolve) => {
        resolvePromise = resolve;
      });
      
      vi.mocked(FileAnalysisService.processFileComplete).mockReturnValue(delayedPromise);

      const { result } = renderHook(() => usePrivacyDetection());

      expect(result.current.sensitiveDetectionLoading).toBe(false);

      // 開始檢測但不等待
      let detectPromise: Promise<any>;
      act(() => {
        detectPromise = result.current.detectSensitiveData(mockFile);
      });

      // 立即檢查載入狀態（應該是 true）
      expect(result.current.sensitiveDetectionLoading).toBe(true);

      // 解析 Promise
      act(() => {
        resolvePromise!(mockResult);
      });

      // 等待檢測完成
      await act(async () => {
        await detectPromise!;
      });

      // 檢查載入狀態結束
      expect(result.current.sensitiveDetectionLoading).toBe(false);
    });

    it('應該在錯誤發生時也正確重置載入狀態', async () => {
      const mockFile = createMockFile('error.csv', 1024);
      const errorInstance = new Error('處理失敗');
      
      vi.mocked(FileAnalysisService.processFileComplete).mockRejectedValue(errorInstance);

      const { result, rerender } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已經正確初始化
      expect(result.current).toBeDefined();
      expect(result.current.sensitiveDetectionLoading).toBe(false);

      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      expect(result.current.sensitiveDetectionLoading).toBe(false);
    });
  });

  describe('並發處理', () => {
    it('應該正確處理多次連續呼叫', async () => {
      const mockFile1 = createMockFile('file1.csv', 1024);
      const mockFile2 = createMockFile('file2.csv', 2048);
      
      const mockResult1: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'file1.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['email'],
        suggestions: ['建議移除電子郵件欄位'],
        warnings: [],
      };

      const mockResult2: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'file2.csv',
          size: 2048,
          rows: 5,
          columns: 6,
          hasMultipleSheets: false,
        },
        sensitiveColumns: ['phone', 'ssn'],
        suggestions: ['建議移除電話號碼欄位', '建議移除身分證字號欄位'],
        warnings: [],
      };

      // 重新設置 mock 並定義返回值
      vi.mocked(FileAnalysisService.processFileComplete)
        .mockReset()
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(mockResult2);

      const { result } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已初始化
      expect(result.current).toBeDefined();

      // 第一次檢測
      await act(async () => {
        await result.current.detectSensitiveData(mockFile1);
      });

      expect(result.current.fileBasicInfo?.name).toBe('file1.csv');
      expect(result.current.sensitiveColumns).toEqual(['email']);

      // 第二次檢測（應該覆蓋第一次的結果）
      await act(async () => {
        await result.current.detectSensitiveData(mockFile2);
      });

      expect(result.current.fileBasicInfo?.name).toBe('file2.csv');
      expect(result.current.sensitiveColumns).toEqual(['phone', 'ssn']);
      expect(result.current.pendingFile).toBe(mockFile2);
    });
  });

  describe('用戶類型處理', () => {
    it('應該根據不同用戶類型調用正確的處理', async () => {
      const { useUserLimits } = await import('@/features/auth/hooks/useUserLimits');
      
      // 模擬專業版用戶
      vi.mocked(useUserLimits).mockReturnValue({
        userType: 'PROFESSIONAL',
        plan: 'professional',
        limits: {
          maxSizeBytes: 50 * 1024 * 1024, // 50MB
          maxRows: 100000,
          maxColumns: 500,
          allowedExtensions: ['.csv', '.xls', '.xlsx'],
        },
        formattedLimits: {
          maxSize: '50 MB',
          maxRows: '100,000',
          maxColumns: '500',
          userTypeName: '專業版',
          planName: '專業版',
        },
        isLoading: false,
        canUpgradeFile: false,
        upgradeMessage: undefined,
      });

      const mockFile = createMockFile('pro.csv', 30 * 1024 * 1024); // 30MB
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'pro.csv',
          size: 30 * 1024 * 1024,
          rows: 50000,
          columns: 200,
          hasMultipleSheets: false,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: [],
      };

      // 重新設置 mock
      vi.mocked(FileAnalysisService.processFileComplete)
        .mockReset()
        .mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已初始化
      expect(result.current).toBeDefined();

      await act(async () => {
        await result.current.detectSensitiveData(mockFile);
      });

      // 驗證使用正確的用戶類型
      expect(FileAnalysisService.processFileComplete).toHaveBeenCalledWith(
        mockFile,
        'PROFESSIONAL'
      );
    });
  });

  describe('邊界情況', () => {
    it('應該處理 undefined 或 null 的回應欄位', async () => {
      const mockFile = createMockFile('edge.csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: 'edge.csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: undefined as any,
        suggestions: undefined as any,
        warnings: undefined,
      };

      // 重新設置 mock
      vi.mocked(FileAnalysisService.processFileComplete)
        .mockReset()
        .mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已初始化
      expect(result.current).toBeDefined();

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(mockFile);
      });

      expect(detectResult.sensitiveColumns).toEqual([]);
      expect(detectResult.suggestions).toEqual([]);
      expect(result.current.sensitiveColumns).toEqual([]);
      expect(result.current.privacySuggestions).toEqual([]);
    });

    it('應該處理極大檔案的情況', async () => {
      const largeFile = createMockFile('huge.csv', Number.MAX_SAFE_INTEGER);
      const mockError = CommonErrors.fileSizeExceeded(Number.MAX_SAFE_INTEGER, 10 * 1024 * 1024);
      const mockResult: FileAnalysisResult = {
        success: false,
        error: mockError,
      };

      // 重新設置 mock
      vi.mocked(FileAnalysisService.processFileComplete)
        .mockReset()
        .mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已初始化
      expect(result.current).toBeDefined();

      let detectResult: any;
      await act(async () => {
        detectResult = await result.current.detectSensitiveData(largeFile);
      });

      expect(detectResult.success).toBe(false);
      expect(detectResult.error?.code).toBe(ErrorCode.FILE_SIZE_EXCEEDED);
    });

    it('應該處理特殊字元的檔案名稱', async () => {
      const specialFile = createMockFile('測試檔案 #1 (複製).csv', 1024);
      const mockResult: FileAnalysisResult = {
        success: true,
        data: mockDataRows,
        fileInfo: {
          name: '測試檔案 #1 (複製).csv',
          size: 1024,
          rows: 3,
          columns: 4,
          hasMultipleSheets: false,
        },
        sensitiveColumns: [],
        suggestions: [],
        warnings: [],
      };

      // 重新設置 mock
      vi.mocked(FileAnalysisService.processFileComplete)
        .mockReset()
        .mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePrivacyDetection());

      // 確保 hook 已初始化
      expect(result.current).toBeDefined();

      await act(async () => {
        await result.current.detectSensitiveData(specialFile);
      });

      expect(result.current.fileBasicInfo?.name).toBe('測試檔案 #1 (複製).csv');
    });
  });
});