// VariableVisualizationPanel.tsx - 優化版本
"use client";

import { useState, useMemo, useCallback, memo, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import dynamic from 'next/dynamic';
import { BarChart3, TrendingUp, Calendar, Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// 動態載入圖表元件
const BarplotChart = dynamic(() => import('./BarplotChart'), {
    loading: () => <ChartSkeleton />,
    ssr: false
});

const BoxplotChart = dynamic(() => import('./BoxplotChart'), {
    loading: () => <ChartSkeleton />,
    ssr: false
});

const DateVariablePlaceholder = dynamic(() => import('./DateVariablePlaceholder'), {
    loading: () => <ChartSkeleton />,
    ssr: false
});

import type {
    FlattenedPlotResponse,
    PlotRequest,
    PlotValue,
    VariableInfo,
    ApiError,
    BoxplotStatistics,
    BarplotStatistics
} from '@/features/step2/types/types';
import { post } from "@/lib/apiClient";
import { useAnalysisStore, type DataRow, type DataValue } from "@/stores/analysisStore";

// 圖表載入骨架
const ChartSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-[350px] w-full" />
        <div className="p-4 bg-gray-50 rounded-lg">
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                ))}
            </div>
        </div>
    </div>
);

// 變數類型配置
const VARIABLE_TYPE_CONFIG = {
    continuous: { 
        label: "連續型", 
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: TrendingUp 
    },
    categorical: { 
        label: "類別型", 
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: BarChart3 
    },
    date: { 
        label: "日期型", 
        className: "bg-purple-50 text-purple-700 border-purple-200",
        icon: Calendar 
    },
    unknown: { 
        label: "未知", 
        className: "bg-gray-50 text-gray-600 border-gray-200",
        icon: Info 
    }
};

// 使用 memo 來優化重新渲染
const VariableVisualizationPanel = memo(function VariableVisualizationPanel() {
    const {
        parsedData,
        columnTypes,
        catVars,
        contVars,
        groupVar
    } = useAnalysisStore();

    const { getToken } = useAuth();

    const [selectedVariable, setSelectedVariable] = useState<string>("");
    const [plotData, setPlotData] = useState<FlattenedPlotResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // 使用 useMemo 優化變數列表計算
    const availableVariables = useMemo<VariableInfo[]>(() => {
        if (!parsedData || parsedData.length === 0) return [];

        const allColumns = Object.keys(parsedData[0]);
        return allColumns.map(col => {
            const columnInfo = columnTypes.find(c => c.column === col);
            let type = "unknown";

            if (contVars.includes(col)) {
                type = "continuous";
            } else if (catVars.includes(col)) {
                type = "categorical";
            } else if (columnInfo?.suggested_type) {
                switch (columnInfo.suggested_type) {
                    case "連續變項":
                        type = "continuous";
                        break;
                    case "類別變項":
                        type = "categorical";
                        break;
                    case "日期變項":
                        type = "date";
                        break;
                    default:
                        if (col === groupVar) {
                            type = "categorical";
                        }
                        break;
                }
            } else if (col === groupVar) {
                type = "categorical";
            }

            return {
                name: col,
                type,
                isGroupVar: col === groupVar
            };
        });
    }, [parsedData, columnTypes, catVars, contVars, groupVar]);

    // 計算統計摘要
    const variableSummary = useMemo(() => {
        const continuous = availableVariables.filter(v => v.type === "continuous").length;
        const categorical = availableVariables.filter(v => v.type === "categorical").length;
        const date = availableVariables.filter(v => v.type === "date").length;
        const unknown = availableVariables.filter(v => v.type === "unknown").length;
        
        return {
            total: availableVariables.length,
            continuous,
            categorical,
            date,
            unknown
        };
    }, [availableVariables]);

    // 優化的變項選擇處理
    const handleVariableChange = useCallback(async (varName: string): Promise<void> => {
        setSelectedVariable(varName);
        setError(null);

        if (!varName) {
            setPlotData(null);
            return;
        }

        const variable = availableVariables.find(v => v.name === varName);
        if (!variable) return;

        // 如果是日期變項，顯示優雅的提示
        if (variable.type === "date") {
            startTransition(() => {
                setPlotData({
                    success: true,
                    message: "日期變項視覺化即將推出",
                    type: "timeline",
                    data: [],
                    metadata: {
                        title: "",
                        x_label: "",
                        y_label: "",
                        variable_type: "date"
                    }
                });
            });
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error("授權失敗，請重新登入");
            }

            // 準備請求資料
            const rawData: PlotValue[] = parsedData.map((row: DataRow) => {
                const value: DataValue = row[varName];
                if (value === undefined || value === null) {
                    return null;
                }
                if (typeof value === 'string' || typeof value === 'number') {
                    return value;
                }
                return String(value);
            });

            const plotRequest: PlotRequest = {
                data: rawData,
                variable_name: varName,
                variable_type: variable.type as "continuous" | "categorical" | "date",
                plot_type: variable.type === "continuous" ? "boxplot" :
                    variable.type === "categorical" ? "barplot" : "timeline"
            };

            const endpoint = plotRequest.plot_type === "boxplot" ? "/boxplot" :
                plotRequest.plot_type === "barplot" ? "/barplot" : "/timeline";

            const response = await post<PlotRequest, FlattenedPlotResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/visualization${endpoint}`,
                plotRequest,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.success && response.type) {
                startTransition(() => {
                    setPlotData(response);
                });
            } else {
                throw new Error(response.message || "無法生成圖表");
            }

        } catch (err: unknown) {
            console.error("繪圖失敗:", err);
            const apiError = err as ApiError;
            if (apiError.response?.data?.message) {
                setError(apiError.response.data.message);
            } else if (apiError.message) {
                setError(apiError.message);
            } else {
                setError("無法生成圖表，請稍後再試");
            }
        } finally {
            setIsLoading(false);
        }
    }, [availableVariables, parsedData, getToken]);

    // 渲染圖表
    const renderChart = useCallback(() => {
        if (!plotData) return null;

        // 處理日期變項
        if (plotData.type === "timeline") {
            return <DateVariablePlaceholder />;
        }

        return (
            <div className="space-y-4">
                {plotData.type === "boxplot" && plotData.statistics && (
                    <BoxplotChart
                        statistics={plotData.statistics as BoxplotStatistics}
                        selectedVariable={selectedVariable}
                    />
                )}

                {plotData.type === "barplot" && plotData.statistics && (
                    <BarplotChart
                        statistics={plotData.statistics as BarplotStatistics}
                        selectedVariable={selectedVariable}
                        data={plotData.data}
                    />
                )}
            </div>
        );
    }, [plotData, selectedVariable]);

    // 取得選中變項的資訊
    const selectedVariableInfo = useMemo(() => {
        return availableVariables.find(v => v.name === selectedVariable);
    }, [availableVariables, selectedVariable]);

    return (
        <Card className="border border-gray-200 shadow-sm h-full">
            <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-800">
                        變項初步視覺化
                    </CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Info className="w-3.5 h-3.5" />
                                    <span>{variableSummary.total} 個變項可視覺化</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs space-y-1">
                                    <p>連續型: {variableSummary.continuous} 個</p>
                                    <p>類別型: {variableSummary.categorical} 個</p>
                                    {variableSummary.date > 0 && <p>日期型: {variableSummary.date} 個</p>}
                                    {variableSummary.unknown > 0 && <p>未知: {variableSummary.unknown} 個</p>}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            
            <CardContent className="pt-0 px-4">
                <div className="space-y-4">
                    {/* 變項選擇器 */}
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 font-medium">選擇變項</label>
                        <Select value={selectedVariable} onValueChange={handleVariableChange}>
                            <SelectTrigger className="w-full h-10 text-sm">
                                <SelectValue placeholder="請選擇要視覺化的變項" />
                            </SelectTrigger>
                            <SelectContent>
                                <ScrollArea className="h-[280px]">
                                    {availableVariables.map((variable) => {
                                        const config = VARIABLE_TYPE_CONFIG[variable.type as keyof typeof VARIABLE_TYPE_CONFIG];
                                        const Icon = config?.icon || Info;
                                        
                                        return (
                                            <SelectItem 
                                                key={variable.name} 
                                                value={variable.name}
                                                className="py-2.5"
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                                                    <span className="flex-1 text-sm">{variable.name}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={`text-xs px-1.5 py-0 ${config?.className || ''}`}
                                                        >
                                                            {config?.label || '未知'}
                                                        </Badge>
                                                        {variable.isGroupVar && (
                                                            <Badge 
                                                                variant="outline"
                                                                className="text-xs px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                                                            >
                                                                分組
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </ScrollArea>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 選中變項資訊 */}
                    {selectedVariableInfo && !isLoading && !error && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">當前變項：</span>
                                <span className="font-medium text-gray-700">{selectedVariable}</span>
                                <Badge 
                                    variant="outline" 
                                    className={`text-xs px-1.5 py-0 ${
                                        VARIABLE_TYPE_CONFIG[selectedVariableInfo.type as keyof typeof VARIABLE_TYPE_CONFIG]?.className || ''
                                    }`}
                                >
                                    {VARIABLE_TYPE_CONFIG[selectedVariableInfo.type as keyof typeof VARIABLE_TYPE_CONFIG]?.label || '未知'}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* 圖表區域 */}
                    <ScrollArea className="h-[420px]">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#0F2844]" />
                                </div>
                                <p className="text-sm font-medium text-gray-600">正在生成視覺化...</p>
                                <p className="text-xs text-gray-400 mt-1">請稍候片刻</p>
                            </div>
                        )}

                        {error && (
                            <Alert className="bg-red-50 border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <AlertDescription className="text-red-700 text-sm">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {!isLoading && !error && plotData && renderChart()}

                        {!selectedVariable && !isLoading && (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">尚未選擇變項</p>
                                <p className="text-xs mt-1">請從上方選擇變項以查看分布圖</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
});

export default VariableVisualizationPanel;