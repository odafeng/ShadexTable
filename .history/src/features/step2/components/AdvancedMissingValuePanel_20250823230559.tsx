// AdvancedMissingValuePanel.tsx - 優化版本
"use client";

import { useState, useEffect, useMemo, useCallback, memo, useTransition } from "react";

import { useAuth } from "@clerk/nextjs";
import { Info, AlertTriangle, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActionButton2 from "@/components/ui/custom/ActionButton2";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MissingFillStrategy, SelfDefinedMissingFillRequest } from "@/features/step2/types/schemas";
import { post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import { useAnalysisStore, type DataRow, type ColumnInfo } from "@/stores/analysisStore";
import { createError, ErrorCode, ErrorContext, isAppError, extractErrorMessage } from "@/utils/error";

// 定義介面
interface MissingColumnInfo {
    column: string;
    missingCount: number;
    missingPercentage: number;
    dataType: string;
    selectedStrategy: string;
}

// 填補策略對應表
const FILL_STRATEGIES = {
    continuous: [
        { value: "mean", label: "平均值填補" },
        { value: "median", label: "中位數填補" },
        { value: "knn", label: "KNN填補" },
        { value: "delete_column", label: "刪除欄位" },
    ],
    categorical: [
        { value: "mode", label: "眾數填補" },
        { value: "delete_column", label: "刪除欄位" },
    ],
    date: [
        { value: "mode", label: "眾數填補" },
        { value: "delete_column", label: "刪除欄位" },
    ],
    unknown: [
        { value: "delete_column", label: "刪除欄位" },
    ],
};

// 資料類型配置
const TYPE_CONFIG = {
    continuous: { label: "連續型", className: "bg-blue-50 text-blue-700 border-blue-200" },
    categorical: { label: "類別型", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    date: { label: "日期型", className: "bg-purple-50 text-purple-700 border-purple-200" },
    unknown: { label: "未知", className: "bg-gray-50 text-gray-600 border-gray-200" }
};

// 定義標準回應類型
interface StandardResponseWithFillData {
    success: boolean;
    message?: string;
    error_code?: number;
    filled_data?: DataRow[];
    summary?: Array<{
        column: string;
        before_pct: string;
        after_pct: string;
        fill_method: string;
    }>;
    statistics?: Record<string, unknown>;
    processing_details?: Array<Record<string, unknown>>;
}

// 使用 memo 優化元件
const AdvancedMissingValuePanel = memo(function AdvancedMissingValuePanel() {
    const { getToken } = useAuth();
    const { 
        parsedData, 
        processedData,
        getActiveData,
        columnTypes,
        catVars,
        contVars,
        setProcessedData,
        setIsLoading,
        addError,
        clearErrors,
        updateProcessingLog
    } = useAnalysisStore();

    const [missingColumns, setMissingColumns] = useState<MissingColumnInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPending, startTransition] = useTransition();

    // 計算遺漏值資訊 - 使用 useMemo 優化
    const calculateMissingInfo = useMemo(() => {
        const activeData = getActiveData();
        if (!activeData || activeData.length === 0) return [];

        const columns = Object.keys(activeData[0]);
        const totalRows = activeData.length;
        const missingInfo: MissingColumnInfo[] = [];

        columns.forEach((col) => {
            let missingCount = 0;
            activeData.forEach((row: DataRow) => {
                const value = row[col];
                if (value === null || value === undefined || value === "" || 
                    (typeof value === "string" && value.trim() === "")) {
                    missingCount++;
                }
            });

            if (missingCount > 0) {
                let dataType = "unknown";
                const columnInfo = columnTypes.find((c: ColumnInfo) => c.column === col);
                if (columnInfo) {
                    const suggestedType = columnInfo.suggested_type;
                    if (suggestedType === "連續變項" || contVars.includes(col)) {
                        dataType = "continuous";
                    } else if (suggestedType === "類別變項" || catVars.includes(col)) {
                        dataType = "categorical";
                    } else if (suggestedType === "日期變項") {
                        dataType = "date";
                    }
                }

                missingInfo.push({
                    column: col,
                    missingCount,
                    missingPercentage: (missingCount / totalRows) * 100,
                    dataType,
                    selectedStrategy: missingCount / totalRows > 0.2 ? "delete_column" : 
                                     dataType === "continuous" ? "mean" : "mode"
                });
            }
        });

        return missingInfo.sort((a, b) => b.missingPercentage - a.missingPercentage);
    }, [getActiveData, columnTypes, catVars, contVars]);

    useEffect(() => {
        startTransition(() => {
            setMissingColumns(calculateMissingInfo);
        });
    }, [calculateMissingInfo]);

    // 更新策略 - 使用 useCallback
    const handleStrategyChange = useCallback((column: string, strategy: string) => {
        startTransition(() => {
            setMissingColumns(prev => 
                prev.map(col => 
                    col.column === column ? { ...col, selectedStrategy: strategy } : col
                )
            );
        });
    }, []);

    // 執行遺漏值填補 - 優化版本
    const handleApplyFill = useCallback(async () => {
        if (missingColumns.length === 0) {
            addError("沒有需要處理的遺漏值");
            return;
        }

        setIsProcessing(true);
        setIsLoading(true, "正在處理遺漏值...");
        clearErrors();

        try {
            const token = await getToken();
            if (!token) {
                throw createError(
                    ErrorCode.AUTH_TOKEN_MISSING,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: "請重新登入" }
                );
            }

            const strategies: MissingFillStrategy[] = missingColumns.map(col => ({
                column: col.column,
                method: col.selectedStrategy as MissingFillStrategy["method"],
                column_type: col.dataType === "continuous" ? "連續變項" : 
                            col.dataType === "categorical" ? "類別變項" : 
                            col.dataType === "date" ? "日期變項" : "不明"
            }));

            const activeData = getActiveData();
            const request: SelfDefinedMissingFillRequest = {
                data: activeData,
                strategies,
                cont_vars: contVars,
                cat_vars: catVars
            };

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const endpoint = `${baseUrl}/api/preprocess/self_defined_missing_fill`;

            const response = await post<SelfDefinedMissingFillRequest, StandardResponseWithFillData>(
                endpoint,
                request,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.ANALYSIS,
                    correlation_id: crypto.randomUUID()
                }
            );

            if (response.success && response.filled_data) {
                startTransition(() => {
                    setProcessedData(response.filled_data ?? null);
                    const { setFillNA } = useAnalysisStore.getState();
                    setFillNA(true);  // 設定 fillNA 為 true
                    
                    const processingLog = {
                        missingFilled: true,
                        fillMethod: 'custom',
                        fillTimestamp: Date.now(),
                        affectedColumns: strategies.map(s => s.column),
                        fillSummary: strategies.map(s => ({
                            column: s.column,
                            before_pct: missingColumns.find(c => c.column === s.column)?.missingPercentage.toFixed(1) + '%' || '0%',
                            after_pct: '0%',
                            fill_method: s.method
                        }))
                    };
                    
                    updateProcessingLog(processingLog);
                    setMissingColumns([]);
                });
                
                if (response.summary) {
                    console.log("處理摘要:", response.summary);
                }
            } else {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: response.message || "遺漏值處理失敗" }
                );
            }
        } catch (error) {
            console.error("遺漏值處理失敗:", error);
            
            let errorMessage = "遺漏值處理失敗，請稍後再試";
            
            if (isAppError(error)) {
                errorMessage = extractErrorMessage(error);
                await reportError(error, {
                    component: "AdvancedMissingValuePanel",
                    action: "handleApplyFill"
                });
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            addError(errorMessage);
        } finally {
            setIsProcessing(false);
            setIsLoading(false);
        }
    }, [missingColumns, getActiveData, contVars, catVars, getToken, 
        setProcessedData, updateProcessingLog, setIsLoading, addError, clearErrors]);

    // 取得嚴重程度標籤
    const getSeverityInfo = useCallback((percentage: number) => {
        if (percentage < 5) return { label: "低", color: "text-green-600" };
        if (percentage < 15) return { label: "中", color: "text-amber-600" };
        return { label: "高", color: "text-red-600" };
    }, []);

    // 計算統計摘要
    const summary = useMemo(() => {
        const activeData = getActiveData();
        const totalMissing = missingColumns.reduce((sum, col) => sum + col.missingCount, 0);
        const totalCells = activeData.length * Object.keys(activeData[0] || {}).length;
        const overallPercentage = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
        
        return {
            affectedColumns: missingColumns.length,
            totalMissing,
            overallPercentage: overallPercentage.toFixed(1)
        };
    }, [missingColumns, getActiveData]);

    return (
        <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-800">
                        進階遺漏值處理
                    </CardTitle>
                    {missingColumns.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>{summary.affectedColumns} 個欄位受影響</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-xs">
                                        <p>總遺漏值：{summary.totalMissing} 筆</p>
                                        <p>整體遺漏率：{summary.overallPercentage}%</p>
                                        {processedData && (
                                            <p className="text-green-500 mt-1">使用處理後的資料</p>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="p-6">
                {missingColumns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Info className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">資料完整</p>
                        <p className="text-xs mt-1">無遺漏值需要處理</p>
                        {processedData && (
                            <p className="text-xs mt-2 text-green-600">已使用填補後的資料</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 警告提示 */}
                        {summary.affectedColumns > 5 && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-medium">注意：多個欄位含有遺漏值</p>
                                    <p className="mt-1">建議仔細檢查資料品質或考慮重新收集資料</p>
                                </div>
                            </div>
                        )}

                        <ScrollArea className="h-[320px] pr-2">
                            <div className="space-y-3">
                                {missingColumns.map((col) => (
                                    <div 
                                        key={col.column} 
                                        className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                    >
                                        {/* 標題行 */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {col.column}
                                                    </span>
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`text-xs px-1.5 py-0 ${TYPE_CONFIG[col.dataType as keyof typeof TYPE_CONFIG]?.className}`}
                                                    >
                                                        {TYPE_CONFIG[col.dataType as keyof typeof TYPE_CONFIG]?.label}
                                                    </Badge>
                                                </div>
                                                
                                                {/* 統計資訊 */}
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span>遺漏：{col.missingCount} / {getActiveData().length} 筆</span>
                                                    <span className={getSeverityInfo(col.missingPercentage).color}>
                                                        嚴重度：{getSeverityInfo(col.missingPercentage).label}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* 百分比標籤 */}
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-gray-700">
                                                    {col.missingPercentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* 進度條與策略選擇 */}
                                        <div className="space-y-3">
                                            <Progress 
                                                value={col.missingPercentage} 
                                                className={`h-1.5 bg-gray-100 ${
                                                    col.missingPercentage < 5 ? "[&>div]:bg-green-500" :
                                                    col.missingPercentage < 15 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
                                                }`}
                                            />
                                            
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">處理策略</span>
                                                <Select
                                                    value={col.selectedStrategy}
                                                    onValueChange={(value) => handleStrategyChange(col.column, value)}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger className="w-40 h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FILL_STRATEGIES[col.dataType as keyof typeof FILL_STRATEGIES]?.map((strategy) => (
                                                            <SelectItem 
                                                                key={strategy.value} 
                                                                value={strategy.value}
                                                                className="text-xs"
                                                            >
                                                                {strategy.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    將處理 {missingColumns.filter(c => c.selectedStrategy !== "delete_column").length} 個欄位，
                                    刪除 {missingColumns.filter(c => c.selectedStrategy === "delete_column").length} 個欄位
                                </div>
                                <ActionButton2
                                    text="執行處理"
                                    onClick={handleApplyFill}
                                    disabled={isProcessing || isPending}
                                    loading={isProcessing}
                                    icon={PlayCircle}
                                    className="!h-[36px] !text-[14px] !tracking-[2px] !px-6"
                                />
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
});

export default AdvancedMissingValuePanel;