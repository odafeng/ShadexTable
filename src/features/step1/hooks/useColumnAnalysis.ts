// step1_useColumnAnalysis.ts
import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { CommonErrors } from '@/utils/error';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { ColumnProfile } from '@/stores/analysisStore';

// 定義資料列的類型（與 FileProcessor 保持一致）
export type DataRow = Record<string, string | number | boolean | Date | null>;

// 定義欄位資訊的類型（從 API 返回的格式）
export interface ColumnInfo {
    column: string;
    suggested_type: string;
    missing_pct?: string | number;
    outlier_pct?: string | number;  // 新增
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

    // 從 Zustand store 獲取狀態和方法 - 使用 columnProfile
    const columnProfile = useAnalysisStore(state => state.columnProfile);
    const showPreview = useAnalysisStore(state => state.showPreview);
    const columnAnalysisLoading = useAnalysisStore(state => state.columnAnalysisLoading);
    const setColumnProfile = useAnalysisStore(state => state.setColumnProfile);
    const setShowPreview = useAnalysisStore(state => state.setShowPreview);
    const setColumnAnalysisLoading = useAnalysisStore(state => state.setColumnAnalysisLoading);

    const convertToColumnProfile = (columns: ColumnInfo[]): ColumnProfile[] => {
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
                throw CommonErrors.authTokenMissing();
            }

            console.log("📊 準備分析欄位，資料筆數:", data.length);

            const result: AnalysisResult = await FileAnalysisService.analyzeColumns(data, authToken);

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
                throw new Error('Column analysis failed');
            }
        } catch (err) {
            console.error("❌ 欄位分析錯誤:", err);
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

            throw err;
        } finally {
            setColumnAnalysisLoading(false);
        }
    }, [getToken, setColumnProfile, setShowPreview, setColumnAnalysisLoading]);
    
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
        setShowPreview(false);
        setColumnAnalysisLoading(false);
    }, [setColumnProfile, setShowPreview, setColumnAnalysisLoading]);

    // 返回 columnProfile 相關方法
    return {
        columnProfile,         // 改為 columnProfile
        showPreview,
        columnAnalysisLoading,
        analyzeColumns,
        retryAnalysis,
        resetColumnAnalysis,
        setColumnProfile,      // 改為 setColumnProfile
        setShowPreview
    };
}