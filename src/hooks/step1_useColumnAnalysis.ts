// step1_useColumnAnalysis.ts
import { useState, useCallback } from 'react';
import { FileAnalysisService, ColumnProfile } from '@/services/step1_fileAnalysisService';
import { CommonErrors } from '@/utils/error';
import { useAnalysisStore } from '@/stores/analysisStore';

export function useColumnAnalysis() {
    // 從 Zustand store 獲取狀態和方法
    const columnsPreview = useAnalysisStore(state => state.columnsPreview);
    const showPreview = useAnalysisStore(state => state.showPreview);
    const columnAnalysisLoading = useAnalysisStore(state => state.columnAnalysisLoading);
    const setColumnsPreview = useAnalysisStore(state => state.setColumnsPreview);
    const setShowPreview = useAnalysisStore(state => state.setShowPreview);
    const setColumnAnalysisLoading = useAnalysisStore(state => state.setColumnAnalysisLoading);
    const setColumnProfile = useAnalysisStore(state => state.setColumnProfile);

    const analyzeColumns = useCallback(async (
        data: any[], 
        token?: string,
        setColumnTypes?: (types: { column: string; suggested_type: string }[]) => void
    ) => {
        setColumnAnalysisLoading(true);
        
        try {
            const authToken = token || localStorage.getItem("__session") || "";
            if (!authToken) throw CommonErrors.authTokenMissing();

            const result = await FileAnalysisService.analyzeColumns(data, authToken);
            
            if (result.success && result.columns) {
                setColumnsPreview(result.columns);
                setColumnProfile(result.columns); // 同時更新 columnProfile
                
                if (setColumnTypes) {
                    const columnTypesData = result.columns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(columnTypesData);
                }
                setShowPreview(true);
            } else {
                // 使用備用方案
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                setColumnsPreview(fallbackColumns);
                setColumnProfile(fallbackColumns);
                
                if (setColumnTypes) {
                    const fallbackTypesData = fallbackColumns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(fallbackTypesData);
                }
                setShowPreview(true);
            }
        } catch (err) {
            // 使用備用方案，但不拋出錯誤
            const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
            setColumnsPreview(fallbackColumns);
            setColumnProfile(fallbackColumns);
            setShowPreview(true);
            throw err;
        } finally {
            setColumnAnalysisLoading(false);
        }
    }, [setColumnsPreview, setShowPreview, setColumnAnalysisLoading, setColumnProfile]);

    const retryAnalysis = useCallback(async (
        data: any[],
        setColumnTypes?: (types: { column: string; suggested_type: string }[]) => void
    ) => {
        if (data.length > 0) {
            await analyzeColumns(data, undefined, setColumnTypes);
        }
    }, [analyzeColumns]);

    const resetColumnAnalysis = useCallback(() => {
        setColumnsPreview([]);
        setShowPreview(false);
        setColumnAnalysisLoading(false);
    }, [setColumnsPreview, setShowPreview, setColumnAnalysisLoading]);

    return {
        columnsPreview,
        showPreview,
        columnAnalysisLoading,
        analyzeColumns,
        retryAnalysis,
        resetColumnAnalysis
    };
}