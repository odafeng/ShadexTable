import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import * as apiClient from '@/lib/apiClient';
import * as reportError from '@/lib/reportError';
import type { DataRow } from '@/stores/analysisStore';
import { ErrorCode, ErrorContext } from '@/types/errors';
import { createError } from '@/utils/error';
import {
  assertThrowsError 
} from '@/utils/errorMatchers';

import { TableAnalysisService, TableAnalysisRequest, TableAnalysisResponse } from './tableAnalysisService';

// Mock dependencies
vi.mock('@/lib/apiClient', () => ({
  post: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}));

describe('TableAnalysisService', () => {
  let service: TableAnalysisService;
  const mockToken = 'test-token-123';
  
  // Mock data
  const mockDataRows: DataRow[] = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 },
    { id: 3, name: 'Test 3', value: 300 },
  ];

  const validRequest: TableAnalysisRequest = {
    data: mockDataRows,
    group_col: 'name',
    cat_vars: ['category'],
    cont_vars: ['value'],
    fillNA: false,
  };

  const mockSuccessResponse: TableAnalysisResponse = {
    success: true,
    message: 'Analysis completed',
    data: {
      table: [
        { group: 'Group A', count: 10, mean: 50.5 },
        { group: 'Group B', count: 15, mean: 75.2 },
      ],
      groupCounts: {
        'Group A': 10,
        'Group B': 15,
      },
    },
  };

  beforeEach(() => {
    service = new TableAnalysisService();
    vi.clearAllMocks();

    // Mock process.env
    vi.stubGlobal('process', {
      env: {
        NEXT_PUBLIC_API_URL: 'https://api.test.com',
      },
    });

    // Mock crypto.randomUUID for consistent correlation_id
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'test-correlation-id-123'),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('analyzeTable', () => {
    describe('Success scenarios', () => {
      it('should successfully analyze table with valid data', async () => {
        // Arrange
        const mockedPost = vi.mocked(apiClient.post);
        mockedPost.mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeTable(validRequest, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith(
          'https://api.test.com/api/table/table-analyze',
          validRequest,
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
            context: ErrorContext.ANALYSIS,
            correlation_id: expect.any(String),
            timeout: 60000,
          })
        );
        expect(reportError.reportError).not.toHaveBeenCalled();
      });

      it('should handle empty data gracefully', async () => {
        // Arrange
        const emptyRequest: TableAnalysisRequest = {
          ...validRequest,
          data: [],
        };
        const emptyResponse: TableAnalysisResponse = {
          success: true,
          message: 'No data to analyze',
          data: {
            table: [], // 空陣列是合法的
            groupCounts: {},
          },
        };

        vi.mocked(apiClient.post).mockResolvedValue(emptyResponse);

        // Act - 空資料現在應該成功處理（因為我們允許空資料和空表格）
        const result = await service.analyzeTable(emptyRequest, mockToken);

        // Assert
        expect(result).toEqual(emptyResponse);
        expect(apiClient.post).toHaveBeenCalledTimes(1);
      });

      it('should handle fillNA option correctly', async () => {
        // Arrange
        const requestWithFillNA: TableAnalysisRequest = {
          ...validRequest,
          fillNA: true,
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeTable(requestWithFillNA, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            fillNA: true,
          }),
          expect.any(Object)
        );
      });
    });

    describe('Validation errors', () => {
      it('should throw error when token is missing', async () => {
        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(validRequest, ''),
          {
            code: ErrorCode.AUTH_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('缺少授權令牌') as any,
          },
          {
            checkcorrelation_id: true,
            checkTimestamp: true,
            ignoreExtraFields: true,
          }
        );

        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when API URL is not configured', async () => {
        // Arrange
        vi.stubGlobal('process', {
          env: {},
        });

        // Recreate service with new environment
        service = new TableAnalysisService();

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(validRequest, mockToken),
          {
            code: ErrorCode.SERVER_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('API URL 未配置') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when data is null', async () => {
        // Arrange
        const invalidRequest = {
          ...validRequest,
          data: null as any,
        };

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(invalidRequest, mockToken),
          {
            code: ErrorCode.VALIDATION_ERROR,
            context: ErrorContext.DATA_VALIDATION,
            message: expect.stringContaining('資料不足') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        expect(apiClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when no variables are selected', async () => {
        // Arrange
        const noVarsRequest: TableAnalysisRequest = {
          ...validRequest,
          cat_vars: [],
          cont_vars: [],
          group_col: '',
        };

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(noVarsRequest, mockToken),
          {
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('未選擇任何分析變項') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        expect(apiClient.post).not.toHaveBeenCalled();
      });
    });

    describe('API response errors', () => {
      it('should handle unsuccessful API response', async () => {
        // Arrange
        const failResponse: TableAnalysisResponse = {
          success: false,
          message: 'Analysis failed due to data issues',
        };

        vi.mocked(apiClient.post).mockResolvedValue(failResponse);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(validRequest, mockToken),
          {
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('Analysis failed') as any,
          },
          {
            checkcorrelation_id: true,
            checkTimestamp: true,
            ignoreExtraFields: true,
          }
        );

        expect(reportError.reportError).toHaveBeenCalledTimes(1);
        expect(reportError.reportError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.ANALYSIS_ERROR,
          }),
          expect.objectContaining({
            action: 'table_analysis',
            response: failResponse,
          })
        );
      });

      it('should handle network errors', async () => {
        // Arrange
        const networkError = new Error('Network timeout');
        vi.mocked(apiClient.post).mockRejectedValue(networkError);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(validRequest, mockToken),
          {
            code: ErrorCode.NETWORK_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('表格分析服務連線失敗') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        expect(reportError.reportError).toHaveBeenCalledTimes(1);
      });

      it('should handle API errors with custom error objects', async () => {
        // Arrange
        // 使用 createError 來創建真正的 AppError
        const apiError = createError(
          ErrorCode.SERVER_ERROR,
          ErrorContext.NETWORK,
          undefined,
          {
            customMessage: 'Internal server error'
          }
        );

        vi.mocked(apiClient.post).mockRejectedValue(apiError);

        // Act & Assert
        // 當已經是 AppError 時，應該直接拋出原錯誤
        await assertThrowsError(
          () => service.analyzeTable(validRequest, mockToken),
          {
            code: ErrorCode.SERVER_ERROR,
            context: ErrorContext.NETWORK,
            message: expect.stringContaining('Internal server error') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        // 當拋出的是 AppError 時，不會再次 reportError
        expect(reportError.reportError).not.toHaveBeenCalled();
      });

      it('should handle unexpected response format', async () => {
        // Arrange
        const invalidResponse = { unexpected: 'format' } as any;
        vi.mocked(apiClient.post).mockResolvedValue(invalidResponse);

        // Act & Assert
        await assertThrowsError(
          () => service.analyzeTable(validRequest, mockToken),
          {
            code: ErrorCode.ANALYSIS_ERROR,
            context: ErrorContext.ANALYSIS,
            message: expect.stringContaining('表格分析處理失敗') as any,
          },
          {
            ignoreExtraFields: true,
          }
        );

        expect(reportError.reportError).toHaveBeenCalledTimes(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle very large datasets', async () => {
        // Arrange
        const largeData: DataRow[] = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Test ${i}`,
          value: Math.random() * 1000,
        }));

        const largeRequest: TableAnalysisRequest = {
          ...validRequest,
          data: largeData,
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeTable(largeRequest, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            data: largeData,
          }),
          expect.any(Object)
        );
      });

      it('should handle special characters in column names', async () => {
        // Arrange
        const specialRequest: TableAnalysisRequest = {
          ...validRequest,
          group_col: 'special@column#name',
          cat_vars: ['column-with-dash', 'column.with.dot'],
          cont_vars: ['column_with_underscore'],
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeTable(specialRequest, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          specialRequest,
          expect.any(Object)
        );
      });

      it('should handle null and undefined values in data', async () => {
        // Arrange
        const dataWithNulls: DataRow[] = [
          { id: 1, name: null, value: 100 },
          { id: 2, name: 'Test', value: undefined },
          { id: 3, name: 'Test 3', value: null },
        ];

        const requestWithNulls: TableAnalysisRequest = {
          ...validRequest,
          data: dataWithNulls,
        };

        vi.mocked(apiClient.post).mockResolvedValue(mockSuccessResponse);

        // Act
        const result = await service.analyzeTable(requestWithNulls, mockToken);

        // Assert
        expect(result).toEqual(mockSuccessResponse);
      });

      it('should handle timeout configuration', async () => {
        // Arrange
        vi.mocked(apiClient.post).mockResolvedValue(mockSuccessResponse);

        // Act
        await service.analyzeTable(validRequest, mockToken);

        // Assert
        expect(apiClient.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            timeout: 60000, // 60 seconds
          })
        );
      });
    });

    describe('Error reporting', () => {
      it('should include request details in error report', async () => {
        // Arrange
        const failResponse: TableAnalysisResponse = {
          success: false,
          message: 'Detailed error message',
        };

        vi.mocked(apiClient.post).mockResolvedValue(failResponse);

        // Act
        try {
          await service.analyzeTable(validRequest, mockToken);
        } catch (error) {
          // Expected to throw
        }

        // Assert
        expect(reportError.reportError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.ANALYSIS_ERROR,
            message: expect.stringContaining('Detailed error message'),
          }),
          expect.objectContaining({
            action: 'table_analysis',
            dataRows: 3,
            response: failResponse,
          })
        );
      });

      it('should include error context in report', async () => {
        // Arrange
        const networkError = new Error('Connection refused');
        vi.mocked(apiClient.post).mockRejectedValue(networkError);

        // Act
        try {
          await service.analyzeTable(validRequest, mockToken);
        } catch (error) {
          // Expected to throw
        }

        // Assert
        expect(reportError.reportError).toHaveBeenCalledWith(
          expect.objectContaining({
            code: ErrorCode.NETWORK_ERROR,
            context: ErrorContext.ANALYSIS,
          }),
          expect.objectContaining({
            originalError: networkError,
            action: 'table_analysis',
          })
        );
      });
    });
  });
});