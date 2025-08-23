import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { post } from '@/lib/apiClient';
import { reportError } from '@/lib/reportError';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow } from '@/stores/analysisStore';
import { AppError } from '@/types/errors';
import { 
  isAppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  CommonErrors 
} from '@/utils/error';

import { TableAnalysisRequest } from '../services/tableAnalysisService';

interface UseTableAnalysisProps {
    getToken: () => Promise<string | null>;
    onSuccess?: () => void;
    onError?: (error: AppError) => void;
}

interface TableAnalysisParams {
    parsedData: DataRow[];
    groupVar: string;
    catVars: string[];
    contVars: string[];
    fill_na: boolean;
}

// 定義分析結果類型
interface AnalysisResult {
    data: {
        table: DataRow[];
        groupCounts?: Record<string, number>;
    };
    success: boolean;
    message?: string;
}

export const useTableAnalysis = (props: UseTableAnalysisProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    
    // 使用 Zustand store
    const {
        setGroupVar,
        setCatVars,
        setContVars,
        setResultTable,
        setGroupCounts
    } = useAnalysisStore();

    // 更新 store 狀態
    const updateStoreState = (groupVar: string, catVars: string[], contVars: string[]) => {
        setGroupVar(groupVar);
        setCatVars(catVars);
        setContVars(contVars);
    };

    // 獲取認證令牌
    const getAuthToken = async (): Promise<string> => {
        try {
            const token = await props.getToken();
            if (!token) {
                throw CommonErrors.authError(ErrorContext.ANALYSIS);
            }
            return token;
        } catch (err) {
            const authError = createError(
                ErrorCode.AUTH_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                { cause: err instanceof Error ? err : undefined }
            );
            throw authError;
        }
    };

    // 驗證輸入資料
    const validateInput = (
        parsedData: DataRow[],
        groupVar: string,
        catVars: string[],
        contVars: string[]
    ): void => {
        if (parsedData.length === 0) {
            throw CommonErrors.insufficientData();
        }

        if (!groupVar && catVars.length === 0 && contVars.length === 0) {
            throw CommonErrors.noVariablesSelected();
        }
    };

    // 處理成功結果
    const handleSuccess = (result: AnalysisResult) => {
        setResultTable(result.data.table);

        if (result.data.groupCounts) {
            setGroupCounts(result.data.groupCounts);
        }

        if (props.onSuccess) {
            props.onSuccess();
        } else {
            router.push("/step3");
        }
    };

    // 主要的分析函數
    const performTableAnalysis = async (params: TableAnalysisParams) => {
        const { parsedData, groupVar, catVars, contVars, fill_na } = params;
        const correlation_id = `table-analysis-${Date.now()}`;

        try {
            // 驗證輸入
            validateInput(parsedData, groupVar, catVars, contVars);

            // 更新 Store（先更新，即使失敗也能保留使用者選擇）
            updateStoreState(groupVar, catVars, contVars);

            const token = await getAuthToken();
            
            const requestBody: TableAnalysisRequest = {
                data: parsedData,
                group_col: groupVar,
                cat_vars: catVars,
                cont_vars: contVars,
                fill_na,
            };

            // 使用統一的 apiClient
            const result = await post<TableAnalysisRequest, AnalysisResult>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/analysis/table`, 
                requestBody, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id,
                    timeout: 60000 // 分析需要較長時間
                }
            );

            return result;

        } catch (err: unknown) {
            console.error("❌ 表格分析失敗:", err);
            
            // 回報錯誤
            const errorToReport = isAppError(err) ? err : createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    correlation_id,
                    cause: err instanceof Error ? err : undefined
                }
            );
            
            await reportError(errorToReport, {
                action: "table_analysis_error",
                dataSize: parsedData.length,
                groupVar,
                catVars,
                contVars
            });

            throw errorToReport;
        }
    };

    // 使用 React Query 的 useMutation
    const mutation = useMutation({
        mutationKey: ['tableAnalysis'],
        mutationFn: performTableAnalysis,
        onSuccess: (data) => {
            // 處理成功結果
            handleSuccess(data);
            
            // 使快取失效（如果有相關的 query）
            queryClient.invalidateQueries({ queryKey: ['analysisResults'] });
            queryClient.invalidateQueries({ queryKey: ['tableData'] });
        },
        onError: (error: unknown) => {
            const appError = isAppError(error) ? error : createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                "分析失敗，請稍後再試"
            );
            
            if (props.onError) {
                props.onError(appError);
            }
        }
    });

    // 包裝的執行函數，保持原有的 API
    const runAnalysis = (
        parsedData: DataRow[],
        groupVar: string,
        catVars: string[],
        contVars: string[],
        fill_na: boolean
    ) => {
        mutation.mutate({ 
            parsedData, 
            groupVar, 
            catVars, 
            contVars, 
            fill_na 
        });
    };

    return {
        loading: mutation.isPending,
        error: mutation.error as AppError | null,
        runAnalysis,
        clearError: () => mutation.reset(),
        // 額外暴露 mutation 物件以供進階使用
        mutation,
        // 暴露狀態
        isSuccess: mutation.isSuccess,
        isError: mutation.isError,
        data: mutation.data
    };
};