// step2/VariableVisualizationPanel.tsx
"use client";

import { useState, useMemo, JSX } from "react";

import { useAuth } from "@clerk/nextjs";
import { BarChart3, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// 引入型別定義

// 引入子元件
import BarplotChart from '@/features/step2/components/BarplotChart';
import BoxplotChart from '@/features/step2/components/BoxplotChart';
import DateVariablePlaceholder from '@/features/step2/components/DateVariablePlaceholder';
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

export default function VariableVisualizationPanel() {
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

    // 取得所有可用變項
    const availableVariables = useMemo<VariableInfo[]>(() => {
        if (!parsedData || parsedData.length === 0) return [];

        const allColumns = Object.keys(parsedData[0]);
        return allColumns.map(col => {
            const columnInfo = columnTypes.find(c => c.column === col);
            let type = "unknown";

            // 優先使用明確分類的變項
            if (contVars.includes(col)) {
                type = "continuous";
            } else if (catVars.includes(col)) {
                type = "categorical";
            } else if (columnInfo?.suggested_type) {
                // 使用建議類型作為後備
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

    // 處理變項選擇變更
    const handleVariableChange = async (varName: string): Promise<void> => {
        setSelectedVariable(varName);
        setError(null);

        if (!varName) {
            setPlotData(null);
            return;
        }

        const variable = availableVariables.find(v => v.name === varName);
        if (!variable) return;

        // 如果是日期變項，顯示優雅的提示而不是發送 API 請求
        if (variable.type === "date") {
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
                setPlotData(response);
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
    };

    // 渲染圖表
    const renderChart = (): JSX.Element | null => {
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
    };

    // 取得變項圖示
    const getVariableIcon = (type: string): JSX.Element | null => {
        switch (type) {
            case "continuous": return <TrendingUp className="w-3 h-3" />;
            case "categorical": return <BarChart3 className="w-3 h-3" />;
            case "date": return <Calendar className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="w-5 h-5 text-[#0F2844]" />
                    變項視覺化
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Select value={selectedVariable} onValueChange={handleVariableChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="選擇要視覺化的變項" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableVariables.map((variable) => (
                                <SelectItem key={variable.name} value={variable.name}>
                                    <div className="flex items-center gap-2">
                                        {getVariableIcon(variable.type)}
                                        <span>{variable.name}</span>
                                        {variable.isGroupVar && (
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                                                分組
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-[#0F2844]" />
                        </div>
                    )}

                    {error && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <AlertDescription className="text-red-700">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isLoading && !error && plotData && renderChart()}

                    {!selectedVariable && !isLoading && (
                        <div className="text-center py-8 text-gray-400">
                            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-xs">請選擇變項以查看分布圖</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}