import { useState, useCallback } from 'react';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow } from '@/stores/analysisStore';
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
    const groupVar = useAnalysisStore(state => state.groupVar);  // 使用者指定的分組變項
    const setFile = useAnalysisStore(state => state.setFile);
    const setGroupVar = useAnalysisStore(state => state.setGroupVar);
    const setCatVars = useAnalysisStore(state => state.setCatVars);
    const setContVars = useAnalysisStore(state => state.setContVars);
    const setAutoAnalysisResult = useAnalysisStore(state => state.setAutoAnalysisResult);
    const setResultTable = useAnalysisStore(state => state.setResultTable);
    const setGroupCounts = useAnalysisStore(state => state.setGroupCounts);

    /**
     * 處理手動分析模式
     */
    const handleManualAnalyze = useCallback(async (file: File) => {
        setFile(file);
        setAutoAnalysisResult(null);
        // 給一點時間讓 UI 更新
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/step2");
    }, [setFile, setAutoAnalysisResult, router]);

    /**
     * 處理 AI 全自動分析模式
     * 現在使用使用者指定的分組變項，而非 AI 判定
     */
    const handleAutoAnalyze = useCallback(async (file: File) => {
        if (parsedData.length === 0) {
            throw CommonErrors.fileNotSelected();
        }

        // 在 autoMode 下，如果使用者沒有選擇分組變項，仍可進行分析
        // 後端會處理無分組的情況
        console.log('開始 AI 全自動分析:', {
            groupVar: groupVar || '無',
            dataRows: parsedData.length,
            fillNA: fillNA
        });

        setFile(file);
        const token = await getToken();

        if (!token) throw CommonErrors.analysisAuthFailed();

        // 呼叫更新後的 FileAnalysisService，傳入分組變項
        const rawResult = await FileAnalysisService.performAutoAnalysis(
            parsedData,
            fillNA,
            token,
            groupVar  // 傳遞使用者指定的分組變項
        );
        console.log('自動分析結果:', rawResult);

        // Ensure error is always an instance of Error
        const result: AutoAnalysisResponse = {
            ...rawResult,
            error: rawResult.error instanceof Error
                ? rawResult.error
                : rawResult.error
                    ? new Error(typeof rawResult.error === 'object' && 'message' in rawResult.error
                        ? rawResult.error.message
                        : String(rawResult.error))
                    : undefined,
        };

        if (!result.success) {
            throw result.error || new Error('Auto analysis failed');
        }

        // 更新 store 狀態
        // 保持使用者選擇的分組變項不變（不依賴 AI 返回的 group_var）
        setCatVars(result.result?.cat_vars || []);
        setContVars(result.result?.cont_vars || []);

        // 設定自動分析結果
        if (result.result) {
            // 確保 group_var 是使用者指定的，而非 AI 判定的
            const autoAnalysisResult = {
                ...result.result,
                group_var: groupVar  // 覆蓋為使用者指定的值
            };
            setAutoAnalysisResult(autoAnalysisResult);
        } else {
            setAutoAnalysisResult(null);
        }

        // 檢查並設定 table
        if (result.result?.analysis?.table) {
            setResultTable(result.result.analysis.table);
        }

        // 檢查並設定 groupCounts
        if (result.result?.analysis?.groupCounts) {
            setGroupCounts(result.result.analysis.groupCounts);
        }

        router.push("/step3");
    }, [
        parsedData,
        fillNA,
        groupVar,  // 使用使用者指定的分組變項
        getToken,
        setFile,
        setCatVars,
        setContVars,
        setAutoAnalysisResult,
        setResultTable,
        setGroupCounts,
        router
    ]);

    /**
     * 觸發分析的主函數
     */
    const triggerAnalysis = useCallback(async (file: File | null) => {
        if (!file) {
            throw CommonErrors.fileNotSelected();
        }

        // AI 全自動模式時，檢查是否已選擇分組變項（可選）
        // 移除強制選擇的限制，允許不分組分析
        if (autoMode) {
            console.log(`觸發 AI 全自動分析，分組變項: ${groupVar || '無（將進行整體分析）'}`);
        }

        setLoading(true);

        try {
            if (autoMode) {
                // AI 全自動模式：使用使用者指定的分組變項
                await handleAutoAnalyze(file);
            } else {
                // 半自動模式：進入 Step2 手動調整
                await handleManualAnalyze(file);
            }
        } finally {
            setLoading(false);
        }
    }, [autoMode, groupVar, handleAutoAnalyze, handleManualAnalyze]);

    return {
        loading,
        autoMode,
        setAutoMode,
        triggerAnalysis
    };
}