"use client";

import { useState, useEffect, ReactNode, lazy, Suspense, useCallback, useMemo, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldAlert, Wand2, RotateCcw, Info, Loader2 } from "lucide-react";
import InlineNotice from "@/components/ui/custom/InlineNotice";
import ActionButton from "@/components/ui/custom/ActionButton";
import ActionButton2 from "@/components/ui/custom/ActionButton2";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// 核心元件 - 立即載入
import Footer from "@/components/shared/Footer";
import Header from "@/components/shared/Header";
import StepNavigator from "@/components/shared/stepNavigator";
import GroupSelect from "@/components/ui/custom/GroupSelect";
import { MultiSelect } from "@/components/ui/custom/multiselect";

// 導入 DEFAULT_ANALYSIS_STEPS (靜態導入)
import { DEFAULT_ANALYSIS_STEPS } from '@/lib/constants';

// 動態載入的元件 - 修正這裡，移除重複的 DEFAULT_ANALYSIS_STEPS 導入
const AnalysisErrorDialog = dynamic(() => import('@/components/ui/custom/AnalysisErrorDialog'), {
    loading: () => null,
});

const AnalysisLoadingModal = dynamic(() => import('@/components/ui/custom/AnalysisLoadingModal'), {
    loading: () => null,
});

const ConfirmTypeMismatchDialog = dynamic(() => import('@/components/ui/custom/ConfirmTypeMismatchDialog'), {
    loading: () => null,
});

const FillSuccessDialog = dynamic(() =>
    import('@/components/ui/custom/SuccessDialog').then(mod => ({
        default: mod.FillSuccessDialog
    })), {
    loading: () => null,
});

// 延遲載入的面板元件
const AdvancedMissingValuePanel = lazy(() =>
    import('@/features/step2/components/AdvancedMissingValuePanel')
);

const VariableVisualizationPanel = lazy(() =>
    import('@/features/step2/components/VariableVisualizationPanel')
);

// Store 和其他必要的 imports
import { useAnalysisStore, type DataRow } from "@/stores/analysisStore";
import { apiClient, post } from "@/lib/apiClient";
import { reportError } from "@/lib/reportError";
import {
    isAppError,
    createError,
    CommonErrors,
    ErrorCode,
    ErrorContext,
    extractErrorMessage
} from "@/utils/error";
import type { AppError } from "@/types/errors";
import {
    buildMissingFillRequest,
    processMissingFillResponse,
    type MissingFillResponse
} from "../types/schemas";
import {
    AnalysisRequestSchema,
    type AnalysisRequest
} from "@/schemas/backend";

// 載入骨架元件
const PanelSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    </div>
);

// 定義 SelectOption 型別
type SelectOption = {
    label: string;
    value: string;
    type?: string;
    disabled?: boolean;
    suffix?: string;
    [x: string]: ReactNode;
};

// 定義 API 回應介面
interface AnalysisApiResponse {
    success: boolean;
    message?: string;
    data: {
        table: DataRow[];
        groupCounts?: Record<string, number>;
    };
}

// 自訂 Hook 來處理資料計算
const useProcessedOptions = (
    allColumns: string[],
    columnsPreview: any[],
    contVars: string[],
    catVars: string[],
    groupVar: string
) => {
    return useMemo(() => {
        const getTypeOf = (col: string) =>
            columnsPreview.find((c) => c.column === col)?.suggested_type ?? "不明";

        const sortByType = (options: SelectOption[]): SelectOption[] => {
            const typeOrder = ["類別變項", "連續變項", "日期變項", "不明"];
            return options.sort((a, b) => {
                const aType = a.type as string || "不明";
                const bType = b.type as string || "不明";
                const aIndex = typeOrder.indexOf(aType);
                const bIndex = typeOrder.indexOf(bType);

                if (aIndex === bIndex) {
                    return a.label.localeCompare(b.label);
                }

                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;

                return aIndex - bIndex;
            });
        };

        const groupOptions = sortByType(
            allColumns.map((col) => ({
                label: col,
                value: col,
                type: getTypeOf(col)
            } as SelectOption))
        );

        const catOptions = sortByType(
            allColumns
                .filter((c) => !contVars.includes(c) && c !== groupVar)
                .map((col) => ({
                    label: col,
                    value: col,
                    type: getTypeOf(col),
                    disabled: col === groupVar,
                    suffix: col === groupVar ? " (已選為分組變項)" : ""
                }))
        );

        const contOptions = sortByType(
            allColumns
                .filter((c) => !catVars.includes(c) && c !== groupVar)
                .map((col) => ({
                    label: col,
                    value: col,
                    type: getTypeOf(col),
                    disabled: col === groupVar,
                    suffix: col === groupVar ? " (已選為分組變項)" : ""
                }))
        );

        return { groupOptions, catOptions, contOptions, getTypeOf };
    }, [allColumns, columnsPreview, contVars, catVars, groupVar]);
};

export default function Step2Page() {
    // State management
    const [loading, setLoading] = useState(false);
    const [fillingMissing, setFillingMissing] = useState(false);
    const [currentError, setCurrentError] = useState<AppError | null>(null);
    const [confirmedWarnings, setConfirmedWarnings] = useState<Set<string>>(new Set());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [showFillSuccessDialog, setShowFillSuccessDialog] = useState(false);
    const [lastFillSummary, setLastFillSummary] = useState<any[]>([]);
    const [lastFillStatistics, setLastFillStatistics] = useState<any>({});
    const [hasJustFilled, setHasJustFilled] = useState(false);

    // 使用 useTransition 來處理非緊急更新
    const [isPending, startTransition] = useTransition();

    // Intersection Observer for lazy loading panels
    const { ref: panelsRef, inView: panelsInView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
        rootMargin: '100px'
    });

    const router = useRouter();
    const { getToken } = useAuth();

    // 從 Zustand store 取得所需的狀態和方法
    const {
        parsedData,
        processedData,
        dataProcessingLog,
        getActiveData,
        setProcessedData,
        updateProcessingLog,
        clearProcessedData,
        groupVar,
        catVars,
        contVars,
        fillNA,
        columnTypes: columnsPreview,
        setGroupVar,
        setCatVars,
        setContVars,
        setFillNA,
        setGroupCounts,
        setResultTable,
    } = useAnalysisStore();

    // 使用 activeData 作為當前操作的資料
    const activeData = getActiveData();
    const allColumns = useMemo(() =>
        activeData.length > 0 ? Object.keys(activeData[0]) : [],
        [activeData]
    );

    // 使用自訂 Hook 來處理選項
    const { groupOptions, catOptions, contOptions, getTypeOf } = useProcessedOptions(
        allColumns,
        columnsPreview,
        contVars,
        catVars,
        groupVar
    );

    // 優化的 callbacks
    const handleFillMissingValues = useCallback(async () => {
        try {
            if (parsedData.length === 0) {
                const error = CommonErrors.insufficientData();
                setCurrentError(error);
                return;
            }

            if (columnsPreview.length === 0) {
                const error = CommonErrors.noValidColumns();
                setCurrentError(error);
                return;
            }

            setFillingMissing(true);

            const token = await getToken();
            if (!token) {
                throw CommonErrors.authTokenMissing();
            }

            const requestData = buildMissingFillRequest(
                parsedData,
                columnsPreview,
                contVars,
                catVars,
                groupVar
            );

            const response = await post<typeof requestData, MissingFillResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/missing_fill`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.GENERAL,
                    correlationId: crypto.randomUUID(),
                }
            );

            if (response.success && response.filled_data) {
                const { filledData, processingLog, statistics } = processMissingFillResponse(response);

                startTransition(() => {
                    setProcessedData(filledData);
                    updateProcessingLog(processingLog);
                    setFillNA(true);
                    setHasJustFilled(true);
                    setLastFillSummary(processingLog.fillSummary || []);
                    setLastFillStatistics(statistics);
                });

                setShowFillSuccessDialog(true);
            } else {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.GENERAL,
                    undefined,
                    { customMessage: response.message || "填補失敗" }
                );
            }

        } catch (error) {
            console.error("填補遺漏值失敗：", error);

            let appError: AppError;
            if (isAppError(error)) {
                appError = error;
            } else if (error instanceof Error) {
                appError = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.GENERAL,
                    undefined,
                    { customMessage: error.message }
                );
            } else {
                appError = CommonErrors.unknownError();
            }

            if (appError.severity === "HIGH" || appError.severity === "CRITICAL") {
                await reportError(appError, {
                    component: "Step2Page",
                    action: "fillMissingValues"
                });
            }

            setCurrentError(appError);
        } finally {
            setFillingMissing(false);
        }
    }, [parsedData, columnsPreview, contVars, catVars, groupVar, getToken,
        setProcessedData, updateProcessingLog, setFillNA]);

    const handleRestoreOriginalData = useCallback(() => {
        startTransition(() => {
            clearProcessedData();
            setFillNA(false);
            setHasJustFilled(false);
        });
        toast.info("已恢復使用原始資料");
    }, [clearProcessedData, setFillNA]);

    const isValid = useMemo(() =>
        catVars.length > 0 || contVars.length > 0,
        [catVars, contVars]
    );

    // 優化其他 handlers...
    const triggerWarning = useCallback((message: string, col: string) => {
        if (!confirmedWarnings.has(col)) {
            setShowConfirmDialog(true);
            setConfirmMessage(message);
        }
    }, [confirmedWarnings]);

    const handleGroupChange = useCallback((val: string) => {
        startTransition(() => {
            setGroupVar(val);
            if (catVars.includes(val)) {
                setCatVars(catVars.filter(v => v !== val));
            }
            if (contVars.includes(val)) {
                setContVars(contVars.filter(v => v !== val));
            }
        });

        const type = getTypeOf(val);
        if (val && type !== "類別變項" && !confirmedWarnings.has(val)) {
            triggerWarning("⚠️ 建議選擇類別型欄位作為分組變項，目前選取的欄位系統判定非類別型。", val);
        }
    }, [catVars, contVars, confirmedWarnings, getTypeOf, setCatVars, setContVars,
        setGroupVar, triggerWarning]);

    const handleCatChange = useCallback((vals: string[]) => {
        const filteredVals = vals.filter(v => v !== groupVar);
        const newlyAdded = filteredVals.filter(v => !catVars.includes(v));

        newlyAdded.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "連續變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️系統判定${v} 為 ${type}，請務必再次確認以免後續分析錯誤`, v);
            }
        });

        startTransition(() => {
            setCatVars(filteredVals);
        });
    }, [catVars, groupVar, confirmedWarnings, getTypeOf, setCatVars, triggerWarning]);

    const handleContChange = useCallback((vals: string[]) => {
        const filteredVals = vals.filter(v => v !== groupVar);
        const newlyAdded = filteredVals.filter(v => !contVars.includes(v));

        newlyAdded.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "類別變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️ ${v} 為 ${type}，請務必再次確認以免後續分析錯誤。`, v);
            }
        });

        startTransition(() => {
            setContVars(filteredVals);
        });
    }, [contVars, groupVar, confirmedWarnings, getTypeOf, setContVars, triggerWarning]);

    const hasTypeMismatch = useCallback(() => {
        const checkMismatch = (selected: string[], expectedType: string) =>
            selected.some((v) => getTypeOf(v) !== expectedType);

        if (groupVar && getTypeOf(groupVar) !== "類別變項") return true;
        if (checkMismatch(catVars, "類別變項")) return true;
        if (checkMismatch(contVars, "連續變項")) return true;
        return false;
    }, [catVars, contVars, groupVar, getTypeOf]);

    const runAnalysis = useCallback(async () => {
        setLoading(true);
        setCurrentError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw CommonErrors.authTokenMissing();
            }

            const requestBody: AnalysisRequest = {
                data: activeData,
                group_col: groupVar,
                cat_vars: catVars,
                cont_vars: contVars,
                fillNA,
                enableExport: null,
                enableAI: null
            };

            const validatedRequest = AnalysisRequestSchema.parse(requestBody);

            const response = await post<AnalysisRequest, AnalysisApiResponse>(
                `${process.env.NEXT_PUBLIC_API_URL}/api/table/table-analyze`,
                validatedRequest,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    context: ErrorContext.GENERAL,
                    correlationId: crypto.randomUUID(),
                }
            );

            if (!response.success) {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.GENERAL,
                    undefined,
                    { customMessage: response.message || "分析失敗" }
                );
            }

            setResultTable(response.data.table);

            if (response.data.groupCounts) {
                setGroupCounts(response.data.groupCounts);
            }

        } catch (error) {
            console.error("⚠️ 分析失敗：", error);

            let appError: AppError;
            if (isAppError(error)) {
                appError = error;
            } else if (error instanceof Error) {
                appError = createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.GENERAL,
                    undefined,
                    { customMessage: error.message }
                );
            } else {
                appError = CommonErrors.analysisFailed();
            }

            if (appError.severity === "HIGH" || appError.severity === "CRITICAL") {
                await reportError(appError, {
                    component: "Step2Page",
                    action: "runAnalysis",
                    variables: {
                        groupVar,
                        catVarsCount: catVars.length,
                        contVarsCount: contVars.length,
                    }
                });
            }

            setCurrentError(appError);
            setLoading(false);
        }
    }, [activeData, catVars, contVars, fillNA, getToken, groupVar,
        setGroupCounts, setResultTable]);

    const handleAnalyze = useCallback(async () => {
        if (!isValid) {
            const error = CommonErrors.noVariablesSelected("請至少選擇一個類別變項或連續變項");
            setCurrentError(error);
            return;
        }

        if (hasTypeMismatch()) {
            setShowConfirmDialog(true);
            setConfirmMessage("部份您指定的變項類型和系統判定不一致，請務必確認後再繼續分析。");
            return;
        }

        await runAnalysis();
    }, [isValid, hasTypeMismatch, runAnalysis]);

    const handleAnalysisComplete = useCallback(() => {
        setLoading(false);
        router.push("/step3");
    }, [router]);

    const handleCloseFillSuccessDialog = useCallback(() => {
        setShowFillSuccessDialog(false);
    }, []);

    // 預載圖片
    useEffect(() => {
        const images = [
            '/step2/sparkles_icon@2x.png',
            '/step2/sparkles_icon_white.png',
            '/step2/sparkles_icon_gray.png'
        ];

        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    // 重導向檢查
    useEffect(() => {
        if (parsedData.length === 0) {
            router.push("/step1");
        }
    }, [parsedData, router]);

    return (
        <div className="bg-white min-h-screen">
            <Header />
            <div className="container-custom pt-[70px] lg:pt-[110px] pb-2 lg:pb-45">
                <StepNavigator />
                <h2 className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4 leading-[42px] tracking-[3px] text-[#0F2844] font-normal">
                    Step2：選擇變項
                </h2>

                <div className="space-y-6">
                    {/* 上方區塊：變項選擇 - 優先載入 */}
                    <div className="flex flex-col lg:flex-row gap-6 mt-4 lg:mt-8">
                        <div className="flex-1">
                            <label className="block mb-2 text-[20px] tracking-[2px] leading-[32px] font-bold text-[#555555]">
                                分組變項⋯
                            </label>
                            <GroupSelect
                                options={groupOptions}
                                selected={groupVar}
                                onChange={handleGroupChange}
                                placeholder="選擇變項"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-2 text-[20px] tracking-[2px] leading-[32px] font-bold text-[#555555]">
                                類別變項⋯
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="ml-1 text-gray-400 cursor-default">ⓘ</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>請指定要納入結果表中的類別變項欄位（如性別、分期等）</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </label>
                            <MultiSelect
                                options={catOptions}
                                selected={catVars}
                                onChange={handleCatChange}
                                placeholder="選擇變項"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block mb-2 text-[20px] tracking-[2px] leading-[32px] font-bold text-[#555555]">
                                連續變項⋯
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="ml-1 text-gray-400 cursor-default">ⓘ</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>請指定要納入結果表中的連續變項欄位（如年齡、檢驗值等）</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </label>
                            <MultiSelect
                                options={contOptions}
                                selected={contVars}
                                onChange={handleContChange}
                                placeholder="選擇變項"
                            />
                        </div>
                    </div>

                    {/* 警告訊息 */}
                    {parsedData.length > 0 && (
                        <InlineNotice
                            type="error"
                            icon={<ShieldAlert className="w-4 h-4 text-[#DC2626] mt-0" />}
                            className="text-[16px] leading-[24px] sm:text-[20px] sm:leading-[26px]"
                        >
                            <span className="text-[#DC2626] font-semibold">注意：</span>
                            目前系統不支援 <span className="font-semibold text-[#DC2626]">配對 (paired)</span> 分析
                        </InlineNotice>
                    )}

                    {/* 遺漏值填補區塊 */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Info className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-700 font-medium">遺漏值處理</span>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-xs text-gray-500 cursor-help">智慧填補策略說明</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-sm">
                                        <div className="space-y-2 p-1">
                                            <p className="font-medium">系統自動判斷策略：</p>
                                            <ul className="text-sm space-y-1">
                                                <li>• 遺漏值 &lt; 10%：平均數/中位數/眾數</li>
                                                <li>• 遺漏值 10-20%：KNN 演算法</li>
                                                <li>• 遺漏值 &gt; 20%：刪除欄位</li>
                                            </ul>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="flex items-center gap-4">
                            <ActionButton
                                text={fillingMissing ? '處理中...' : '一鍵填補遺漏值'}
                                onClick={handleFillMissingValues}
                                disabled={fillingMissing || parsedData.length === 0 || isPending}
                                loading={fillingMissing}
                                icon={Wand2}
                                className="min-w-[200px]"
                            />

                            {processedData && (
                                <ActionButton2
                                    text="還原原始資料"
                                    onClick={handleRestoreOriginalData}
                                    icon={RotateCcw}
                                    className="min-w-[160px]"
                                    disabled={isPending}
                                />
                            )}
                        </div>

                        {processedData && dataProcessingLog.missingFilled && (
                            <div className="mt-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>已完成遺漏值處理 - {dataProcessingLog.affectedColumns.length} 個欄位已處理</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 下方兩個面板 - 使用 Intersection Observer 延遲載入 */}
                    <div ref={panelsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-[400px]">
                        {panelsInView ? (
                            <>
                                <Suspense fallback={<PanelSkeleton />}>
                                    <AdvancedMissingValuePanel key={processedData ? 'processed' : 'original'} />
                                </Suspense>

                                <Suspense fallback={<PanelSkeleton />}>
                                    <VariableVisualizationPanel />
                                </Suspense>
                            </>
                        ) : (
                            <>
                                <PanelSkeleton />
                                <PanelSkeleton />
                            </>
                        )}
                    </div>

                    {/* 分析按鈕 */}
                    <div className="flex justify-center pt-4 pb-10 lg:pb-24">
                        <ActionButton
                            text={loading ? "分析中..." : "開始分析"}
                            onClick={handleAnalyze}
                            disabled={!isValid || loading || fillingMissing || isPending}
                            loading={loading}
                            loadingText="分析中..."
                            iconSrc="/step2/sparkles_icon_white.png"
                            iconHoverSrc="/step2/sparkles_icon@2x.png"
                            iconGraySrc="/step2/sparkles_icon_gray.png"
                            className="w-[260px] h-[50px] text-[20px] tracking-[2px] leading-[35px] border-[#0F2844] text-white hover:bg-[#0F2844] hover:[#0F2844]"
                        />
                    </div>
                </div>
            </div>
            <Footer />

            {/* 動態載入的對話框元件 */}
            {currentError && (
                <AnalysisErrorDialog
                    open={!!currentError}
                    onClose={() => setCurrentError(null)}
                    message={currentError?.userMessage || ""}
                />
            )}

            {showFillSuccessDialog && (
                <FillSuccessDialog
                    open={showFillSuccessDialog}
                    onClose={handleCloseFillSuccessDialog}
                    fillSummary={lastFillSummary}
                    statistics={lastFillStatistics}
                />
            )}

            {showConfirmDialog && (
                <ConfirmTypeMismatchDialog
                    open={showConfirmDialog}
                    onCancel={() => {
                        let matchedCol = null;
                        const currentColumns = [groupVar, ...catVars, ...contVars].filter(Boolean);
                        for (const col of currentColumns) {
                            if (confirmMessage.includes(col)) {
                                matchedCol = col;
                                break;
                            }
                        }

                        if (!matchedCol) {
                            matchedCol = allColumns.find((col) => confirmMessage.includes(col));
                        }

                        if (matchedCol) {
                            setConfirmedWarnings((prev) => new Set(prev).add(matchedCol));
                        }

                        setShowConfirmDialog(false);
                        setConfirmMessage("");
                    }}
                    onConfirm={() => {
                        let matchedCol = null;
                        const currentColumns = [groupVar, ...catVars, ...contVars].filter(Boolean);
                        for (const col of currentColumns) {
                            if (confirmMessage.includes(col)) {
                                matchedCol = col;
                                break;
                            }
                        }

                        if (!matchedCol) {
                            matchedCol = allColumns.find((col) => confirmMessage.includes(col));
                        }

                        if (matchedCol) {
                            setConfirmedWarnings((prev) => new Set(prev).add(matchedCol));
                        }

                        setShowConfirmDialog(false);
                        setConfirmMessage("");
                    }}
                    message={confirmMessage}
                />
            )}

            {loading && (
                <AnalysisLoadingModal
                    isOpen={loading}
                    steps={DEFAULT_ANALYSIS_STEPS}
                    onComplete={handleAnalysisComplete}
                    autoStart={true}
                />
            )}
        </div>
    );
}