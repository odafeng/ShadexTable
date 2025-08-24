import { useMutation, useQueryClient } from '@tanstack/react-query';

import { post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow, AutoAnalysisResult } from '@/stores/analysisStore';
import { AppError } from '@/types/errors';
import { 
  isAppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  CommonErrors 
} from "@/utils/error";
import { v4 as generateUUID } from 'uuid';

import { AutoAnalysisRequest } from '../services/autoAnalysisService';

interface UseAutoAnalysisProps {
    getToken: () => Promise<string | null>;
    onSuccess?: () => void;
}

interface AutoAnalyzeParams {
    file: File | null;
    parsedData: DataRow[];
    fill_na: boolean;
}

export const useAutoAnalysis = (props: UseAutoAnalysisProps) => {
    const queryClient = useQueryClient();
    
    // 使用 Zustand store
    const {
        setFile,
        setGroupVar,
        setCatVars,
        setContVars,
        setAutoAnalysisResult,
        setResultTable,
        setGroupCounts,
        correlation_id,
        generateAndSetCorrelationId
    } = useAnalysisStore();

    // 驗證輸入
    const validateInput = (file: File | null, parsedData: DataRow[]): void => {
        if (!file) {
            const validationError = CommonErrors.fileNotSelected();
            reportError(validationError, { action: "auto_analysis_validation" });
            throw validationError;
        }

        if (parsedData.length === 0) {
            const dataError = CommonErrors.insufficientData();
            reportError(dataError, { action: "auto_analysis_validation" });
            throw dataError;
        }
    };

    // 取得認證令牌
    const getAuthToken = async (): Promise<string> => {
        const correlation_id = generateUUID();
        
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
                { 
                    correlation_id,
                    cause: err instanceof Error ? err : undefined
                }
            );
            await reportError(authError, { action: "auto_analysis_auth" });
            throw authError;
        }
    };

    // 驗證分析結果的完整性
    const validateAnalysisResult = (result: AutoAnalysisResult): void => {
        // 檢查是否有識別到有效的變項
        const hasValidVariables = 
            result.group_var || 
            (result.cat_vars && result.cat_vars.length > 0) || 
            (result.cont_vars && result.cont_vars.length > 0);

        if (!hasValidVariables) {
            const validationError = createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    customMessage: '自動分析未能識別到有效的變項',
                    details: {
                        group_var: result.group_var,
                        cat_vars: result.cat_vars,
                        cont_vars: result.cont_vars
                    }
                }
            );
            throw validationError;
        }
    };

    // 更新 Store 狀態
    const updateStoreState = (result: AutoAnalysisResult, file: File) => {
        setFile(file);
        setGroupVar(result.group_var || "");
        setCatVars(result.cat_vars || []);
        setContVars(result.cont_vars || []);
        setAutoAnalysisResult(result);
    };

    // 更新分析結果
    const updateAnalysisResults = (result: AutoAnalysisResult) => {
        if (result.analysis && 'table' in result.analysis) {
            const table = result.analysis.table as DataRow[];
            if (table) {
                setResultTable(table);
            }
        }

        if (result.analysis && 'groupCounts' in result.analysis) {
            const groupCounts = result.analysis.groupCounts as Record<string, number>;
            if (groupCounts) {
                setGroupCounts(groupCounts);
            }
        }
    };

    // 主要的分析函數
    const performAutoAnalysis = async ({ file, parsedData, fill_na }: AutoAnalyzeParams) => {
        let correlation_id = useAnalysisStore.getState().correlation_id;
        if (!correlation_id) {
            correlation_id = generateAndSetCorrelationId();
            console.log('⚠️ No correlation_id found, generated new:', correlation_id);
        }

        // 驗證輸入
        validateInput(file, parsedData);

        try {
            const token = await getAuthToken();

            const requestData: AutoAnalysisRequest = {
                parsedData,
                fill_na,
                correlation_id
            };

            // 使用 apiClient 進行請求
            const result = await post<AutoAnalysisRequest, AutoAnalysisResult>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/ai_automation/auto-analyze`, 
                requestData, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Correlation-ID': correlation_id
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id,
                    timeout: 60000 // 分析需要較長時間
                }
            );

            // 驗證分析結果
            validateAnalysisResult(result);

            // 更新 Store
            updateStoreState(result, file!);
            updateAnalysisResults(result);

            return result;

        } catch (err) {
            // 如果已經是 AppError，保留原本的錯誤碼和訊息
            let errorToReport: AppError;
            
            if (isAppError(err)) {
                errorToReport = err;
            } else if (err && typeof err === 'object' && 'code' in err) {
                // 如果錯誤物件有 code 屬性，嘗試保留它
                const errorObj = err as any;
                errorToReport = createError(
                    errorObj.code || ErrorCode.ANALYSIS_ERROR,
                    errorObj.context || ErrorContext.ANALYSIS,
                    undefined,
                    {
                        customMessage: errorObj.userMessage || errorObj.message,
                        correlation_id,
                        cause: err instanceof Error ? err : undefined,
                        details: errorObj.details
                    }
                );
            } else {
                // 只有在完全無法識別錯誤類型時，才使用通用的 ANALYSIS_ERROR
                errorToReport = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        correlation_id,
                        cause: err instanceof Error ? err : undefined
                    }
                );
            }
            
            await reportError(errorToReport, { 
                action: "auto_analysis_error",
                fileName: file?.name,
                dataSize: parsedData.length
            });

            throw errorToReport;
        }
    };

    // 使用 React Query 的 useMutation
    const mutation = useMutation({
        mutationKey: ['autoAnalysis'],
        mutationFn: performAutoAnalysis,
        onSuccess: () => {
            // 使快取失效（如果有相關的 query）
            queryClient.invalidateQueries({ queryKey: ['analysisResults'] });
            
            // 調用成功回調
            if (props.onSuccess) {
                props.onSuccess();
            }
        },
        onError: (error) => {
            // 錯誤已經在 performAutoAnalysis 中處理並回報
            console.error("❌ 自動分析失敗:", error);
        }
    });

    // 包裝的執行函數，保持原有的 API
    const handleAutoAnalyze = (file: File | null, parsedData: DataRow[], fill_na: boolean) => {
        mutation.mutate({ file, parsedData, fill_na });
    };

    return {
        loading: mutation.isPending,
        error: mutation.error as AppError | null,
        handleAutoAnalyze,
        setError: () => mutation.reset(),
        clearError: () => mutation.reset(),
        // 額外暴露 mutation 物件以供進階使用
        mutation
    };
};