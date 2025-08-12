import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow } from '@/stores/analysisStore';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { CommonErrors } from '@/utils/error';

// 定義自動分析響應的完整類型
interface AutoAnalysisResponse {
    success: boolean;
    error?: Error;
    result?: {
        classification?: Record<string, string>;
        success?: boolean;
        message?: string;
        group_var?: string;
        cat_vars?: string[];
        cont_vars?: string[];
        analysis?: {
            summary?: string;
            details?: Record<string, unknown>;
            table?: DataRow[];
            groupCounts?: Record<string, number>;
        };
        confidence?: number;
        suggestions?: string[];
    };
}

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
    
    // 🔥 優化：局部訂閱需要的狀態和方法
    const parsedData = useAnalysisStore(state => state.parsedData);
    const fillNA = useAnalysisStore(state => state.fillNA);
    const setFile = useAnalysisStore(state => state.setFile);
    const setGroupVar = useAnalysisStore(state => state.setGroupVar);
    const setCatVars = useAnalysisStore(state => state.setCatVars);
    const setContVars = useAnalysisStore(state => state.setContVars);
    const setAutoAnalysisResult = useAnalysisStore(state => state.setAutoAnalysisResult);
    const setResultTable = useAnalysisStore(state => state.setResultTable);
    const setGroupCounts = useAnalysisStore(state => state.setGroupCounts);

    const handleManualAnalyze = useCallback(async (file: File) => {
        setFile(file);
        setAutoAnalysisResult(null);
        // 給一點時間讓 UI 更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/step2");
    }, [setFile, setAutoAnalysisResult, router]);

    const handleAutoAnalyze = useCallback(async (file: File) => {
        if (parsedData.length === 0) {
            throw CommonErrors.fileNotSelected();
        }

        setFile(file);
        const token = await getToken();
        if (!token) throw CommonErrors.analysisAuthFailed();

        const rawResult = await FileAnalysisService.performAutoAnalysis(
            parsedData, 
            fillNA, 
            token
        );

        // Ensure error is always an instance of Error
        const result: AutoAnalysisResponse = {
            ...rawResult,
            error: rawResult.error instanceof Error
                ? rawResult.error
                : rawResult.error
                    ? new Error(rawResult.error.message || String(rawResult.error))
                    : undefined,
        };
        
        if (!result.success) {
            throw result.error || new Error('Auto analysis failed');
        }

        // 更新 store 狀態
        setGroupVar(result.result?.group_var || "");
        setCatVars(result.result?.cat_vars || []);
        setContVars(result.result?.cont_vars || []);
        
        // 安全地設置 autoAnalysisResult
        if (result.result) {
            setAutoAnalysisResult(result.result);
        } else {
            setAutoAnalysisResult(null);
        }

        // 檢查並設置 table
        if (result.result?.analysis?.table) {
            setResultTable(result.result.analysis.table);
        }

        // 檢查並設置 groupCounts
        if (result.result?.analysis?.groupCounts) {
            setGroupCounts(result.result.analysis.groupCounts);
        }

        router.push("/step3");
    }, [
        parsedData, 
        fillNA, 
        getToken, 
        setFile,
        setGroupVar,
        setCatVars, 
        setContVars,
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