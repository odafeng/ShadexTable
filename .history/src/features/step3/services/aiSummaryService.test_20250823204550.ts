// app/step3/services/aiSummaryService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { AISummaryResponse } from '@/features/step3/types';
import { post } from '@/lib/apiClient';
import { ErrorCode, ErrorContext, createError, isAppError } from '@/utils/error';

import { generateAISummary } from './aiSummaryService';

// Mock dependencies
vi.mock('@/lib/apiClient', () => ({
  post: vi.fn()
}));

vi.mock('@/utils/error', () => ({
  ErrorContext: {
    ANALYSIS: 'ANALYSIS',
    NETWORK: 'NETWORK',
    UNKNOWN: 'UNKNOWN'
  },
  ErrorCode: {
    ANALYSIS_ERROR: 'ANALYSIS_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR'
  },
  createError: vi.fn((code, context, messageKey, options) => ({
    code,
    context,
    message: options?.customMessage || 'Error',
    correlation_id: 'test-correlation-id',
    timestamp: new Date(),
    severity: 'MEDIUM',
    userMessage: options?.customMessage || 'Error',
    canRetry: true
  })),
  isAppError: vi.fn((error) => {
    return error && typeof error === 'object' && 'code' in error && 'context' in error;
  })
}));

describe('aiSummaryService', () => {
  const mockToken = 'test-token-123';
  const mockData = 'test data for analysis';
  const mockApiUrl = 'https://api.test.com';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable
    process.env.NEXT_PUBLIC_API_URL = mockApiUrl;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  describe('generateAISummary', () => {
    describe('成功案例', () => {
      it('應該正確處理 API 回傳 summary 在根層級的情況', async () => {
        const mockResponse: AISummaryResponse = {
          summary: '這是一個 AI 摘要'
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);

        expect(result).toBe('這是一個 AI 摘要');
        expect(post).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledWith(
          `${mockApiUrl}/api/table/ai-summary`,
          { data: mockData },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`
            },
            context: ErrorContext.ANALYSIS
          }
        );
      });

      it('應該正確處理 API 回傳 summary 在 data 物件內的情況', async () => {
        const mockResponse: AISummaryResponse = {
          data: {
            summary: '這是嵌套的 AI 摘要'
          }
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);

        expect(result).toBe('這是嵌套的 AI 摘要');
        expect(post).toHaveBeenCalledTimes(1);
      });

      it('應該優先使用根層級的 summary', async () => {
        const mockResponse: AISummaryResponse = {
          summary: '根層級摘要',
          data: {
            summary: '嵌套摘要'
          }
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);

        expect(result).toBe('根層級摘要');
      });

      it('應該正確處理空字串的 summary', async () => {
        const mockResponse: AISummaryResponse = {
          summary: ''
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要回應格式異常'
          }
        );
      });
    });

    describe('錯誤案例', () => {
      it('應該處理 API 回傳空物件的情況', async () => {
        const mockResponse = {};
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要回應格式異常'
          }
        );
      });

      it('應該處理 API 回傳 null 的情況', async () => {
        vi.mocked(post).mockResolvedValueOnce(null as any);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要回應格式異常'
          }
        );
      });

      it('應該處理 API 回傳 undefined 的情況', async () => {
        vi.mocked(post).mockResolvedValueOnce(undefined as any);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要回應格式異常'
          }
        );
      });

      it('應該直接拋出已經是 AppError 的錯誤', async () => {
        const mockAppError = {
          code: ErrorCode.NETWORK_ERROR,
          context: ErrorContext.NETWORK,
          message: '網路錯誤',
          correlation_id: 'error-id',
          timestamp: new Date(),
          severity: 'HIGH',
          userMessage: '網路連線失敗',
          canRetry: true
        };
        
        vi.mocked(post).mockRejectedValueOnce(mockAppError);
        vi.mocked(isAppError).mockReturnValueOnce(true);

        await expect(generateAISummary(mockData, mockToken)).rejects.toEqual(mockAppError);
        expect(createError).not.toHaveBeenCalled();
      });

      it('應該將一般 Error 轉換為 AppError', async () => {
        const normalError = new Error('一般錯誤訊息');
        
        vi.mocked(post).mockRejectedValueOnce(normalError);
        vi.mocked(isAppError).mockReturnValueOnce(false);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要產生失敗',
            cause: normalError
          }
        );
      });

      it('應該處理非 Error 物件的拋出', async () => {
        const nonErrorObject = { error: 'something went wrong' };
        
        vi.mocked(post).mockRejectedValueOnce(nonErrorObject);
        vi.mocked(isAppError).mockReturnValueOnce(false);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要產生失敗',
            cause: undefined
          }
        );
      });

      it('應該處理字串類型的拋出', async () => {
        const errorString = '字串錯誤';
        
        vi.mocked(post).mockRejectedValueOnce(errorString);
        vi.mocked(isAppError).mockReturnValueOnce(false);

        await expect(generateAISummary(mockData, mockToken)).rejects.toThrow();
        expect(createError).toHaveBeenCalledWith(
          ErrorCode.ANALYSIS_ERROR,
          ErrorContext.ANALYSIS,
          undefined,
          {
            customMessage: 'AI 摘要產生失敗',
            cause: undefined
          }
        );
      });
    });

    describe('邊界案例', () => {
      it('應該處理 summary 只有空白字元的情況', async () => {
        const mockResponse: AISummaryResponse = {
          summary: '   '
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);
        expect(result).toBe('   ');
      });

      it('應該處理非常長的 summary', async () => {
        const longSummary = 'A'.repeat(10000);
        const mockResponse: AISummaryResponse = {
          summary: longSummary
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);
        expect(result).toBe(longSummary);
      });

      it('應該處理包含特殊字元的 summary', async () => {
        const specialSummary = '這是包含特殊字元的摘要: \n\t"<>&\'';
        const mockResponse: AISummaryResponse = {
          summary: specialSummary
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);
        expect(result).toBe(specialSummary);
      });

      it('應該處理沒有設定環境變數的情況', async () => {
        delete process.env.NEXT_PUBLIC_API_URL;
        
        const mockResponse: AISummaryResponse = {
          summary: '測試摘要'
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, mockToken);

        expect(result).toBe('測試摘要');
        expect(post).toHaveBeenCalledWith(
          'undefined/api/table/ai-summary',
          { data: mockData },
          expect.any(Object)
        );
      });

      it('應該處理空的 token', async () => {
        const mockResponse: AISummaryResponse = {
          summary: '測試摘要'
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary(mockData, '');

        expect(result).toBe('測試摘要');
        expect(post).toHaveBeenCalledWith(
          expect.any(String),
          { data: mockData },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer '
            },
            context: ErrorContext.ANALYSIS
          }
        );
      });

      it('應該處理空的 data', async () => {
        const mockResponse: AISummaryResponse = {
          summary: '測試摘要'
        };
        
        vi.mocked(post).mockResolvedValueOnce(mockResponse);

        const result = await generateAISummary('', mockToken);

        expect(result).toBe('測試摘要');
        expect(post).toHaveBeenCalledWith(
          expect.any(String),
          { data: '' },
          expect.any(Object)
        );
      });
    });

    describe('整合測試', () => {
      it('應該正確處理多次呼叫', async () => {
        const responses: AISummaryResponse[] = [
          { summary: '第一個摘要' },
          { data: { summary: '第二個摘要' } },
          { summary: '第三個摘要' }
        ];

        responses.forEach(response => {
          vi.mocked(post).mockResolvedValueOnce(response);
        });

        const results = await Promise.all([
          generateAISummary('data1', 'token1'),
          generateAISummary('data2', 'token2'),
          generateAISummary('data3', 'token3')
        ]);

        expect(results).toEqual(['第一個摘要', '第二個摘要', '第三個摘要']);
        expect(post).toHaveBeenCalledTimes(3);
      });

      it('應該在並發錯誤時正確處理', async () => {
        vi.mocked(post)
          .mockResolvedValueOnce({ summary: '成功' })
          .mockRejectedValueOnce(new Error('失敗'))
          .mockResolvedValueOnce({ summary: '成功2' });

        vi.mocked(isAppError).mockReturnValue(false);

        const results = await Promise.allSettled([
          generateAISummary('data1', 'token1'),
          generateAISummary('data2', 'token2'),
          generateAISummary('data3', 'token3')
        ]);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(results[2].status).toBe('fulfilled');
      });
    });
  });
});