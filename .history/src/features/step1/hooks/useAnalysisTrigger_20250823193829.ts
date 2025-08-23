import { useState, useCallback } from 'react';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { post } from '@/lib/apiClient';
import { reportError } from '@/lib/reportError';
import { useAnalysisStore } from '@/stores/analysisStore';
import type { DataRow, ColumnInfo } from '@/stores/analysisStore';
import { CommonErrors, createError, ErrorCode, ErrorContext } from '@/utils/error';

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

// 定義 StandardResponse 包裝後的響應類型
interface StandardResponseWithFillData {
    success: boolean;
    message: string;
    error_code?: number;
    // 扁平化後的資料欄位
    filled_data?: DataRow[];
    summary?: Array<{
        column: string;
        before_pct: string;
        after_pct: string;
        fill_method: string;
        is_continuous?: boolean;
        is_categorical?: boolean;
    }>;
    statistics?: {
        total_rows: number;
        total_columns: number;
        validated_continuous_vars: string[];
        categorical_vars: string[];
        normality_test_results: Record<string, boolean>;
        fill_methods_used: string[];
    };
}

// 定義欄位資訊類型
interface ColumnData {
    column: string;
    missing_pct: string;
    suggested_type: string;
}

// 定義填補請求類型
interface FillMissingRequest {
    data: DataRow[];
    columns: ColumnData[];
    cont_vars: string[];
    cat_vars: string[];
    group_col: string;
}

// 定義表格分析請求類型
interface TableAnalyzeRequest {
    data: DataRow[];
    group_col: string;
    cat_vars: string[];
    cont_vars: string[];
    fillNA: boolean;
}

// 定義表格分析響應類型
interface TableAnalyzeResponse {
    success: boolean;
    message?: string;
    data?: {
        table?: DataRow[];
        groupCounts?: Record<string, number>;
        [key: string]: unknown;
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
    const groupVar = useAnalysisStore(state => state.groupVar);
    const columnTypes = useAnalysisStore(state => state.columnTypes);
    const setFile = useAnalysisStore(state => state.setFile);
    const setGroupVar = useAnalysisStore(state => state.setGroupVar);
    const setCatVars = useAnalysisStore(state => state.setCatVars);
    const setContVars = useAnalysisStore(state => state.setContVars);
    const setAutoAnalysisResult = useAnalysisStore(state => state.setAutoAnalysisResult);
    const setResultTable = useAnalysisStore(state => state.setResultTable);
    const setGroupCounts = useAnalysisStore(state => state.setGroupCounts);
    const setProcessedData = useAnalysisStore(state => state.setProcessedData);
    const updateProcessingLog = useAnalysisStore(state => state.updateProcessingLog);

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
     * 填補遺漏值
     */
    const fillMissingValues = useCallback(async (
        data: DataRow[],
        columns: ColumnData[],
        catVars: string[],
        contVars: string[],
        token: string,
        correlation_id: string
    ): Promise<DataRow[] | null> => {
        try {
            console.log('🔧 開始填補遺漏值...');
            console.log('  - 資料筆數:', data.length);
            console.log('  - 類別變項:', catVars);
            console.log('  - 連續變項:', contVars);
            console.log('  - 分組變項:', groupVar || '無');

            const response = await post<FillMissingRequest, StandardResponseWithFillData>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/missing_fill`,
                {
                    data: data,
                    columns: columns,
                    cont_vars: contVars,
                    cat_vars: catVars,
                    group_col: groupVar || "",
                    correlation=correlation_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Correlation-ID': correlation_id
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id: correlation_id
                }
            );

            // 除錯：印出完整回應以了解實際結構
            console.log('📦 API 原始回應:', JSON.stringify(response, null, 2));
            
            // 檢查回應結構
            if (response) {
                console.log('回應鍵值:', Object.keys(response));
                console.log('success:', response.success);
                console.log('message:', response.message);
                console.log('filled_data 存在:', !!response.filled_data);
                console.log('filled_data 長度:', response.filled_data?.length);
            }

            // 處理 StandardResponse 扁平化後的結構
            if (response && response.success) {
                if (response.filled_data && response.filled_data.length > 0) {
                    console.log('✅ 遺漏值填補完成');
                    console.log('  - 填補後資料筆數:', response.filled_data.length);

                    // 記錄填補摘要
                    if (response.summary && response.summary.length > 0) {
                        const filledColumns = response.summary.filter(s =>
                            s.fill_method && s.fill_method.includes('填補')
                        );
                        console.log(`  - 填補了 ${filledColumns.length} 個欄位`);

                        // 顯示填補細節
                        filledColumns.forEach(col => {
                            console.log(`    • ${col.column}: ${col.before_pct} → ${col.after_pct} (${col.fill_method})`);
                        });
                    }

                    // 更新處理日誌
                    updateProcessingLog({
                        missingFilled: true,
                        fillMethod: 'auto',
                        fillTimestamp: Date.now(),
                        affectedColumns: response.summary
                            ?.filter(s => s.fill_method && s.fill_method.includes('填補'))
                            .map(s => s.column) || [],
                        fillSummary: response.summary?.map(s => ({
                            column: s.column,
                            before_pct: s.before_pct,
                            after_pct: s.after_pct,
                            fill_method: s.fill_method
                        }))
                    });

                    return response.filled_data;
                } else {
                    console.warn('⚠️ 填補 API 返回成功但沒有資料');
                    console.log('  - filled_data:', response.filled_data);
                    return null;
                }
            } else if (response && !response.success) {
                // 處理 API 返回失敗的情況
                console.error('❌ API 返回失敗:', {
                    success: response.success,
                    message: response.message,
                    error_code: response.error_code
                });
                
                // 如果有錯誤訊息，拋出更具體的錯誤
                const errorMessage = response.message || '遺漏值填補失敗';
                throw new Error(errorMessage);
            }

            console.warn('⚠️ 填補 API 未返回有效資料');
            return null;

        } catch (error) {
            console.error('❌ 遺漏值填補失敗:', error);
            
            // 詳細的錯誤記錄
            if (error instanceof Error) {
                console.error('錯誤詳情:', {
                    message: error.message,
                    stack: error.stack
                });
            }

            // 報告錯誤但不中斷流程
            const appError = createError(
                ErrorCode.ANALYSIS_ERROR,
                ErrorContext.ANALYSIS,
                undefined,
                {
                    customMessage: '遺漏值填補失敗，將使用原始資料繼續分析',
                    cause: error instanceof Error ? error : undefined
                }
            );

            await reportError(appError, {
                action: 'fill_missing_values',
                dataRows: data.length,
                errorDetails: error instanceof Error ? error.message : String(error)
            });

            return null;
        }
    }, [groupVar, updateProcessingLog]);

    /**
     * 計算遺漏值百分比
     */
    const calculateMissingPercentage = useCallback((
        data: DataRow[],
        columnName: string
    ): string => {
        if (data.length === 0) return "0%";

        const missingCount = data.filter(row =>
            row[columnName] === null ||
            row[columnName] === undefined ||
            row[columnName] === '' ||
            (typeof row[columnName] === 'string' && (row[columnName] as string).trim() === '')
        ).length;

        const missingPct = (missingCount / data.length * 100).toFixed(1);
        return `${missingPct}%`;
    }, []);

    /**
     * 處理 AI 全自動分析模式
     */
    const handleAutoAnalyze = useCallback(async (file: File) => {
        if (parsedData.length === 0) {
            throw CommonErrors.fileNotSelected();
        }

        const correlation_id = `auto-analysis-${Date.now()}`;

        console.log('🚀 開始 AI 全自動分析:', {
            correlation_id,
            groupVar: groupVar || '無',
            dataRows: parsedData.length,
            fillNA: fillNA
        });

        setFile(file);
        const token = await getToken();

        if (!token) throw CommonErrors.analysisAuthFailed();

        // 步驟 1：AI 自動分類變項
        console.log('📊 步驟 1：AI 自動分類變項...');
        const rawResult = await FileAnalysisService.performAutoAnalysis(
            parsedData,
            fillNA,
            token,
            groupVar,
            correlation_id
        );
        console.log('✅ 自動分析結果:', rawResult);

        // Ensure error is always an instance of Error
        const result: AutoAnalysisResponse = {
            ...rawResult,
            error: rawResult.error instanceof Error
                ? rawResult.error
                : rawResult.error
                    ? new Error(typeof rawResult.error === 'object' && 'message' in rawResult.error
                        ? (rawResult.error as { message: string }).message
                        : String(rawResult.error))
                    : undefined,
        };

        if (!result.success) {
            throw result.error || new Error('Auto analysis failed');
        }

        // 更新 store 狀態
        setCatVars(result.result?.cat_vars || []);
        setContVars(result.result?.cont_vars || []);

        // 步驟 2：如果需要填補遺漏值
        let dataForAnalysis = parsedData;

        if (fillNA) {
            console.log('📊 步驟 2：填補遺漏值...');

            // 準備欄位資訊
            let columns: ColumnData[] = [];

            // 🔥 修正：正確處理 columnTypes
            if (columnTypes && columnTypes.length > 0) {
                // 如果有 columnTypes，從中提取資訊
                columns = columnTypes.map((col: ColumnInfo) => {
                    // 計算實際的 missing_pct
                    const missingPct = calculateMissingPercentage(parsedData, col.column);

                    return {
                        column: col.column,
                        missing_pct: missingPct,  // 使用計算出的值
                        suggested_type: col.suggested_type ||
                            (result.result?.cat_vars?.includes(col.column) ? '類別變項' :
                                result.result?.cont_vars?.includes(col.column) ? '連續變項' : '不明')
                    };
                });
            } else {
                // 如果沒有 columnTypes，從資料自動生成
                console.log('⚠️ 沒有 columnTypes，自動生成欄位資訊...');
                if (parsedData.length > 0) {
                    const firstRow = parsedData[0];
                    Object.keys(firstRow).forEach(col => {
                        const missingPct = calculateMissingPercentage(parsedData, col);

                        columns.push({
                            column: col,
                            missing_pct: missingPct,
                            suggested_type: result.result?.cat_vars?.includes(col) ? '類別變項' :
                                result.result?.cont_vars?.includes(col) ? '連續變項' : '不明'
                        });
                    });
                }
            }

            console.log('準備的欄位資訊:', columns);

            // 執行填補
            const filledData = await fillMissingValues(
                parsedData,
                columns,
                result.result?.cat_vars || [],
                result.result?.cont_vars || [],
                token,
                correlation_id
            );

            if (filledData) {
                dataForAnalysis = filledData;
                // 更新 store 中的處理後資料
                setProcessedData(dataForAnalysis);
                console.log('✅ 已更新處理後資料到 store');
            } else {
                console.warn('⚠️ 填補失敗，使用原始資料繼續');
            }
        } else {
            console.log('ℹ️ 跳過遺漏值填補（fillNA = false）');
        }

        // 步驟 3：進行表格分析
        console.log('📊 步驟 3：進行表格分析...');
        console.log('  - 使用資料筆數:', dataForAnalysis.length);

        try {
            const tableResponse = await post<TableAnalyzeRequest, TableAnalyzeResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/table/table-analyze`,
                {
                    data: dataForAnalysis,
                    group_col: groupVar || "",
                    cat_vars: result.result?.cat_vars || [],
                    cont_vars: result.result?.cont_vars || [],
                    fillNA: false,
                    correlation_id: correlation_id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Correlation_ID': correlation_id
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id: `table-analysis-${Date.now()}`
                }
            );

            if (tableResponse && tableResponse.success && tableResponse.data) {
                console.log('✅ 表格分析完成');
                setResultTable(tableResponse.data.table || []);

                if (tableResponse.data.groupCounts) {
                    setGroupCounts(tableResponse.data.groupCounts);
                }
            } else {
                console.warn('⚠️ 表格分析未返回有效結果');
            }
        } catch (error) {
            console.error('❌ 表格分析失敗:', error);
            // 即使表格分析失敗，仍然設定自動分析結果
        }

        // 設定自動分析結果
        if (result.result) {
            const autoAnalysisResult = {
                ...result.result,
                group_var: groupVar  // 確保使用使用者指定的值
            };
            setAutoAnalysisResult(autoAnalysisResult);
        } else {
            setAutoAnalysisResult(null);
        }

        // 如果原本的結果有 table，也設定（作為備份）
        if (result.result?.analysis?.table && dataForAnalysis.length === 0) {
            setResultTable(result.result.analysis.table);
        }

        // 如果原本的結果有 groupCounts，也設定（作為備份）
        if (result.result?.analysis?.groupCounts) {
            setGroupCounts(result.result.analysis.groupCounts);
        }

        console.log('🎉 全自動分析完成，跳轉到 Step3');
        router.push("/step3");

    }, [
        parsedData,
        fillNA,
        groupVar,
        columnTypes,
        getToken,
        setFile,
        setCatVars,
        setContVars,
        setAutoAnalysisResult,
        setResultTable,
        setGroupCounts,
        setProcessedData,
        fillMissingValues,
        calculateMissingPercentage,
        router
    ]);

    /**
     * 觸發分析的主函數
     */
    const triggerAnalysis = useCallback(async (file: File | null) => {
        if (!file) {
            throw CommonErrors.fileNotSelected();
        }

        if (autoMode) {
            console.log(`🚀 觸發 AI 全自動分析，分組變項: ${groupVar || '無（將進行整體分析）'}`);
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
        } catch (error) {
            console.error('❌ 分析觸發失敗:', error);

            // 報告錯誤
            const appError = error instanceof Error ?
                createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        customMessage: error.message,
                        cause: error
                    }
                ) : CommonErrors.unknownError();

            await reportError(appError, {
                action: 'trigger_analysis',
                autoMode,
                groupVar
            });

            throw error;
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