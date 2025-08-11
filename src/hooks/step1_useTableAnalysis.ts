import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TableAnalysisService, TableAnalysisRequest } from '../services/step1_tableAnalysisService';
import { 
  isAppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  createErrorHandler,
  CommonErrors 
} from '@/utils/error';
import { apiClient, reportError } from '@/lib/apiClient';
import { AppError } from '@/types/errors';
import { useAnalysisStore } from '@/stores/analysisStore';

interface UseTableAnalysisProps {
    getToken: () => Promise<string | null>;
    onSuccess?: () => void;
    onError?: (error: AppError) => void;
}

export const useTableAnalysis = (props: UseTableAnalysisProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const router = useRouter();
    const tableAnalysisService = new TableAnalysisService();
    
    // 使用 Zustand store
    const {
        setGroupVar,
        setCatVars,
        setContVars,
        setResultTable,
        setGroupCounts
    } = useAnalysisStore();

    // 統一的錯誤處理器
    const handleError = createErrorHandler((appError: AppError) => {
        setError(appError);
        if (props.onError) {
            props.onError(appError);
        }
    });

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
        parsedData: any[],
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
    const handleSuccess = (result: any) => {
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
    const runAnalysis = async (
        parsedData: any[],
        groupVar: string,
        catVars: string[],
        contVars: string[],
        fillNA: boolean
    ) => {
        setError(null);
        updateStoreState(groupVar, catVars, contVars);
        setLoading(true);

        const correlationId = `table-analysis-${Date.now()}`;

        try {
            // 驗證輸入
            validateInput(parsedData, groupVar, catVars, contVars);

            const token = await getAuthToken();
            
            const requestBody: TableAnalysisRequest = {
                data: parsedData,
                group_col: groupVar,
                cat_vars: catVars,
                cont_vars: contVars,
                fillNA,
            };

            // 使用統一的 apiClient
            const result = await apiClient.post('/api/analysis/table', requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                context: ErrorContext.ANALYSIS,
                correlationId,
                timeout: 60000 // 分析需要較長時間
            });

            handleSuccess(result);

        } catch (err: unknown) {
            console.error("❌ 表格分析失敗:", err);
            
            // 使用統一錯誤處理器
            handleError(err);
            
            // 回報錯誤
            const errorToReport = isAppError(err) ? err : createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    correlationId,
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
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        runAnalysis,
        clearError: () => setError(null)
    };
};