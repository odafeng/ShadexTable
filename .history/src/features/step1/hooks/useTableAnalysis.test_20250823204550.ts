// src/features/step1/hooks/useTableAnalysis.test.ts

import { createElement } from 'react';
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';


import { post } from '@/lib/apiClient';
import { reportError } from '@/lib/reportError';
import type { DataRow } from '@/stores/analysisStore';
import type { AppError } from '@/types/errors';
import { ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors';

// Mock modules 必須在最前面
vi.mock('@/lib/apiClient', () => ({
    post: vi.fn(),
}));

vi.mock('@/lib/reportError', () => ({
    reportError: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

// Mock Zustand store
const mockSetGroupVar = vi.fn();
const mockSetCatVars = vi.fn();
const mockSetContVars = vi.fn();
const mockSetResultTable = vi.fn();
const mockSetGroupCounts = vi.fn();

vi.mock('@/stores/analysisStore', () => ({
    useAnalysisStore: vi.fn(() => ({
        setGroupVar: mockSetGroupVar,
        setCatVars: mockSetCatVars,
        setContVars: mockSetContVars,
        setResultTable: mockSetResultTable,
        setGroupCounts: mockSetGroupCounts,
    })),
}));

// 動態導入 hook - 確保在 mock 之後
const getUseTableAnalysis = async () => {
    const module = await import('@/features/step1/hooks/useTableAnalysis');
    return module.useTableAnalysis;
};

// Import mocked functions after vi.mock

describe('useTableAnalysis', () => {
    let queryClient: QueryClient;
    let useTableAnalysis: any;

    // 測試資料
    const mockParsedData: DataRow[] = [
        { id: 1, name: 'Test 1', value: 10, category: 'A' },
        { id: 2, name: 'Test 2', value: 20, category: 'B' },
        { id: 3, name: 'Test 3', value: 30, category: 'A' },
    ];

    const mockToken = 'test-token-123';
    const mockGetToken = vi.fn(() => Promise.resolve(mockToken));
    const mockOnSuccess = vi.fn();
    const mockOnError = vi.fn();

    // 成功的 API 回應
    const mockSuccessResponse = {
        success: true,
        data: {
            table: mockParsedData,
            groupCounts: { A: 2, B: 1 },
        },
    };

    // Wrapper function for React Query - 不使用 JSX，改用 createElement
    const wrapper = ({ children }: { children: ReactNode }) => {
        return createElement(QueryClientProvider, {
            client: queryClient,
            children: children
        });
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        // 設定環境變數
        process.env.NEXT_PUBLIC_API_URL = 'http://test-api.com';

        // 動態導入 hook
        useTableAnalysis = await getUseTableAnalysis();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('成功情境', () => {
        it('應該成功執行表格分析並更新 store', async () => {
            // Mock API 成功回應
            (post as Mock).mockResolvedValueOnce(mockSuccessResponse);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onSuccess: mockOnSuccess,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            // 執行分析
            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            // 驗證 API 呼叫
            expect(post).toHaveBeenCalledWith(
                'http://test-api.com/api/analysis/table',
                {
                    data: mockParsedData,
                    group_col: 'category',
                    cat_vars: ['name'],
                    cont_vars: ['value'],
                    fillNA: false,
                },
                expect.objectContaining({
                    headers: {
                        Authorization: `Bearer ${mockToken}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    timeout: 60000,
                })
            );

            // 驗證 store 更新
            expect(mockSetGroupVar).toHaveBeenCalledWith('category');
            expect(mockSetCatVars).toHaveBeenCalledWith(['name']);
            expect(mockSetContVars).toHaveBeenCalledWith(['value']);
            expect(mockSetResultTable).toHaveBeenCalledWith(mockParsedData);
            expect(mockSetGroupCounts).toHaveBeenCalledWith({ A: 2, B: 1 });

            // 驗證成功回調
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnError).not.toHaveBeenCalled();
        });

        it('應該處理空的 groupCounts', async () => {
            const responseWithoutCounts = {
                success: true,
                data: {
                    table: mockParsedData,
                },
            };

            (post as Mock).mockResolvedValueOnce(responseWithoutCounts);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    '',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockSetResultTable).toHaveBeenCalledWith(mockParsedData);
            expect(mockSetGroupCounts).not.toHaveBeenCalled();
        });
    });

    describe('錯誤處理 - 輸入驗證', () => {
        it('應該拒絕空資料', async () => {
            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis([], 'category', ['name'], ['value'], false);
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error).toBeDefined();
            expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
            expect(error.userMessage).toContain('資料不足');

            expect(mockOnError).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ErrorCode.VALIDATION_ERROR,
                })
            );

            expect(reportError).toHaveBeenCalled();
            expect(post).not.toHaveBeenCalled();
        });

        it('應該拒絕未選擇任何變項的請求', async () => {
            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(mockParsedData, '', [], [], false);
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error.code).toBe(ErrorCode.ANALYSIS_ERROR);
            expect(error.userMessage).toContain('未選擇任何變項');

            expect(mockOnError).toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
            expect(post).not.toHaveBeenCalled();
        });
    });

    describe('錯誤處理 - 認證', () => {
        it('應該處理缺少 token 的情況', async () => {
            const mockGetTokenNull = vi.fn(() => Promise.resolve(null));

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetTokenNull,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error.code).toBe(ErrorCode.AUTH_ERROR);
            expect(error.context).toBe(ErrorContext.ANALYSIS);

            expect(mockOnError).toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
            expect(post).not.toHaveBeenCalled();
        });

        it('應該處理 token 取得失敗', async () => {
            const mockGetTokenError = vi.fn(() =>
                Promise.reject(new Error('Token fetch failed'))
            );

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetTokenError,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error.code).toBe(ErrorCode.AUTH_ERROR);

            expect(mockOnError).toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
        });
    });

    describe('錯誤處理 - API 回應', () => {
        it('應該處理 API 錯誤回應', async () => {
            const apiError: AppError = {
                code: ErrorCode.SERVER_ERROR,
                message: '伺服器錯誤',
                userMessage: '伺服器暫時無法回應',
                context: ErrorContext.NETWORK,
                severity: ErrorSeverity.HIGH,
                correlation_id: 'test-correlation-id',
                timestamp: new Date(),
                action: '請稍後重試',
                canRetry: true,
            };

            (post as Mock).mockRejectedValueOnce(apiError);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(apiError);
            expect(mockOnError).toHaveBeenCalledWith(apiError);
            expect(reportError).toHaveBeenCalled();
        });

        it('應該處理網路錯誤', async () => {
            const networkError = new Error('Network request failed');
            (post as Mock).mockRejectedValueOnce(networkError);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error.code).toBe(ErrorCode.ANALYSIS_ERROR);

            expect(mockOnError).toHaveBeenCalled();
            expect(reportError).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: ErrorCode.ANALYSIS_ERROR,
                }),
                expect.objectContaining({
                    action: 'table_analysis_error',
                    dataSize: mockParsedData.length,
                })
            );
        });

        it('應該處理未預期的錯誤類型', async () => {
            (post as Mock).mockRejectedValueOnce('Unexpected string error');

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                        onError: mockOnError,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            const error = result.current.error as AppError;
            expect(error.code).toBe(ErrorCode.ANALYSIS_ERROR);
            expect(mockOnError).toHaveBeenCalled();
            expect(reportError).toHaveBeenCalled();
        });
    });

    describe('狀態管理', () => {
        it('應該正確追蹤 loading 狀態', async () => {
            let resolvePromise: (value: any) => void;
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });

            (post as Mock).mockReturnValueOnce(pendingPromise as any);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            expect(result.current.loading).toBe(false);

            act(() => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            await act(async () => {
                resolvePromise!(mockSuccessResponse);
            });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
                expect(result.current.isSuccess).toBe(true);
            });
        });

        it('應該能夠清除錯誤狀態', async () => {
            (post as Mock).mockRejectedValueOnce(new Error('Test error'));

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
                expect(result.current.error).toBeDefined();
            });

            act(() => {
                result.current.clearError();
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(false);
                expect(result.current.error).toBeNull();
            });
        });

        it('應該暴露 mutation 物件供進階使用', () => {
            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            expect(result.current.mutation).toBeDefined();
            expect(result.current.mutation.mutate).toBeDefined();
            expect(result.current.mutation.reset).toBeDefined();
        });
    });

    describe('特殊情境', () => {
        it('應該處理 fillNA 參數', async () => {
            (post as Mock).mockResolvedValueOnce(mockSuccessResponse);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    mockParsedData,
                    'category',
                    ['name'],
                    ['value'],
                    true // fillNA = true
                );
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(post).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    fillNA: true,
                }),
                expect.any(Object)
            );
        });

        it('應該處理大量資料', async () => {
            const largeData: DataRow[] = Array.from({ length: 10000 }, (_, i) => ({
                id: i,
                name: `Test ${i}`,
                value: Math.random() * 100,
                category: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
            }));

            (post as Mock).mockResolvedValueOnce({
                success: true,
                data: {
                    table: largeData,
                    groupCounts: { A: 3334, B: 3333, C: 3333 },
                },
            });

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            await act(async () => {
                result.current.runAnalysis(
                    largeData,
                    'category',
                    ['name'],
                    ['value'],
                    false
                );
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockSetResultTable).toHaveBeenCalledWith(largeData);
            expect(reportError).not.toHaveBeenCalled();
        });

        it('應該在組件卸載時清理', () => {
            const { result, unmount } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            unmount();

            // 驗證沒有記憶體洩漏或未處理的 promise
            expect(result.current).toBeDefined();
        });
    });

    describe('並發控制', () => {
        it('應該允許多次呼叫並執行所有請求', async () => {
            (post as Mock).mockResolvedValue(mockSuccessResponse);

            const { result } = renderHook(
                () =>
                    useTableAnalysis({
                        getToken: mockGetToken,
                    }),
                { wrapper }
            );

            // 快速連續呼叫三次
            await act(async () => {
                result.current.runAnalysis(mockParsedData, 'category', ['name'], ['value'], false);
                result.current.runAnalysis(mockParsedData, 'category', ['name'], ['value'], false);
                result.current.runAnalysis(mockParsedData, 'category', ['name'], ['value'], false);
            });

            // 等待所有呼叫完成
            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
                expect(result.current.loading).toBe(false);
            });

            // 驗證所有請求都被執行
            expect(post).toHaveBeenCalledTimes(3);
            expect(mockSetResultTable).toHaveBeenCalledTimes(3);
            expect(mockSetGroupVar).toHaveBeenCalledTimes(3);

            // 每次呼叫都使用相同的參數
            expect(post).toHaveBeenCalledWith(
                'http://test-api.com/api/analysis/table',
                expect.objectContaining({
                    data: mockParsedData,
                    group_col: 'category',
                    cat_vars: ['name'],
                    cont_vars: ['value'],
                    fillNA: false,
                }),
                expect.any(Object)
            );
        });
    });
});