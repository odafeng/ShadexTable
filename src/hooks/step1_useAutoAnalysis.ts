import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AutoAnalysisRequest } from '../services/step1_autoAnalysisService';
import { 
  isAppError, 
  ErrorCode, 
  ErrorContext,
  createError,
  createErrorHandler,
  CommonErrors 
} from "@/utils/error";
import { apiClient, reportError } from "@/lib/apiClient";
import { AppError } from '@/types/errors';
import { useAnalysisStore } from '@/stores/analysisStore';

interface UseAutoAnalysisProps {
    getToken: () => Promise<string | null>;
    onSuccess?: () => void;
}

interface AutoAnalyzeParams {
    file: File | null;
    parsedData: any[];
    fillNA: boolean;
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
        setGroupCounts
    } = useAnalysisStore();

    // 驗證輸入
    const validateInput = (file: File | null, parsedData: any[]): void => {
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

    // 獲取認證令牌
    const getAuthToken = async (): Promise<string> => {
        const correlationId = `auto-analysis-auth-${Date.now()}`;
        
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
                    correlationId,
                    cause: err instanceof Error ? err : undefined
                }
            );
            await reportError(authError, { action: "auto_analysis_auth" });
            throw authError;
        }
    };

    // 更新 Store 狀態
    const updateStoreState = (result: any, file: File) => {
        setFile(file);
        setGroupVar(result.group_var || "");
        setCatVars(result.cat_vars || []);
        setContVars(result.cont_vars || []);
        setAutoAnalysisResult(result);
    };

    // 更新分析結果
    const updateAnalysisResults = (result: any) => {
        if (result.analysis?.table) {
            setResultTable(result.analysis.table);
        }

        if (result.analysis?.groupCounts) {
            setGroupCounts(result.analysis.groupCounts);
        }
    };

    // 主要的分析函數
    const performAutoAnalysis = async ({ file, parsedData, fillNA }: AutoAnalyzeParams) => {
        const correlationId = `auto-analysis-${Date.now()}`;

        // 驗證輸入
        validateInput(file, parsedData);

        try {
            const token = await getAuthToken();

            const requestData: AutoAnalysisRequest = {
                parsedData,
                fillNA
            };

            // 使用 apiClient 進行請求
            const result = await apiClient.post('/api/analysis/auto', requestData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                context: ErrorContext.ANALYSIS,
                correlationId,
                timeout: 60000 // 分析需要較長時間
            });

            // 更新 Store
            updateStoreState(result, file!);
            updateAnalysisResults(result);

            return result;

        } catch (err) {
            // 確保錯誤是 AppError 格式
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
        onSuccess: (data) => {
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
    const handleAutoAnalyze = (file: File | null, parsedData: any[], fillNA: boolean) => {
        mutation.mutate({ file, parsedData, fillNA });
    };

    return {
        loading: mutation.isPending,
        error: mutation.error as AppError | null,
        handleAutoAnalyze,
        setError: (error: AppError | null) => mutation.reset(), // Reset mutation 會清除錯誤
        clearError: () => mutation.reset(),
        // 額外暴露 mutation 物件以供進階使用
        mutation
    };
};