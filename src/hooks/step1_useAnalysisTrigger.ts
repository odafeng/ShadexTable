// hooks/step1/useAnalysisTrigger.ts
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysis } from '@/context/AnalysisContext';
import { FileAnalysisService } from '@/services/step1_fileAnalysisService';
import { CommonErrors } from '@/utils/error';

interface UseAnalysisTriggerReturn {
    loading: boolean;
    autoMode: boolean;
    setAutoMode: (mode: boolean) => void;
    triggerAnalysis: (file: File | null) => Promise<void>;
}

export function useAnalysisTrigger(): UseAnalysisTriggerReturn {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [autoMode, setAutoMode] = useState(false);
    
    const {
        parsedData,
        setFile: setCtxFile,
        setGroupVar: setCtxGroupVar,
        setCatVars: setCtxCatVars,
        setContVars: setCtxContVars,
        fillNA,
        setAutoAnalysisResult,
        setResultTable,
        setGroupCounts,
    } = useAnalysis();

    const handleManualAnalyze = useCallback(async (file: File) => {
        setCtxFile(file);
        setAutoAnalysisResult(null);
        // 給一點時間讓 UI 更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/step2");
    }, [setCtxFile, setAutoAnalysisResult, router]);

    const handleAutoAnalyze = useCallback(async (file: File) => {
        if (parsedData.length === 0) {
            throw CommonErrors.fileNotSelected();
        }

        setCtxFile(file);
        const token = await getToken();
        if (!token) throw CommonErrors.analysisAuthFailed();

        const result = await FileAnalysisService.performAutoAnalysis(
            parsedData, 
            fillNA, 
            token
        );
        
        if (!result.success) {
            throw result.error;
        }

        // 更新 context 狀態
        setCtxGroupVar(result.result?.group_var || "");
        setCtxCatVars(result.result?.cat_vars || []);
        setCtxContVars(result.result?.cont_vars || []);
        setAutoAnalysisResult(result.result);

        if (result.result?.analysis?.table) {
            setResultTable(result.result.analysis.table);
        }

        if (result.result?.analysis?.groupCounts) {
            setGroupCounts(result.result.analysis.groupCounts);
        }

        router.push("/step3");
    }, [
        parsedData, 
        fillNA, 
        getToken, 
        setCtxFile,
        setCtxGroupVar,
        setCtxCatVars, 
        setCtxContVars,
        setAutoAnalysisResult,
        setResultTable,
        setGroupCounts,
        router
    ]);

    const triggerAnalysis = useCallback(async (file: File | null) => {
        if (!file) {
            throw CommonErrors.fileNotSelected();
        }

        setLoading(true);
        
        try {
            if (autoMode) {
                await handleAutoAnalyze(file);
            } else {
                await handleManualAnalyze(file);
            }
        } finally {
            setLoading(false);
        }
    }, [autoMode, handleAutoAnalyze, handleManualAnalyze]);

    return {
        loading,
        autoMode,
        setAutoMode,
        triggerAnalysis
    };
}