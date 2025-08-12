"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import StepNavigator from "@/components/shared/stepNavigator";
import { useState, useEffect, ReactNode } from "react";
import { MultiSelect } from "@/components/ui/custom/MultiSelect";
import GroupSelect from "@/components/ui/custom/GroupSelect";
import { useRouter } from "next/navigation";
import { useAnalysisStore, type DataRow } from "@/stores/analysisStore";
import { useAuth } from "@clerk/nextjs";
import AnalysisErrorDialog from "@/components/ui/custom/AnalysisErrorDialog";
import ConfirmTypeMismatchDialog from "@/components/ui/custom/ConfirmTypeMismatchDialog";
import AnalysisLoadingModal, { DEFAULT_ANALYSIS_STEPS } from "@/components/ui/custom/AnalysisLoadingModal";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldAlert } from "lucide-react";
import InlineNotice from "@/components/ui/custom/InlineNotice"
import ActionButton from "@/components/ui/custom/ActionButton";
import Image from "next/image";

export default function Step2Page() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [confirmedWarnings, setConfirmedWarnings] = useState<Set<string>>(new Set());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");

    const router = useRouter();
    const { getToken } = useAuth();

    // ✅ 直接從 Zustand store 取得所需的狀態和方法
    const {
        parsedData,
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

    const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    const getTypeOf = (col: string) => columnsPreview.find((c) => c.column === col)?.suggested_type ?? "不明";

    // 排序函數：按照 suggested_type 排序
    type SelectOption = {
        label: string;
        value: string;
        type?: string;
        disabled?: boolean;
        suffix?: string;
        [x: string]: ReactNode;
    };

    interface AnalysisApiResponse {
        success: boolean;
        message?: string;
        data: {
            table: DataRow[];
            groupCounts?: Record<string, number>;
        };
    }
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


    const groupOptions: SelectOption[] = sortByType(
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

    const isValid = catVars.length > 0 || contVars.length > 0;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const triggerWarning = (message: string, col: string) => {
        if (!confirmedWarnings.has(col)) {
            setShowConfirmDialog(true);
            setConfirmMessage(message);
        }
    };

    const handleGroupChange = (val: string) => {
        setGroupVar(val);

        // 如果新選的分組變項在類別變項中，移除它
        if (catVars.includes(val)) {
            setCatVars(catVars.filter(v => v !== val));
        }

        // 如果新選的分組變項在連續變項中，移除它
        if (contVars.includes(val)) {
            setContVars(contVars.filter(v => v !== val));
        }

        const type = getTypeOf(val);

        // 只在類型真的不是類別變項且未確認過時才警告
        if (val && type !== "類別變項" && !confirmedWarnings.has(val)) {
            triggerWarning("⚠️ 建議選擇類別型欄位作為分組變項，目前選取的欄位系統判定非類別型。", val);
        }
    };

    const handleCatChange = (vals: string[]) => {
        // 過濾掉分組變項，防止被意外選中
        const filteredVals = vals.filter(v => v !== groupVar);

        // 找出新增的變項（只對新增的變項進行警告檢查）
        const newlyAdded = filteredVals.filter(v => !catVars.includes(v));

        newlyAdded.forEach((v) => {
            const type = getTypeOf(v);
            // 加入 confirmedWarnings 檢查
            if ((type === "連續變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️系統判定${v} 為 ${type}，請務必再次確認以免後續分析錯誤`, v);
            }
        });
        setCatVars(filteredVals);
    };

    const handleContChange = (vals: string[]) => {
        // 過濾掉分組變項，防止被意外選中
        const filteredVals = vals.filter(v => v !== groupVar);

        // 找出新增的變項（只對新增的變項進行警告檢查）
        const newlyAdded = filteredVals.filter(v => !contVars.includes(v));

        newlyAdded.forEach((v) => {
            const type = getTypeOf(v);
            // 加入 confirmedWarnings 檢查
            if ((type === "類別變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️ ${v} 為 ${type}，請務必再次確認以免後續分析錯誤。`, v);
            }
        });
        setContVars(filteredVals);
    };

    const hasTypeMismatch = () => {
        const checkMismatch = (selected: string[], expectedType: string) =>
            selected.some((v) => getTypeOf(v) !== expectedType);

        if (groupVar && getTypeOf(groupVar) !== "類別變項") return true;
        if (checkMismatch(catVars, "類別變項")) return true;
        if (checkMismatch(contVars, "連續變項")) return true;
        return false;
    };

    const handleAnalyze = async () => {
        // 檢查基本驗證
        if (!isValid) {
            setErrorMsg("請至少選擇一個類別變項或連續變項");
            return;
        }

        // 檢查類型不匹配
        if (hasTypeMismatch()) {
            setShowConfirmDialog(true);
            setConfirmMessage("部份您指定的變項類型和系統判定不一致，請務必確認後再繼續分析。");
            return;
        }

        await runAnalysis();
    };

    const runAnalysis = async () => {
        setLoading(true);
        setErrorMsg(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error("授權失敗，請重新登入");
            }

            const requestBody = {
                data: parsedData,
                group_col: groupVar,
                cat_vars: catVars,
                cont_vars: contVars,
                fillNA,
            };

            const res = await fetch(`${API_URL}/api/table/table-analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ API 錯誤詳情:", errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.detail || errorJson.message || `API 錯誤: ${res.status}`);
                } catch {
                    throw new Error(`API 錯誤 ${res.status}: ${errorText}`);
                }
            }

            const result = await res.json() as AnalysisApiResponse;

            // 檢查回應格式
            if (!result.success) {
                throw new Error(result.message || "分析失敗");
            }

            if (!result.data || !result.data.table) {
                throw new Error("API 回應格式異常：缺少 table 資料");
            }

            if (!Array.isArray(result.data.table)) {
                throw new Error("API 回應格式異常：table 不是陣列");
            }

            setResultTable(result.data.table);

            if (result.data.groupCounts) {
                setGroupCounts(result.data.groupCounts);
            }

        } catch (err: unknown) {
            console.error("❌ 分析失敗：", err);
            const errorMessage = (err as Error)?.message || err?.toString() || "未知錯誤";
            setErrorMsg(`分析失敗: ${errorMessage}`);
            setLoading(false);
        }
    };

    const handleAnalysisComplete = () => {
        setLoading(false);
        router.push("/step3");
    };

    useEffect(() => {
        if (parsedData.length === 0) {
            router.push("/step1");
        }
    }, [parsedData, router]);

    return (
        <>
            {/* 預先載入ICON圖片 */}
            <div>
                <Image
                    src="/step2/sparkles_icon@2x.png"
                    alt="preload"
                    width={1}
                    height={1}
                    style={{ display: "none" }}
                />
                <Image
                    src="/step2/sparkles_icon_white.png"
                    alt="preload"
                    width={1}
                    height={1}
                    style={{ display: "none" }}
                />
                <Image
                    src="/step2/sparkles_icon_gray.png"
                    alt="preload"
                    width={1}
                    height={1}
                    style={{ display: "none" }}
                />
            </div>

            <div className="bg-white">
                <Header />
                <div className="container-custom pt-[70px] lg:pt-[110px] pb-2 lg:pb-45">
                    <StepNavigator />
                    <h2 className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4 leading-[42px] tracking-[3px] text-[#0F2844] font-normal">
                        Step2：選擇變項
                    </h2>

                    <div className="space-y-8">
                        <div className="flex flex-col lg:flex-row gap-6 mt-4 lg:mt-8">
                            <div className="flex-1">
                                <label className="block mb-2 text-[20px] tracking-[2px] leading-[32px] font-bold text-[#555555]">
                                    分組變項…
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
                                    類別變項…
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="ml-1 text-gray-400 cursor-default">&#9432;</span>
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
                                    連續變項…
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="ml-1 text-gray-400 cursor-default">&#9432;</span>
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

                        {parsedData.length > 0 && (
                            <>
                                <InlineNotice
                                    type="error"
                                    icon={<ShieldAlert className="w-4 h-4 text-[#DC2626] mt-0" />}
                                    className="text-[16px] leading-[24px] sm:text-[20px] sm:leading-[26px] -mt-4"
                                >
                                    <span className="text-[#DC2626] font-semibold">注意：</span>
                                    目前系統不支援 <span className="font-semibold text-[#DC2626]">配對 (paired)</span> 分析
                                </InlineNotice>
                            </>
                        )}

                        <div className="flex items-center space-x-1">
                            <input
                                type="checkbox"
                                id="fillna"
                                className="w-[25px] h-[25px] rounded-md border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844] cursor-pointer"
                                checked={fillNA}
                                onChange={(e) => setFillNA(e.target.checked)}
                            />
                            <label htmlFor="fillna" className="text-[20px] text-[#555555] tracking-[2px] leading-[32px] font-bold cursor-pointer">
                                填補缺值
                            </label>
                        </div>

                        <div className="flex justify-center pt-4 pb-10 lg:pb-24">
                            <ActionButton
                                text={loading ? "分析中..." : "開始分析"}
                                onClick={handleAnalyze}
                                disabled={!isValid || loading}
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

                {/* AnalysisErrorDialog 只處理真正的錯誤 */}
                <AnalysisErrorDialog
                    open={!!errorMsg}
                    onClose={() => setErrorMsg(null)}
                    message={errorMsg || ""}
                />

                {/* ConfirmTypeMismatchDialog 處理類型不匹配的確認 */}
                {showConfirmDialog && (
                    <ConfirmTypeMismatchDialog
                        open={showConfirmDialog}
                        onCancel={() => {
                            // 找到需要確認的欄位並加入 confirmedWarnings
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
                            // 找到需要確認的欄位並加入 confirmedWarnings
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

                {/* 使用重構後的 AnalysisLoadingModal */}
                <AnalysisLoadingModal
                    isOpen={loading}
                    steps={DEFAULT_ANALYSIS_STEPS}
                    onComplete={handleAnalysisComplete}
                    autoStart={true}
                />
            </div>
        </>
    );
}