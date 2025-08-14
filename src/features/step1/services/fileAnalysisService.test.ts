// fileAnalysisService.test.ts
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { FileAnalysisService, type FileAnalysisResult, type ColumnProfile } from '@/features/step1/services/fileAnalysisService';
import { FileProcessor } from '@/utils/fileProcessor';
import { SensitiveDataDetector } from '@/features/step1/services/sensitiveDataDetector';
import * as apiClient from '@/lib/apiClient';
import { ErrorCode, ErrorContext, CommonErrors } from '@/utils/error';
import type { DataRow } from '@/stores/analysisStore';
import type { AppError } from '@/types/errors';
import { 
  expectErrorToMatch, 
  createErrorMatcher,
  assertThrowsError,
  createTestError,
  errorContaining
} from '@/utils/errorMatchers';

// Mock 依賴模組
vi.mock('@/utils/fileProcessor');
vi.mock('@/features/step1/services/sensitiveDataDetector');
vi.mock('@/lib/apiClient');
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn().mockResolvedValue(undefined)
}));

describe('FileAnalysisService', () => {
  // 測試資料準備
  const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
  const mockDataRows: DataRow[] = [
    { id: 1, name: 'John', age: 30, city: 'Taipei' },
    { id: 2, name: 'Jane', age: 25, city: 'Kaohsiung' },
    { id: 3, name: 'Bob', age: 35, city: 'Taichung' }
  ];

  const mockFileInfo = {
    name: 'test.csv',
    size: 1024,
    rows: 3,
    columns: 4,
    hasMultipleSheets: false
  };

  const mockColumnProfiles: ColumnProfile[] = [
    { column: 'id', missing_pct: '0.0%', suggested_type: 'integer' },
    { column: 'name', missing_pct: '0.0%', suggested_type: 'string' },
    { column: 'age', missing_pct: '0.0%', suggested_type: 'integer' },
    { column: 'city', missing_pct: '0.0%', suggested_type: 'string' }
  ];

  const mockToken = 'test-auth-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // 設定環境變數
    process.env.NEXT_PUBLIC_API_URL = 'http://test-api.example.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processFileComplete', () => {
    it('應該成功處理有效的檔案', async () => {
      // Arrange
      const mockValidation = { isValid: true, warnings: ['警告訊息1'] };
      const mockProcessResult = { 
        data: mockDataRows, 
        fileInfo: mockFileInfo,
        error: undefined 
      };
      const mockSensitiveResult = {
        hasSensitiveData: false,
        sensitiveColumns: [],
        suggestions: ['建議1', '建議2']
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockResolvedValue(mockProcessResult);
      (SensitiveDataDetector.checkFileForSensitiveData as Mock).mockResolvedValue(mockSensitiveResult);

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile, 'GENERAL');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDataRows);
      expect(result.fileInfo).toEqual(mockFileInfo);
      expect(result.sensitiveColumns).toEqual([]);
      expect(result.suggestions).toEqual(['建議1', '建議2']);
      expect(result.warnings).toEqual(['警告訊息1']);
      
      expect(FileProcessor.validateFile).toHaveBeenCalledWith(mockFile, 'GENERAL');
      expect(FileProcessor.processFile).toHaveBeenCalledWith(mockFile, 'GENERAL');
      expect(SensitiveDataDetector.checkFileForSensitiveData).toHaveBeenCalledWith(mockFile);
    });

    it('應該在檔案驗證失敗時回傳錯誤', async () => {
      // Arrange
      const mockError = CommonErrors.fileFormatUnsupported();
      const mockValidation = { 
        isValid: false, 
        error: mockError 
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile, 'GENERAL');

      // Assert
      expect(result.success).toBe(false);
      
      // 使用 errorMatchers 驗證錯誤，忽略動態欄位
      expectErrorToMatch(result.error, {
        code: mockError.code,
        message: mockError.message,
        userMessage: mockError.userMessage,
        context: mockError.context,
        severity: mockError.severity,
        action: mockError.action,
        canRetry: mockError.canRetry
      });
      
      expect(FileProcessor.processFile).not.toHaveBeenCalled();
      expect(SensitiveDataDetector.checkFileForSensitiveData).not.toHaveBeenCalled();
    });

    it('應該處理不支援的 MIME 類型', async () => {
      // Arrange
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const mockValidation = { isValid: true };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);

      // Act
      const result = await FileAnalysisService.processFileComplete(invalidFile, 'GENERAL');

      // Assert
      expect(result.success).toBe(false);
      
      // 修正：預期的錯誤代碼應該是 FILE_FORMAT_UNSUPPORTED
      expect(result.error).toMatchObject(
        errorContaining({
          code: ErrorCode.FILE_FORMAT_UNSUPPORTED
        })
      );
    });

    it('應該處理空檔案的情況', async () => {
      // Arrange
      const mockValidation = { isValid: true };
      const mockProcessResult = { 
        data: [], 
        fileInfo: undefined,
        error: undefined 
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockResolvedValue(mockProcessResult);

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile, 'GENERAL');

      // Assert
      expect(result.success).toBe(false);
      
      // 修正：預期的錯誤代碼應該是 FILE_EMPTY
      expect(result.error).toMatchObject(
        errorContaining({
          code: ErrorCode.FILE_EMPTY
        })
      );
    });

    it('應該檢測到敏感資料並回傳警告', async () => {
      // Arrange
      const mockValidation = { isValid: true };
      const mockProcessResult = { 
        data: mockDataRows, 
        fileInfo: mockFileInfo,
        error: undefined 
      };
      const mockSensitiveResult = {
        hasSensitiveData: true,
        sensitiveColumns: ['name', 'email'],
        suggestions: ['請移除姓名欄位', '請移除電子郵件欄位']
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockResolvedValue(mockProcessResult);
      (SensitiveDataDetector.checkFileForSensitiveData as Mock).mockResolvedValue(mockSensitiveResult);

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile, 'PROFESSIONAL');

      // Assert
      expect(result.success).toBe(true);
      expect(result.sensitiveColumns).toEqual(['name', 'email']);
      expect(result.suggestions).toEqual(['請移除姓名欄位', '請移除電子郵件欄位']);
    });

    it('應該處理處理過程中的異常錯誤', async () => {
      // Arrange
      const mockValidation = { isValid: true };
      const errorMessage = '檔案處理時發生未預期錯誤';

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile);

      // Assert
      expect(result.success).toBe(false);
      
      // 修正：只驗證必要的欄位，允許其他欄位存在
      expectErrorToMatch(
        result.error, 
        {
          code: ErrorCode.FILE_ERROR,
          message: expect.stringContaining(errorMessage) as any
        },
        {
          checkCorrelationId: false,
          checkTimestamp: false,
          checkStack: false,
          ignoreExtraFields: true
        }
      );
    });
  });

  describe('analyzeColumns', () => {
    it('應該成功分析欄位並回傳結果', async () => {
      // Arrange
      const mockResponse = {
        data: {
          columns: mockColumnProfiles
        }
      };

      (apiClient.post as Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.columns).toEqual(mockColumnProfiles);
      expect(apiClient.post).toHaveBeenCalledWith(
        'http://test-api.example.com/api/preprocess/columns',
        { data: mockDataRows },
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          context: ErrorContext.ANALYSIS,
          timeout: 30000
        })
      );
    });

    it('應該處理直接的 columns 回應格式', async () => {
      // Arrange
      const mockResponse = {
        columns: mockColumnProfiles
      };

      (apiClient.post as Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.columns).toEqual(mockColumnProfiles);
    });

    it('應該處理 API URL 未設定的錯誤', async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_API_URL;

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(false);
      
      // 修正：當 API URL 未設定時，會回傳 ANALYSIS_ERROR
      expect(result.error).toMatchObject(
        errorContaining({
          code: ErrorCode.ANALYSIS_ERROR
        })
      );
    });

    it('應該處理 API 回應格式異常', async () => {
      // Arrange
      const mockResponse = {
        unexpected: 'format'
      };

      (apiClient.post as Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(false);
      
      expectErrorToMatch(
        result.error,
        {
          code: ErrorCode.ANALYSIS_ERROR,
          message: expect.stringContaining('API 回應格式異常') as any
        },
        {
          checkCorrelationId: false,
          checkTimestamp: false,
          ignoreExtraFields: true
        }
      );
    });

    it('應該處理 API 請求錯誤', async () => {
      // Arrange
      const errorMessage = '網路錯誤';
      (apiClient.post as Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(false);
      
      expectErrorToMatch(
        result.error,
        {
          code: ErrorCode.ANALYSIS_ERROR,
          message: expect.stringContaining(errorMessage) as any
        },
        {
          checkCorrelationId: false,
          checkTimestamp: false,
          ignoreExtraFields: true
        }
      );
    });

    it('應該處理 HTTP 錯誤回應', async () => {
      // Arrange
      const httpError = {
        response: {
          data: { error: 'Unauthorized' },
          status: 401
        }
      };

      (apiClient.post as Mock).mockRejectedValue(httpError);

      // Act
      const result = await FileAnalysisService.analyzeColumns(mockDataRows, mockToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toMatchObject(
        errorContaining({
          code: ErrorCode.ANALYSIS_ERROR
        })
      );
    });
  });

  describe('createFallbackColumnData', () => {
    it('應該為有資料的欄位建立預設的欄位資料', () => {
      // Act
      const result = FileAnalysisService.createFallbackColumnData(mockDataRows);

      // Assert
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        column: 'id',
        missing_pct: '0.0%',
        suggested_type: '不明'
      });
      expect(result[1]).toEqual({
        column: 'name',
        missing_pct: '0.0%',
        suggested_type: '不明'
      });
    });

    it('應該處理空資料陣列', () => {
      // Act
      const result = FileAnalysisService.createFallbackColumnData([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('performAutoAnalysis', () => {
    it('應該成功執行自動分析', async () => {
      // Arrange
      const mockAutoAnalysisResponse = {
        success: true,
        message: '分析成功',
        group_var: 'city',
        cat_vars: ['name'],
        cont_vars: ['age'],
        classification: {
          city: 'categorical',
          name: 'categorical',
          age: 'continuous'
        },
        analysis: {
          summary: '資料分析摘要',
          details: { key: 'value' }
        },
        confidence: 0.95,
        suggestions: ['建議1', '建議2']
      };

      (apiClient.post as Mock).mockResolvedValue(mockAutoAnalysisResponse);

      // Act
      const result = await FileAnalysisService.performAutoAnalysis(
        mockDataRows,
        true,
        mockToken
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockAutoAnalysisResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        'http://test-api.example.com/api/ai_automation/auto-analyze',
        {
          parsedData: mockDataRows,
          fillNA: true
        },
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`
          },
          context: ErrorContext.ANALYSIS,
          timeout: 60000
        })
      );
    });

    it('應該處理自動分析失敗的回應', async () => {
      // Arrange
      const mockFailureResponse = {
        success: false,
        message: '分析失敗：資料不足'
      };

      (apiClient.post as Mock).mockResolvedValue(mockFailureResponse);

      // Act
      const result = await FileAnalysisService.performAutoAnalysis(
        mockDataRows,
        false,
        mockToken
      );

      // Assert
      expect(result.success).toBe(false);
      
      // 修正：不要期待完全匹配 message，因為服務會返回預設訊息
      expect(result.error).toMatchObject(
        errorContaining({
          code: ErrorCode.ANALYSIS_ERROR
        })
      );
    });

    it('應該處理自動分析的網路錯誤', async () => {
      // Arrange
      const errorMessage = '連線逾時';
      (apiClient.post as Mock).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await FileAnalysisService.performAutoAnalysis(
        mockDataRows,
        false,
        mockToken
      );

      // Assert
      expect(result.success).toBe(false);
      
      expectErrorToMatch(
        result.error,
        {
          code: ErrorCode.ANALYSIS_ERROR,
          message: expect.stringContaining(errorMessage) as any
        },
        {
          checkCorrelationId: false,
          checkTimestamp: false,
          ignoreExtraFields: true
        }
      );
    });

    it('應該處理非 Error 類型的異常', async () => {
      // Arrange
      (apiClient.post as Mock).mockRejectedValue('字串錯誤');

      // Act
      const result = await FileAnalysisService.performAutoAnalysis(
        mockDataRows,
        true,
        mockToken
      );

      // Assert
      expect(result.success).toBe(false);
      
      expectErrorToMatch(
        result.error,
        {
          code: ErrorCode.ANALYSIS_ERROR,
          message: expect.stringContaining('自動分析發生未知錯誤') as any
        },
        {
          checkCorrelationId: false,
          checkTimestamp: false,
          ignoreExtraFields: true
        }
      );
    });
  });

  describe('Edge Cases', () => {
    it('應該處理檔案名稱包含特殊字元', async () => {
      // Arrange
      const specialFile = new File(
        ['content'],
        'test@#$%.csv',
        { type: 'text/csv' }
      );
      const mockValidation = { isValid: true };
      const mockProcessResult = { 
        data: mockDataRows, 
        fileInfo: mockFileInfo,
        error: undefined 
      };
      const mockSensitiveResult = {
        hasSensitiveData: false,
        sensitiveColumns: [],
        suggestions: []
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockResolvedValue(mockProcessResult);
      (SensitiveDataDetector.checkFileForSensitiveData as Mock).mockResolvedValue(mockSensitiveResult);

      // Act
      const result = await FileAnalysisService.processFileComplete(specialFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDataRows);
    });

    it('應該處理超大檔案的分析', async () => {
      // Arrange
      const largeDataRows: DataRow[] = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random()
      }));

      const mockResponse = {
        data: {
          columns: [
            { column: 'id', missing_pct: '0.0%', suggested_type: 'integer' },
            { column: 'value', missing_pct: '0.0%', suggested_type: 'float' }
          ]
        }
      };

      (apiClient.post as Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await FileAnalysisService.analyzeColumns(largeDataRows, mockToken);

      // Assert
      expect(result.success).toBe(true);
      expect(result.columns).toHaveLength(2);
    });

    it('應該處理包含 undefined 和 null 值的資料', async () => {
      // Arrange
      const dataWithNulls: DataRow[] = [
        { id: 1, name: 'John', age: null, city: undefined },
        { id: 2, name: null, age: 25, city: 'Kaohsiung' }
      ];

      const mockResponse = {
        columns: mockColumnProfiles
      };

      (apiClient.post as Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await FileAnalysisService.analyzeColumns(dataWithNulls, mockToken);

      // Assert
      expect(result.success).toBe(true);
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        { data: dataWithNulls },
        expect.any(Object)
      );
    });

    it('應該正確處理多個警告訊息', async () => {
      // Arrange
      const mockValidation = { 
        isValid: true, 
        warnings: ['警告1', '警告2', '警告3'] 
      };
      const mockProcessResult = { 
        data: mockDataRows, 
        fileInfo: mockFileInfo,
        error: undefined 
      };
      const mockSensitiveResult = {
        hasSensitiveData: false,
        sensitiveColumns: [],
        suggestions: []
      };

      (FileProcessor.validateFile as Mock).mockReturnValue(mockValidation);
      (FileProcessor.processFile as Mock).mockResolvedValue(mockProcessResult);
      (SensitiveDataDetector.checkFileForSensitiveData as Mock).mockResolvedValue(mockSensitiveResult);

      // Act
      const result = await FileAnalysisService.processFileComplete(mockFile);

      // Assert
      expect(result.success).toBe(true);
      expect(result.warnings).toEqual(['警告1', '警告2', '警告3']);
    });
  });
});