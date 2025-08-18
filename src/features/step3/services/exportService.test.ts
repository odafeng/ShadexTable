// src/features/step3/services/exportService.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToExcel, exportToWord } from '@/features/step3/services/exportService';
import type { ExportData, TableRow } from '@/features/step3/types';
import { ErrorCode, ErrorContext } from '@/utils/error';
import { isAppError } from '@/utils/error';

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}));

// Mock xlsx
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn()
  },
  write: vi.fn(() => new ArrayBuffer(8))
}));

// Import mocked modules
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// Type the mocked functions using vi.mocked
const mockSaveAs = vi.mocked(saveAs);
const mockJsonToSheet = vi.mocked(XLSX.utils.json_to_sheet);
const mockBookNew = vi.mocked(XLSX.utils.book_new);
const mockBookAppendSheet = vi.mocked(XLSX.utils.book_append_sheet);
const mockWrite = vi.mocked(XLSX.write);

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('exportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 設定預設的 mock 返回值
    mockJsonToSheet.mockReturnValue({});
    mockBookNew.mockReturnValue({ Sheets: {}, SheetNames: [] });
    mockWrite.mockReturnValue(new ArrayBuffer(8));
    
    // Reset URL mocks
    vi.mocked(global.URL.createObjectURL).mockReturnValue('blob:mock-url');
    vi.mocked(global.URL.revokeObjectURL).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToExcel', () => {
    // 測試資料準備
    const createTestData = (): TableRow[] => [
      {
        Variable: 'Age',
        Group1: 45.2,
        Group2: 48.3,
        P: 0.045
      },
      {
        Variable: 'Gender',
        Group1: 'Male (60%)',
        Group2: 'Male (55%)',
        P: 0.123
      },
      {
        Variable: 'BMI',
        Group1: 24.5,
        Group2: 25.1,
        P: 0.089
      }
    ];

    const createComplexTestData = (): TableRow[] => [
      {
        Variable: 'Demographics',
        Group1: null,
        Group2: undefined,
        P: null
      },
      {
        Variable: '  Age (years)',
        Group1: 45.2,
        Group2: 48.3,
        P: 0.045
      },
      {
        Variable: '  Gender',
        Group1: true,
        Group2: false,
        P: 0.123
      },
      {
        Variable: 'Clinical',
        Group1: '',
        Group2: '',
        P: undefined
      },
      {
        Variable: '  Diabetes',
        Group1: 'Yes (30%)',
        Group2: 'Yes (35%)',
        P: 0.456
      }
    ];

    const createEmptyData = (): TableRow[] => [];

    const createLargeDataset = (): TableRow[] => {
      const data: TableRow[] = [];
      for (let i = 0; i < 1000; i++) {
        data.push({
          Variable: `Variable_${i}`,
          Group1: Math.random() * 100,
          Group2: Math.random() * 100,
          Group3: Math.random() * 100,
          P: Math.random()
        });
      }
      return data;
    };

    it('應該成功匯出基本的 Excel 檔案', async () => {
      // Arrange
      const testData = createTestData();

      // Act
      await exportToExcel(testData);

      // Assert
      expect(mockJsonToSheet).toHaveBeenCalledWith(testData);
      expect(mockBookNew).toHaveBeenCalled();
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.objectContaining({ Sheets: {}, SheetNames: [] }),
        expect.any(Object),
        'Summary'
      );
      expect(mockWrite).toHaveBeenCalledWith(
        expect.objectContaining({ Sheets: {}, SheetNames: [] }),
        { bookType: 'xlsx', type: 'array' }
      );
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'ai-analysis-summary.xlsx'
      );
    });

    it('應該使用自訂檔名匯出 Excel', async () => {
      // Arrange
      const testData = createTestData();
      const customFilename = 'custom-report.xlsx';

      // Act
      await exportToExcel(testData, customFilename);

      // Assert
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        customFilename
      );
    });

    it('應該處理包含各種資料型別的複雜資料', async () => {
      // Arrange
      const complexData = createComplexTestData();

      // Act
      await exportToExcel(complexData);

      // Assert
      expect(mockJsonToSheet).toHaveBeenCalledWith(complexData);
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('應該處理空資料陣列', async () => {
      // Arrange
      const emptyData = createEmptyData();

      // Act
      await exportToExcel(emptyData);

      // Assert
      expect(mockJsonToSheet).toHaveBeenCalledWith(emptyData);
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('應該處理大量資料', async () => {
      // Arrange
      const largeData = createLargeDataset();

      // Act
      await exportToExcel(largeData);

      // Assert
      expect(mockJsonToSheet).toHaveBeenCalledWith(largeData);
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('應該處理 Record<string, unknown>[] 型別的資料', async () => {
      // Arrange
      const recordData: Record<string, unknown>[] = [
        { key1: 'value1', key2: 123, key3: true },
        { key1: 'value2', key2: 456, key3: false },
        { key1: 'value3', key2: 789, key3: null }
      ];

      // Act
      await exportToExcel(recordData);

      // Assert
      expect(mockJsonToSheet).toHaveBeenCalledWith(recordData);
      expect(mockSaveAs).toHaveBeenCalled();
    });

    it('當 XLSX.utils.json_to_sheet 失敗時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestData();
      const mockError = new Error('json_to_sheet failed');
      mockJsonToSheet.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(exportToExcel(testData)).rejects.toThrow();
      
      try {
        await exportToExcel(testData);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.userMessage).toContain('Excel 匯出失敗');
          expect(error.cause).toBe(mockError);
        }
      }
    });

    it('當 XLSX.write 失敗時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestData();
      const mockError = new Error('XLSX write failed');
      
      mockWrite.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(exportToExcel(testData)).rejects.toThrow();
      
      try {
        await exportToExcel(testData);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.cause).toBe(mockError);
        }
      }
    });

    it('當 saveAs 失敗時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestData();
      const mockError = new Error('saveAs failed');
      
      mockSaveAs.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(exportToExcel(testData)).rejects.toThrow();
      
      try {
        await exportToExcel(testData);
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.cause).toBe(mockError);
        }
      }
    });

    it('應該正確創建 Blob 物件', async () => {
      // Arrange
      const testData = createTestData();

      // Act
      await exportToExcel(testData);

      // Assert
      const blobCall = mockSaveAs.mock.calls[0][0];
      expect(blobCall).toBeInstanceOf(Blob);
      if (blobCall instanceof Blob) {
        expect(blobCall.type).toBe('application/octet-stream');
      }
    });
  });

  describe('exportToWord', () => {
    // 測試資料準備
    const createTestExportData = (): ExportData => ({
      resultTable: [
        {
          Variable: 'Age',
          Group1: 45.2,
          Group2: 48.3,
          P: 0.045,
          _originalVariable: '**Age',
          _isSubItem: false
        },
        {
          Variable: '  Mean ± SD',
          Group1: '45.2 ± 12.3',
          Group2: '48.3 ± 11.5',
          P: 0.045,
          _originalVariable: 'Mean ± SD',
          _isSubItem: true
        }
      ],
      groupVar: 'Treatment',
      groupCounts: {
        Group1: 100,
        Group2: 95
      },
      groupLabels: {
        Group1: 'Control',
        Group2: 'Treatment'
      }
    });

    const createMinimalExportData = (): ExportData => ({
      resultTable: [
        {
          Variable: 'Age',
          Value: 45.2
        }
      ],
      groupCounts: {}
    });

    const createLargeExportData = (): ExportData => {
      const resultTable = [];
      for (let i = 0; i < 100; i++) {
        resultTable.push({
          Variable: `Variable_${i}`,
          Group1: Math.random() * 100,
          Group2: Math.random() * 100,
          P: Math.random()
        });
      }
      return {
        resultTable,
        groupVar: 'Treatment',
        groupCounts: {
          Group1: 500,
          Group2: 500
        }
      };
    };

    it('應該成功匯出 Word 檔案', async () => {
      // Arrange
      const testData = createTestExportData();
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const createElementSpy = vi.spyOn(document, 'createElement');
      const mockAnchor = document.createElement('a');
      const clickSpy = vi.spyOn(mockAnchor, 'click');
      createElementSpy.mockReturnValueOnce(mockAnchor);

      const createObjectURLMock = vi.mocked(global.URL.createObjectURL);
      const revokeObjectURLMock = vi.mocked(global.URL.revokeObjectURL);
      createObjectURLMock.mockReturnValue('blob:mock-url');

      // Act
      await exportToWord(testData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      // 檢查 createObjectURL 是否被呼叫，並驗證參數
      expect(createObjectURLMock).toHaveBeenCalledOnce();
      // 驗證傳入的參數具有 Blob 的特性
      const blobArg = createObjectURLMock.mock.calls[0][0];
      expect(blobArg).toBeDefined();
      expect(blobArg).toHaveProperty('size');
      expect(blobArg).toHaveProperty('type');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('ai-analysis-summary.docx');
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });

    it('應該使用自訂檔名匯出 Word', async () => {
      // Arrange
      const testData = createTestExportData();
      const customFilename = 'custom-report.docx';
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(testData, customFilename);

      // Assert
      expect(mockAnchor.download).toBe(customFilename);
    });

    it('應該處理最小資料集', async () => {
      // Arrange
      const minimalData = createMinimalExportData();
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(minimalData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minimalData)
      });
    });

    it('應該處理大量資料', async () => {
      // Arrange
      const largeData = createLargeExportData();
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(largeData);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(largeData)
      });
    });

    it('當 API 回傳 400 錯誤時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestExportData();
      
      mockFetch.mockResolvedValueOnce(new Response(null, {
        status: 400,
        statusText: 'Bad Request'
      }));

      // Act & Assert
      // 注意：exportService 中當 !response.ok 時會拋出 SERVER_ERROR
      try {
        await exportToWord(testData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.SERVER_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.userMessage).toContain('Word 匯出失敗: Bad Request');
          expect(error.details?.status).toBe(400);
        }
      }
    });

    it('當 API 回傳 500 錯誤時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestExportData();
      
      mockFetch.mockResolvedValueOnce(new Response(null, {
        status: 500,
        statusText: 'Internal Server Error'
      }));

      // Act & Assert
      try {
        await exportToWord(testData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.SERVER_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.userMessage).toContain('Word 匯出失敗: Internal Server Error');
          expect(error.details?.status).toBe(500);
        }
      }
    });

    it('當 fetch 拋出網路錯誤時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestExportData();
      const networkError = new Error('Network error');
      
      mockFetch.mockRejectedValueOnce(networkError);

      // Act & Assert
      try {
        await exportToWord(testData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.userMessage).toBe('Word 匯出失敗');
          expect(error.cause).toBe(networkError);
        }
      }
    });

    it('當 blob() 方法失敗時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestExportData();
      const blobError = new Error('Failed to get blob');
      
      const mockResponse = new Response(null, {
        status: 200,
        statusText: 'OK'
      });
      
      // Override blob method to throw error
      Object.defineProperty(mockResponse, 'blob', {
        value: async () => {
          throw blobError;
        }
      });
      
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Act & Assert
      try {
        await exportToWord(testData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.cause).toBe(blobError);
        }
      }
    });

    it('當 createObjectURL 失敗時應該拋出錯誤', async () => {
      // Arrange
      const testData = createTestExportData();
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const urlError = new Error('Failed to create object URL');
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      vi.mocked(global.URL.createObjectURL).mockImplementation(() => {
        throw urlError;
      });

      // Act & Assert
      try {
        await exportToWord(testData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(isAppError(error)).toBe(true);
        if (isAppError(error)) {
          expect(error.code).toBe(ErrorCode.FILE_ERROR);
          expect(error.context).toBe(ErrorContext.FILE_PROCESSING);
          expect(error.cause).toBe(urlError);
        }
      }
    });

    it('應該處理沒有 groupVar 的資料', async () => {
      // Arrange
      const dataWithoutGroupVar: ExportData = {
        resultTable: [
          { Variable: 'Age', Value: 45.2 },
          { Variable: 'Gender', Value: 'Male' }
        ],
        groupCounts: {}
      };
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(dataWithoutGroupVar);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithoutGroupVar)
      });
    });

    it('應該處理沒有 groupLabels 的資料', async () => {
      // Arrange
      const dataWithoutLabels: ExportData = {
        resultTable: [
          { Variable: 'Age', Group1: 45.2, Group2: 48.3 }
        ],
        groupVar: 'Treatment',
        groupCounts: { Group1: 100, Group2: 95 }
      };
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(dataWithoutLabels);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('/api/export-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataWithoutLabels)
      });
    });

    it('應該正確清理 URL 物件', async () => {
      // Arrange
      const testData = createTestExportData();
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      const mockUrl = 'blob:mock-url-12345';
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');
      
      const createObjectURLMock = vi.mocked(global.URL.createObjectURL);
      const revokeObjectURLMock = vi.mocked(global.URL.revokeObjectURL);
      createObjectURLMock.mockReturnValue(mockUrl);

      // Act
      await exportToWord(testData);

      // Assert
      expect(createObjectURLMock).toHaveBeenCalledOnce();
      expect(revokeObjectURLMock).toHaveBeenCalledOnce();
      expect(revokeObjectURLMock).toHaveBeenCalledWith(mockUrl);
    });

    it('應該處理特殊字元的檔名', async () => {
      // Arrange
      const testData = createTestExportData();
      const specialFilename = 'report-2024/01/15 #special.docx';
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });
      
      mockFetch.mockResolvedValueOnce(new Response(mockBlob, {
        status: 200,
        statusText: 'OK'
      }));

      const mockAnchor = document.createElement('a');
      vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor);
      vi.spyOn(mockAnchor, 'click');

      // Act
      await exportToWord(testData, specialFilename);

      // Assert
      expect(mockAnchor.download).toBe(specialFilename);
    });
  });
});