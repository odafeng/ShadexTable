"use client";

import { useState, useEffect, useMemo } from "react";
import { useAnalysisStore, type DataRow, type ColumnInfo } from "@/stores/analysisStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, TrendingUp, Hash, Calendar, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiClient } from "@/lib/apiClient";
import type { MissingFillStrategy, SelfDefinedMissingFillRequest } from "@/features/step2/types/schemas";

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
        { value: "mean", label: "平均值填補", description: "使用該欄位的平均值填補遺漏值" },
        { value: "median", label: "中位數填補", description: "使用該欄位的中位數填補遺漏值" },
        { value: "knn", label: "KNN填補", description: "使用K最近鄰演算法預測遺漏值" },
        { value: "delete_column", label: "刪除欄位", description: "移除此欄位" },
    ],
    categorical: [
        { value: "mode", label: "眾數填補", description: "使用最常出現的值填補" },
        { value: "delete_column", label: "刪除欄位", description: "移除此欄位" },
    ],
    date: [
        { value: "mode", label: "眾數填補", description: "使用最常出現的日期填補" },
        { value: "delete_column", label: "刪除欄位", description: "移除此欄位" },
    ],
    unknown: [
        { value: "delete_column", label: "刪除欄位", description: "移除此欄位" },
    ],
};

export default function AdvancedMissingValuePanel() {
    const { 
        parsedData, 
        columnTypes,
        catVars,
        contVars,
        setParsedData,
        setIsLoading,
        addError
    } = useAnalysisStore();

    const [missingColumns, setMissingColumns] = useState<MissingColumnInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // 計算遺漏值資訊
    const calculateMissingInfo = useMemo(() => {
        if (!parsedData || parsedData.length === 0) return [];

        const columns = Object.keys(parsedData[0]);
        const totalRows = parsedData.length;
        const missingInfo: MissingColumnInfo[] = [];

        columns.forEach((col) => {
            let missingCount = 0;
            parsedData.forEach((row: DataRow) => {
                const value = row[col];
                if (value === null || value === undefined || value === "" || 
                    (typeof value === "string" && value.trim() === "")) {
                    missingCount++;
                }
            });

            if (missingCount > 0) {
                // 判斷資料型別
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
    }, [parsedData, columnTypes, catVars, contVars]);

    useEffect(() => {
        setMissingColumns(calculateMissingInfo);
    }, [calculateMissingInfo]);

    // 更新策略
    const handleStrategyChange = (column: string, strategy: string) => {
        setMissingColumns(prev => 
            prev.map(col => 
                col.column === column ? { ...col, selectedStrategy: strategy } : col
            )
        );
    };

    // 執行遺漏值填補
    const handleApplyFill = async () => {
        if (missingColumns.length === 0) {
            addError("沒有需要處理的遺漏值");
            return;
        }

        setIsProcessing(true);
        setIsLoading(true, "正在處理遺漏值...");

        try {
            // 準備請求資料
            const strategies: MissingFillStrategy[] = missingColumns.map(col => ({
                column: col.column,
                method: col.selectedStrategy as MissingFillStrategy["method"],
                column_type: col.dataType === "continuous" ? "連續變項" : 
                            col.dataType === "categorical" ? "類別變項" : 
                            col.dataType === "date" ? "日期變項" : "不明"
            }));

            const request: SelfDefinedMissingFillRequest = {
                data: parsedData,
                strategies,
                cont_vars: contVars,
                cat_vars: catVars
            };

            const response = await apiClient<{ filled_data: DataRow[] }>(
                "/api/preprocess/self_defined_missing_fill",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(request),
                }
            );

            if (response.filled_data) {
                setParsedData(response.filled_data);
                // 重新計算遺漏值資訊
                setMissingColumns([]);
            }
        } catch (error) {
            console.error("遺漏值處理失敗:", error);
            addError("遺漏值處理失敗，請稍後再試");
        } finally {
            setIsProcessing(false);
            setIsLoading(false);
        }
    };

    // 取得型別圖示
    const getTypeIcon = (dataType: string) => {
        switch (dataType) {
            case "continuous": return <TrendingUp className="w-4 h-4 text-blue-500" />;
            case "categorical": return <Hash className="w-4 h-4 text-green-500" />;
            case "date": return <Calendar className="w-4 h-4 text-purple-500" />;
            default: return <HelpCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    // 取得進度條顏色
    const getProgressColor = (percentage: number) => {
        if (percentage < 10) return "bg-green-500";
        if (percentage < 20) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="w-5 h-5 text-[#0F2844]" />
                    進階遺漏值處理
                </CardTitle>
            </CardHeader>
            <CardContent>
                {missingColumns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>無遺漏值需要處理</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {missingColumns.map((col) => (
                                    <div key={col.column} className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(col.dataType)}
                                                <span className="font-medium text-[14px]">{col.column}</span>
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <span className="text-[12px] text-gray-600">
                                                            {col.missingCount} / {parsedData.length} 筆
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>遺漏 {col.missingCount} 筆資料</p>
                                                        <p>佔總資料 {col.missingPercentage.toFixed(1)}%</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>

                                        <div className="mb-2">
                                            <Progress 
                                                value={col.missingPercentage} 
                                                className={`h-2 ${getProgressColor(col.missingPercentage)}`}
                                            />
                                            <span className="text-[11px] text-gray-500">
                                                遺漏率: {col.missingPercentage.toFixed(1)}%
                                            </span>
                                        </div>

                                        <Select
                                            value={col.selectedStrategy}
                                            onValueChange={(value) => handleStrategyChange(col.column, value)}
                                        >
                                            <SelectTrigger className="h-8 text-[13px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FILL_STRATEGIES[col.dataType as keyof typeof FILL_STRATEGIES]?.map((strategy) => (
                                                    <SelectItem 
                                                        key={strategy.value} 
                                                        value={strategy.value}
                                                    >
                                                        <div>
                                                            <div className="font-medium">{strategy.label}</div>
                                                            <div className="text-[11px] text-gray-500">
                                                                {strategy.description}
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="mt-4 pt-4 border-t">
                            <Button
                                onClick={handleApplyFill}
                                disabled={isProcessing}
                                className="w-full bg-[#0F2844] hover:bg-[#1a3a5c] text-white"
                            >
                                {isProcessing ? "處理中..." : "套用填補策略"}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}