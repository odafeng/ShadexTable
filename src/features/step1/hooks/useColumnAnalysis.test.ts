// src/features/step1/hooks/useColumnAnalysis.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { DataRow } from '@/stores/analysisStore';
import type { ColumnProfile } from '@/features/step1/services/fileAnalysisService';

// Mock modules
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/features/step1/services/fileAnalysisService', () => ({
  FileAnalysisService: {
    analyzeColumns: vi.fn(),
    createFallbackColumnData: vi.fn()
  }
}));

vi.mock('@/utils/error', () => ({
  CommonErrors: {
    authTokenMissing: vi.fn(() => new Error('Auth token missing'))
  }
}));

vi.mock('@/stores/analysisStore', () => ({
  useAnalysisStore: vi.fn()
}));

// Import after mocking
import { useColumnAnalysis } from './useColumnAnalysis';
import { useAuth } from '@clerk/nextjs';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { CommonErrors } from '@/utils/error';
import { useAnalysisStore } from '@/stores/analysisStore';

describe('useColumnAnalysis Hook', () => {
  // Mock store state
  const mockStoreState = {
    columnProfile: [],
    columnsPreview: [],
    showPreview: false,
    columnAnalysisLoading: false,
    setColumnProfile: vi.fn(),
    setColumnsPreview: vi.fn(),
    setShowPreview: vi.fn(),
    setColumnAnalysisLoading: vi.fn()
  };

  const mockData: DataRow[] = [
    { id: 1, name: 'John', age: 30, city: 'Taipei' },
    { id: 2, name: 'Jane', age: 25, city: 'Kaohsiung' },
    { id: 3, name: 'Bob', age: 35, city: 'Taichung' }
  ];

  // 使用正確的 ColumnProfile 格式
  const createMockColumnResponse = (includeExtras = false) => {
    const base: ColumnProfile[] = [
      {
        column: 'id',
        suggested_type: 'continuous',
        missing_pct: '0%'
      },
      {
        column: 'name',
        suggested_type: 'categorical',
        missing_pct: '0%'
      },
      {
        column: 'age',
        suggested_type: 'continuous',
        missing_pct: '0%'
      },
      {
        column: 'city',
        suggested_type: 'categorical',
        missing_pct: '0%'
      }
    ];

    if (includeExtras) {
      // 加入額外屬性用於測試轉換
      return base.map((col, idx) => ({
        ...col,
        unique_count: 3,
        missing_count: 0,
        sample_values: idx === 0 ? [1, 2, 3] : 
                       idx === 1 ? ['John', 'Jane', 'Bob'] :
                       idx === 2 ? [30, 25, 35] :
                       ['Taipei', 'Kaohsiung', 'Taichung']
      }));
    }

    return base;
  };

  // 備用欄位資料格式
  const mockFallbackColumns: ColumnProfile[] = [
    { column: 'id', suggested_type: '不明', missing_pct: '0.0%' },
    { column: 'name', suggested_type: '不明', missing_pct: '0.0%' },
    { column: 'age', suggested_type: '不明', missing_pct: '0.0%' },
    { column: 'city', suggested_type: '不明', missing_pct: '0.0%' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store state
    mockStoreState.columnProfile = [];
    mockStoreState.columnsPreview = [];
    mockStoreState.showPreview = false;
    mockStoreState.columnAnalysisLoading = false;
    
    // Setup default mock implementation
    (useAnalysisStore as any).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始狀態', () => {
    it('應該返回正確的初始狀態', () => {
      const mockGetToken = vi.fn();
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });

      const { result } = renderHook(() => useColumnAnalysis());

      expect(result.current.columnProfile).toEqual([]);
      expect(result.current.columnsPreview).toEqual([]);
      expect(result.current.showPreview).toBe(false);
      expect(result.current.columnAnalysisLoading).toBe(false);
    });

    it('應該包含所有必要的方法', () => {
      const mockGetToken = vi.fn();
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });

      const { result } = renderHook(() => useColumnAnalysis());

      expect(result.current.analyzeColumns).toBeDefined();
      expect(result.current.retryAnalysis).toBeDefined();
      expect(result.current.resetColumnAnalysis).toBeDefined();
      expect(result.current.setColumnProfile).toBeDefined();
      expect(result.current.setColumnsPreview).toBeDefined();
      expect(result.current.setShowPreview).toBeDefined();
    });
  });

  describe('analyzeColumns 方法', () => {
    it('應該成功分析欄位並更新狀態', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: createMockColumnResponse(true)
      });

      const { result } = renderHook(() => useColumnAnalysis());
      const mockSetColumnTypes = vi.fn();

      // Act
      await act(async () => {
        await result.current.analyzeColumns(mockData, undefined, mockSetColumnTypes);
      });

      // Assert
      await waitFor(() => {
        expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledWith(true);
        expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledWith(false);
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(mockData, 'test-token');
        expect(mockStoreState.setColumnProfile).toHaveBeenCalled();
        expect(mockStoreState.setShowPreview).toHaveBeenCalledWith(true);
        expect(mockSetColumnTypes).toHaveBeenCalled();
      });

      // 驗證轉換後的資料格式
      const profileCall = mockStoreState.setColumnProfile.mock.calls[0][0];
      expect(profileCall[0]).toMatchObject({
        column: 'id',
        dataType: 'continuous',
        uniqueValues: 3,
        missingValues: 0,
        missingPercentage: 0
      });

      // 驗證 setColumnTypes 被正確調用
      const columnTypesCall = mockSetColumnTypes.mock.calls[0][0];
      expect(columnTypesCall[0]).toMatchObject({
        column: 'id',
        suggested_type: 'continuous'
      });
    });

    it('應該使用傳入的 token 而非從 Clerk 取得', async () => {
      // Arrange
      const mockGetToken = vi.fn();
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      const customToken = 'custom-token';
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: createMockColumnResponse()
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      await act(async () => {
        await result.current.analyzeColumns(mockData, customToken);
      });

      // Assert
      await waitFor(() => {
        expect(mockGetToken).not.toHaveBeenCalled();
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(mockData, customToken);
      });
    });

    it('應該在沒有 token 時從 localStorage 取得', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue(null);
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      localStorage.setItem('__session', 'localStorage-token');
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: createMockColumnResponse()
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      await act(async () => {
        await result.current.analyzeColumns(mockData);
      });

      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(mockData, 'localStorage-token');
      });
    });

    it('應該在沒有任何 token 時拋出錯誤', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue(null);
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      localStorage.clear();
      
      // 設置備用方案以避免 undefined.map 錯誤
      (FileAnalysisService.createFallbackColumnData as any).mockReturnValue(mockFallbackColumns);

      const { result } = renderHook(() => useColumnAnalysis());

      // Act & Assert
      await expect(async () => {
        await act(async () => {
          await result.current.analyzeColumns(mockData);
        });
      }).rejects.toThrow('Auth token missing');

      expect(CommonErrors.authTokenMissing).toHaveBeenCalled();
      // 驗證即使有錯誤，備用方案也被調用
      expect(FileAnalysisService.createFallbackColumnData).toHaveBeenCalledWith(mockData);
    });

    it('應該處理 API 錯誤並使用備用方案', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockRejectedValue(new Error('API Error'));
      (FileAnalysisService.createFallbackColumnData as any).mockReturnValue(mockFallbackColumns);

      const { result } = renderHook(() => useColumnAnalysis());
      const mockSetColumnTypes = vi.fn();

      // Act & Assert
      await expect(async () => {
        await act(async () => {
          await result.current.analyzeColumns(mockData, undefined, mockSetColumnTypes);
        });
      }).rejects.toThrow('API Error');

      // 檢查是否使用了備用方案
      await waitFor(() => {
        expect(FileAnalysisService.createFallbackColumnData).toHaveBeenCalledWith(mockData);
        expect(mockStoreState.setColumnProfile).toHaveBeenCalled();
        expect(mockStoreState.setShowPreview).toHaveBeenCalledWith(true);
        expect(mockSetColumnTypes).toHaveBeenCalled();
        expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledWith(false);
      });

      // 驗證備用方案的資料格式
      const columnTypesCall = mockSetColumnTypes.mock.calls[0][0];
      expect(columnTypesCall[0]).toMatchObject({
        column: 'id',
        suggested_type: '不明'
      });
    });

    it('應該處理空資料陣列', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: []
      });

      const { result } = renderHook(() => useColumnAnalysis());
      const emptyData: DataRow[] = [];

      // Act
      await act(async () => {
        await result.current.analyzeColumns(emptyData);
      });

      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(emptyData, 'test-token');
        expect(mockStoreState.setColumnProfile).toHaveBeenCalledWith([]);
      });
    });

    it('應該正確轉換欄位資料格式', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      const columnWithStringPercentage = [
        {
          column: 'test',
          suggested_type: 'categorical',
          missing_pct: '15.5%',
          unique_count: 10,
          missing_count: 5,
          sample_values: ['A', 'B', 'C']
        }
      ];

      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: columnWithStringPercentage
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      await act(async () => {
        await result.current.analyzeColumns(mockData);
      });

      // Assert
      await waitFor(() => {
        const callArgs = mockStoreState.setColumnProfile.mock.calls[0][0];
        expect(callArgs[0]).toMatchObject({
          column: 'test',
          dataType: 'categorical',
          uniqueValues: 10,
          missingValues: 5,
          missingPercentage: 15.5,
          sampleValues: ['A', 'B', 'C']
        });
      });
    });

    it('應該處理 API 返回失敗狀態', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: false,
        error: 'Column analysis failed'
      });
      (FileAnalysisService.createFallbackColumnData as any).mockReturnValue([]);

      const { result } = renderHook(() => useColumnAnalysis());

      // Act & Assert
      await expect(async () => {
        await act(async () => {
          await result.current.analyzeColumns(mockData);
        });
      }).rejects.toThrow('Column analysis failed');
    });
  });

  describe('retryAnalysis 方法', () => {
    it('應該重試分析當資料存在時', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: createMockColumnResponse()
      });

      const { result } = renderHook(() => useColumnAnalysis());
      const mockSetColumnTypes = vi.fn();

      // Act
      await act(async () => {
        await result.current.retryAnalysis(mockData, mockSetColumnTypes);
      });

      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(mockData, 'test-token');
        expect(mockSetColumnTypes).toHaveBeenCalled();
      });
    });

    it('應該不執行分析當資料為空時', async () => {
      // Arrange
      const mockGetToken = vi.fn();
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      const { result } = renderHook(() => useColumnAnalysis());
      const emptyData: DataRow[] = [];

      // Act
      await act(async () => {
        await result.current.retryAnalysis(emptyData);
      });

      // Assert
      expect(FileAnalysisService.analyzeColumns).not.toHaveBeenCalled();
    });
  });

  describe('resetColumnAnalysis 方法', () => {
    it('應該重置所有欄位分析相關狀態', () => {
      const mockGetToken = vi.fn();
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });

      // Arrange
      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      act(() => {
        result.current.resetColumnAnalysis();
      });

      // Assert
      expect(mockStoreState.setColumnProfile).toHaveBeenCalledWith([]);
      expect(mockStoreState.setColumnsPreview).toHaveBeenCalledWith([]);
      expect(mockStoreState.setShowPreview).toHaveBeenCalledWith(false);
      expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理包含 null 和 undefined 值的資料', async () => {
      // Arrange
      const dataWithNulls: DataRow[] = [
        { id: 1, name: null, age: undefined, city: 'Taipei' },
        { id: 2, name: 'Jane', age: 25, city: null }
      ];

      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: [
          {
            column: 'id',
            suggested_type: 'continuous',
            missing_pct: '0%'
          },
          {
            column: 'name',
            suggested_type: 'categorical',
            missing_pct: '50%'
          }
        ]
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      await act(async () => {
        await result.current.analyzeColumns(dataWithNulls);
      });

      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(dataWithNulls, 'test-token');
        expect(mockStoreState.setColumnProfile).toHaveBeenCalled();
      });
    });

    it('應該處理欄位名稱包含特殊字符的情況', async () => {
      // Arrange
      const specialData: DataRow[] = [
        { '中文欄位': 1, 'column-with-dash': 'A', 'column_with_underscore': true },
        { '中文欄位': 2, 'column-with-dash': 'B', 'column_with_underscore': false }
      ];

      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockResolvedValue({
        success: true,
        columns: [
          {
            column: '中文欄位',
            suggested_type: 'continuous',
            missing_pct: '0%'
          },
          {
            column: 'column-with-dash',
            suggested_type: 'categorical',
            missing_pct: '0%'
          },
          {
            column: 'column_with_underscore',
            suggested_type: 'categorical',
            missing_pct: '0%'
          }
        ]
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act
      await act(async () => {
        await result.current.analyzeColumns(specialData);
      });

      // Assert
      await waitFor(() => {
        expect(FileAnalysisService.analyzeColumns).toHaveBeenCalledWith(specialData, 'test-token');
        const callArgs = mockStoreState.setColumnProfile.mock.calls[0][0];
        expect(callArgs).toHaveLength(3);
        expect(callArgs[0].column).toBe('中文欄位');
      });
    });

    it('應該在網路逾時時正確處理', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      (FileAnalysisService.analyzeColumns as any).mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        })
      );
      (FileAnalysisService.createFallbackColumnData as any).mockReturnValue([]);

      const { result } = renderHook(() => useColumnAnalysis());

      // Act & Assert
      await expect(async () => {
        await act(async () => {
          await result.current.analyzeColumns(mockData);
        });
      }).rejects.toThrow('Network timeout');

      await waitFor(() => {
        expect(FileAnalysisService.createFallbackColumnData).toHaveBeenCalled();
        expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('並發測試', () => {
    it('應該處理多次連續調用', async () => {
      // Arrange
      const mockGetToken = vi.fn().mockResolvedValue('test-token');
      (useAuth as any).mockReturnValue({ getToken: mockGetToken });
      
      let callCount = 0;
      (FileAnalysisService.analyzeColumns as any).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          success: true,
          columns: createMockColumnResponse()
        });
      });

      const { result } = renderHook(() => useColumnAnalysis());

      // Act - 連續調用三次
      await act(async () => {
        const promises = [
          result.current.analyzeColumns(mockData),
          result.current.analyzeColumns(mockData),
          result.current.analyzeColumns(mockData)
        ];
        await Promise.all(promises);
      });

      // Assert
      await waitFor(() => {
        expect(callCount).toBe(3);
        expect(mockStoreState.setColumnAnalysisLoading).toHaveBeenCalledTimes(6); // 3次 true, 3次 false
      });
    });
  });
});