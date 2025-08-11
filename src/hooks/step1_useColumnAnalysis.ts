// hooks/step1/useColumnAnalysis.ts
import { useState, useCallback } from 'react';
import { FileAnalysisService, ColumnProfile } from '@/services/step1_fileAnalysisService';
import { CommonErrors } from '@/utils/error';

interface UseColumnAnalysisReturn {
    columnsPreview: ColumnProfile[];
    showPreview: boolean;
    columnAnalysisLoading: boolean;
    analyzeColumns: (data: any[], token?: string) => Promise<void>;
    retryAnalysis: (data: any[]) => Promise<void>;
    resetColumnAnalysis: () => void;
}

export function useColumnAnalysis(
    setColumnTypes?: (columns: ColumnProfile[]) => void
): UseColumnAnalysisReturn {
    const [columnsPreview, setColumnsPreview] = useState<ColumnProfile[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [columnAnalysisLoading, setColumnAnalysisLoading] = useState(false);

    const analyzeColumns = useCallback(async (data: any[], token?: string) => {
        setColumnAnalysisLoading(true);
        
        try {
            const authToken = token || localStorage.getItem("__session") || "";
            if (!authToken) throw CommonErrors.authTokenMissing();

            const result = await FileAnalysisService.analyzeColumns(data, authToken);
            
            if (result.success && result.columns) {
                setColumnsPreview(result.columns);
                if (setColumnTypes) {
                    setColumnTypes(result.columns);
                }
                setShowPreview(true);
            } else {
                // 使用備用方案
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                setColumnsPreview(fallbackColumns);
                setShowPreview(true);
            }
        } catch (err) {
            // 使用備用方案，但不拋出錯誤
            const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
            setColumnsPreview(fallbackColumns);
            setShowPreview(true);
            throw err; // 重新拋出供上層處理
        } finally {
            setColumnAnalysisLoading(false);
        }
    }, [setColumnTypes]);

    const retryAnalysis = useCallback(async (data: any[]) => {
        if (data.length > 0) {
            await analyzeColumns(data);
        }
    }, [analyzeColumns]);

    const resetColumnAnalysis = useCallback(() => {
        setColumnsPreview([]);
        setShowPreview(false);
        setColumnAnalysisLoading(false);
    }, []);

    return {
        columnsPreview,
        showPreview,
        columnAnalysisLoading,
        analyzeColumns,
        retryAnalysis,
        resetColumnAnalysis
    };
}