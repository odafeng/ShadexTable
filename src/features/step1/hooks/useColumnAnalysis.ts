// step1_useColumnAnalysis.ts
import { useCallback } from 'react';

import { useAuth } from '@clerk/nextjs';

import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { ColumnProfile, DataRow } from '@/stores/analysisStore';  // 從 store 匯入
import { CommonErrors } from '@/utils/error';

// 定義欄位資訊的類型（從 API 返回的格式）
export interface ColumnInfo {
    column: string;
    suggested_type: string;
    missing_pct?: string | number;
    outlier_pct?: string | number;
    unique_count?: number;
    missing_count?: number;
    sample_values?: (string | number | null)[];
}

// 定義欄位類型的簡化版本
export interface ColumnType {
    column: string;
    suggested_type: string;
}

// 定義分析結果的類型
export interface AnalysisResult {
    success: boolean;
    columns?: ColumnInfo[];
    error?: string;
}

export function useColumnAnalysis() {
    const { getToken } = useAuth();

    // 從 Zustand store 獲取狀態和方法
    const columnProfile = useAnalysisStore(state => state.columnProfile);
    const columnsPreview = useAnalysisStore(state => state.columnsPreview);  // 加入 columnsPreview
    const showPreview = useAnalysisStore(state => state.showPreview);
    const columnAnalysisLoading = useAnalysisStore(state => state.columnAnalysisLoading);
    const setColumnProfile = useAnalysisStore(state => state.setColumnProfile);
    const setColumnsPreview = useAnalysisStore(state => state.setColumnsPreview);  // 加入 setter
    const setShowPreview = useAnalysisStore(state => state.setShowPreview);
    const setColumnAnalysisLoading = useAnalysisStore(state => state.setColumnAnalysisLoading);

    const convertToColumnProfile = (columns: ColumnInfo[]): ColumnProfile[] => {
        // 確保 columns 不是 undefined 或 null
        if (!columns || !Array.isArray(columns)) {
            return [];
        }
        
        return columns.map(col => ({
            column: col.column,
            dataType: col.suggested_type,
            uniqueValues: col.unique_count || 0,
            missingValues: col.missing_count || 0,
            missingPercentage: typeof col.missing_pct === 'string'
                ? parseFloat(col.missing_pct)
                : (col.missing_pct || 0),
            sampleValues: col.sample_values
        }));
    };

    const analyzeColumns = useCallback(async (
        data: DataRow[],
        token?: string,
        setColumnTypes?: (types: ColumnType[]) => void
    ) => {
        setColumnAnalysisLoading(true);

        try {
            // 優先使用傳入的 token，或從 Clerk 取得
            let authToken = token;
            if (!authToken) {
                const tokenResult = await getToken();
                authToken = tokenResult === null ? undefined : tokenResult;
                if (!authToken) {
                    authToken = localStorage.getItem("__session") || "";
                }
            }

            if (!authToken) {
                // 當沒有 token 時，先拋出錯誤，但仍然設置備用方案
                const error = CommonErrors.authTokenMissing();
                
                // 使用備用方案以避免 UI 崩潰
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                const fallbackProfiles = convertToColumnProfile(fallbackColumns);
                setColumnProfile(fallbackProfiles);
                setShowPreview(true);

                if (setColumnTypes) {
                    const fallbackTypesData: ColumnType[] = fallbackColumns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(fallbackTypesData);
                }
                
                throw error;
            }

            console.log("📊 準備分析欄位，資料筆數:", data.length);

            const rawResult = await FileAnalysisService.analyzeColumns(data, authToken);
            const result: AnalysisResult = {
                ...rawResult,
                error: typeof rawResult.error === 'string'
                    ? rawResult.error
                    : rawResult.error
                        ? (rawResult.error.message || String(rawResult.error))
                        : undefined
            };

            if (result.success && result.columns) {
                const profiles = convertToColumnProfile(result.columns);
                setColumnProfile(profiles);

                if (setColumnTypes) {
                    const columnTypesData: ColumnType[] = result.columns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(columnTypesData);
                }
                setShowPreview(true);
            } else {
                // API 返回失敗狀態
                const errorMessage = result.error || 'Column analysis failed';
                
                // 使用備用方案
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                const fallbackProfiles = convertToColumnProfile(fallbackColumns);
                setColumnProfile(fallbackProfiles);
                setShowPreview(true);

                if (setColumnTypes) {
                    const fallbackTypesData: ColumnType[] = fallbackColumns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(fallbackTypesData);
                }
                
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("❌ 欄位分析錯誤:", err);
            
            // 如果還沒有設置備用方案（例如，網路錯誤等其他錯誤）
            if (!columnProfile || columnProfile.length === 0) {
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                const fallbackProfiles = convertToColumnProfile(fallbackColumns);
                setColumnProfile(fallbackProfiles);
                setShowPreview(true);

                if (setColumnTypes) {
                    const fallbackTypesData: ColumnType[] = fallbackColumns.map(col => ({
                        column: col.column,
                        suggested_type: col.suggested_type
                    }));
                    setColumnTypes(fallbackTypesData);
                }
            }

            throw err;
        } finally {
            setColumnAnalysisLoading(false);
        }
    }, [getToken, setColumnProfile, setShowPreview, setColumnAnalysisLoading, columnProfile]);
    
    const retryAnalysis = useCallback(async (
        data: DataRow[],
        setColumnTypes?: (types: ColumnType[]) => void
    ) => {
        if (data.length > 0) {
            await analyzeColumns(data, undefined, setColumnTypes);
        }
    }, [analyzeColumns]);

    const resetColumnAnalysis = useCallback(() => {
        setColumnProfile([]);
        setColumnsPreview([]);  // 重置 columnsPreview
        setShowPreview(false);
        setColumnAnalysisLoading(false);
    }, [setColumnProfile, setColumnsPreview, setShowPreview, setColumnAnalysisLoading]);

    // 返回所有必要的值和方法
    return {
        columnProfile,
        columnsPreview,        // 加入 columnsPreview
        showPreview,
        columnAnalysisLoading,
        analyzeColumns,
        retryAnalysis,
        resetColumnAnalysis,
        setColumnProfile,
        setColumnsPreview,     // 加入 setter
        setShowPreview
    };
}