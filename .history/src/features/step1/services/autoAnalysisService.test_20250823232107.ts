import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

import { AutoAnalysisService, type AutoAnalysisRequest, type AutoAnalysisResponse } from '@/features/step1/services/autoAnalysisService';
import * as apiClient from '@/lib/apiClient';
import { reportError } from '@/lib/reportError';
import type { DataRow } from '@/stores/analysisStore';
import { ErrorCode, ErrorContext, CommonErrors, isAppError } from '@/utils/error';
import { 
  assertThrowsError,
  TIMESTAMP_CORRELATION_PATTERN,
  UUID_V4_PATTERN 
} from '@/utils/errorMatchers';

// Mock 依賴模組
vi.mock('@/lib/apiClient');
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn().mockResolvedValue(undefined)
}));

describe('AutoAnalysisService', () => {
  let service: AutoAnalysisService;
  
  // 測試資料準備
  const mockToken = 'test-bearer-token-123';
  
  const mockDataRows: DataRow[] = [
    { id: 1, category: 'A', value: 100, status: 'active' },
    { id: 2, category: 'B', value: 200, status: 'inactive' },
    { id: 3, category: 'A', value: 150, status: 'active' },
    { id: 4, category: 'C', value: 300, status: 'pending' },
    { id: 5, category: 'B', value: 250, status: 'active' }
  ];

  const mockSuccessResponse: AutoAnalysisResponse = {
    success: true,
    message: '分析成功',
    group_var: 'category',
    cat_vars: ['status'],
    cont_vars: ['value'],
    analysis: {
      table: mockDataRows,
      groupCounts: {
        'A': 2,
        'B': 2,
        'C': 1
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AutoAnalysisService();
    // 設定環境變數
    process.env.NEXT_PUBLIC_API_URL = 'http://test-api.example.com';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeData', () => {
    describe('成功案例', () => {
      it('應該成功完成自動分析並返回正確結果', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        (apiClient.post as Mock).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeData(request, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledTimes(1);
        expect(apiClient.post).toHaveBeenCalledWith(
          'http://test-api.example.com/api/ai_automation/auto-analyze',
          request,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`
            },
            context: ErrorContext.ANALYSIS,
            correlation_id: expect.stringMatching(TIMESTAMP_CORRELATION_PATTERN),
            timeout: 60000
          })
        );
        expect(reportError).not.toHaveBeenCalled();
      });
    });

    describe('參數驗證錯誤', () => {
      it('應該在缺少 token 時拋出認證錯誤', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(request, ''),
          {
            code: ErrorCode.ANALYSIS_AUTH_FAILED
          },
          {
            correlation_idPattern: UUID_V4_PATTERN,  // 使用 UUID 格式
            ignoreExtraFields: true
          }
        );
        
        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('應該在資料為空時拋出資料不足錯誤', async () => {
        // Arrange
        const emptyRequest: AutoAnalysisRequest = {
          parsedData: [],
          fill_na: true
        };

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(emptyRequest, mockToken),
          {
            code: ErrorCode.VALIDATION_ERROR
          },
          {
            correlation_idPattern: UUID_V4_PATTERN,  // CommonErrors 使用 UUID
            ignoreExtraFields: true
          }
        );

        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('應該在 parsedData 為 null 時拋出錯誤', async () => {
        // Arrange
        const nullDataRequest = {
          parsedData: null as unknown as DataRow[],
          fill_na: false
        };

        // Act & Assert
        await expect(
          service.analyzeData(nullDataRequest, mockToken)
        ).rejects.toThrow();
        
        expect(apiClient.post).not.toHaveBeenCalled();
      });
    });

    describe('API 回應錯誤處理', () => {
      it('應該處理 API 返回 success: false 的情況', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        const failureResponse: AutoAnalysisResponse = {
          success: false,
          message: '伺服器處理失敗：記憶體不足'
        };

        (apiClient.post as Mock).mockResolvedValue(failureResponse);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(request, mockToken),
          {
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS
          },
          {
            correlation_idPattern: TIMESTAMP_CORRELATION_PATTERN,  // createError 使用時間戳
            ignoreExtraFields: true
          }
        );

        expect(reportError).toHaveBeenCalledTimes(1);
        expect(reportError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS
          }),
          expect.objectContaining({
            action: 'auto_analysis',
            dataRows: mockDataRows.length,
            response: failureResponse
          })
        );
      });

      it('應該處理無有效變項識別的情況', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        const noVariablesResponse: AutoAnalysisResponse = {
          success: true,
          cat_vars: [],
          cont_vars: []
        };

        (apiClient.post as Mock).mockResolvedValue(noVariablesResponse);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(request, mockToken),
          {
            code: ErrorCode.ANALYSIS_ERROR
          },
          {
            correlation_idPattern: TIMESTAMP_CORRELATION_PATTERN,  // createError 使用時間戳
            ignoreExtraFields: true
          }
        );

        expect(reportError).toHaveBeenCalledTimes(1);
      });
    });

    describe('網路錯誤處理', () => {
      it('應該處理網路連線錯誤', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        const networkError = new Error('Network request failed');
        (apiClient.post as Mock).mockRejectedValue(networkError);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(request, mockToken),
          {
            code: ErrorCode.NETWORK_ERROR,
            context: ErrorContext.ANALYSIS
          },
          {
            correlation_idPattern: TIMESTAMP_CORRELATION_PATTERN,  // createError 使用時間戳
            ignoreExtraFields: true
          }
        );

        expect(reportError).toHaveBeenCalledTimes(1);
        expect(reportError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.NETWORK_ERROR,
            context: ErrorContext.ANALYSIS
          }),
          expect.objectContaining({
            action: 'auto_analysis',
            dataRows: mockDataRows.length,
            originalError: networkError
          })
        );
      });

      it('應該處理字串類型的錯誤', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        const stringError = 'API 服務暫時無法使用';
        (apiClient.post as Mock).mockRejectedValue(stringError);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeData(request, mockToken),
          {
            code: ErrorCode.NETWORK_ERROR
          },
          {
            correlation_idPattern: TIMESTAMP_CORRELATION_PATTERN,  // createError 使用時間戳
            ignoreExtraFields: true
          }
        );

        expect(reportError).toHaveBeenCalledTimes(1);
      });

      it('應該正確處理已經是 AppError 的錯誤', async () => {
        // Arrange
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        const existingAppError = CommonErrors.serverError(ErrorContext.ANALYSIS);
        (apiClient.post as Mock).mockRejectedValue(existingAppError);

        // Act & Assert
        let thrownError: unknown;
        try {
          await service.analyzeData(request, mockToken);
        } catch (error) {
          thrownError = error;
        }

        // 確認錯誤被原封不動地拋出
        expect(thrownError).toBeDefined();
        if (thrownError && isAppError(thrownError)) {
          expect(thrownError.code).toBe(existingAppError.code);
          expect(thrownError.context).toBe(existingAppError.context);
        }
      });
    });

    describe('大型資料集處理', () => {
      it('應該能處理大量資料', async () => {
        // Arrange
        const largeDataRows: DataRow[] = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          category: `Category_${i % 10}`,
          value: Math.random() * 1000,
          status: i % 2 === 0 ? 'active' : 'inactive'
        }));

        const request: AutoAnalysisRequest = {
          parsedData: largeDataRows,
          fill_na: true
        };

        const largeDataResponse: AutoAnalysisResponse = {
          success: true,
          group_var: 'category',
          cat_vars: ['status'],
          cont_vars: ['value', 'id']
        };

        (apiClient.post as Mock).mockResolvedValue(largeDataResponse);

        // Act
        const result = await service.analyzeData(request, mockToken);

        // Assert
        expect(result).toEqual(largeDataResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            parsedData: largeDataRows,
            fill_na: true
          }),
          expect.any(Object)
        );
      });
    });

    describe('邊界條件測試', () => {
      it('應該處理極長的 token', async () => {
        // Arrange
        const veryLongToken = 'Bearer ' + 'a'.repeat(1000);
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        (apiClient.post as Mock).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeData(request, veryLongToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${veryLongToken}`
            }
          })
        );
      });

      it('應該處理 API URL 未設定的情況', async () => {
        // Arrange
        delete process.env.NEXT_PUBLIC_API_URL;
        const request: AutoAnalysisRequest = {
          parsedData: mockDataRows,
          fill_na: true
        };

        (apiClient.post as Mock).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeData(request, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          'undefined/api/ai_automation/auto-analyze',
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
  });
});