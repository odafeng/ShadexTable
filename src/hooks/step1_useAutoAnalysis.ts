import { useState } from 'react';
import { AutoAnalysisService, AutoAnalysisRequest } from '../services/step1_autoAnalysisService';
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

export const useAutoAnalysis = (props: UseAutoAnalysisProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const autoAnalysisService = new AutoAnalysisService();
    
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

    // 清除錯誤
    const clearError = () => setError(null);

    // 統一的錯誤處理器
    const handleError = createErrorHandler((appError: AppError) => {
        setError(appError);
    });

    const validateInput = (file: File | null, parsedData: any[]): boolean => {
        if (!file) {
            const validationError = CommonErrors.fileNotSelected();
            setError(validationError);
            reportError(validationError, { action: "auto_analysis_validation" });
            return false;
        }

        if (parsedData.length === 0) {
            const dataError = CommonErrors.insufficientData();
            setError(dataError);
            reportError(dataError, { action: "auto_analysis_validation" });
            return false;
        }

        return true;
    };

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
            setError(authError);
            await reportError(authError, { action: "auto_analysis_auth" });
            throw authError;
        }
    };

    const updateStoreState = (result: any, file: File) => {
        setFile(file);
        setGroupVar(result.group_var || "");
        setCatVars(result.cat_vars || []);
        setContVars(result.cont_vars || []);
        setAutoAnalysisResult(result);
    };

    const updateAnalysisResults = (result: any) => {
        if (result.analysis?.table) {
            setResultTable(result.analysis.table);
        }

        if (result.analysis?.groupCounts) {
            setGroupCounts(result.analysis.groupCounts);
        }
    };

    const handleAutoAnalyze = async (file: File | null, parsedData: any[], fillNA: boolean) => {
        clearError();
        
        if (!validateInput(file, parsedData)) {
            return;
        }

        setLoading(true);
        const correlationId = `auto-analysis-${Date.now()}`;

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

            updateStoreState(result, file!);
            updateAnalysisResults(result);

            // 調用成功回調
            if (props.onSuccess) {
                props.onSuccess();
            }

        } catch (err) {
            // 使用統一錯誤處理器
            handleError(err);
            
            // 修正：使用 isAppError 函數來檢查，而不是 instanceof AppError
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
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        handleAutoAnalyze,
        setError: (error: AppError | null) => setError(error),
        clearError
    };
};