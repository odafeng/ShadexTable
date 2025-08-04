"use client";

import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import { useState, useEffect } from "react";
import Image from "next/image";
import { MultiSelect } from "@/components/ui/custom/multiselect";
import GroupSelect from "@/components/ui/custom/GroupSelect";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import { useAuth } from "@clerk/nextjs";
import AnalysisErrorDialog from "@/components/AnalysisErrorDialog";
import ConfirmTypeMismatchDialog from "@/components/ConfirmTypeMismatchDialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Siren, ShieldAlert } from "lucide-react";
import InlineNotice from "@/components/InlineNotice"
import ActionButton from "@/components/ActionButton";

export default function Step2Page() {
    const [isHover, setIsHover] = useState(false);
    const [catVars, setCatVars] = useState<string[]>([]);
    const [contVars, setContVars] = useState<string[]>([]);
    const [groupVar, setGroupVar] = useState<string>("");
    const [pointCost, setPointCost] = useState(1);
    const [userPoints, setUserPoints] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [confirmedWarnings, setConfirmedWarnings] = useState<Set<string>>(new Set());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");

    const router = useRouter();
    const { getToken } = useAuth();
    const {
        parsedData,
        setGroupVar: setCtxGroupVar,
        setCatVars: setCtxCatVars,
        setContVars: setCtxContVars,
        setGroupCounts,
        fillNA,
        setFillNA,
        setResultTable,
        columnTypes: columnsPreview,
    } = useAnalysis();

    const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    const getTypeOf = (col: string) => columnsPreview.find((c) => c.column === col)?.suggested_type ?? "不明";

    // 排序函數：按照 suggested_type 排序
    const sortByType = (options: any[]) => {
        const typeOrder = ["類別變項", "連續變項", "日期變項", "不明"];
        return options.sort((a, b) => {
            const aIndex = typeOrder.indexOf(a.type);
            const bIndex = typeOrder.indexOf(b.type);

            // 如果類型相同，按字母順序排列
            if (aIndex === bIndex) {
                return a.label.localeCompare(b.label);
            }

            // 如果類型不在排序列表中，放到最後
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;

            return aIndex - bIndex;
        });
    };

    const groupOptions = sortByType(
        allColumns.map((col) => ({ label: col, value: col, type: getTypeOf(col) }))
    );

    const catOptions = sortByType(
        allColumns
            .filter((c) => !contVars.includes(c) && c !== groupVar) // 排除已選為連續變項和分組變項的欄位
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
            .filter((c) => !catVars.includes(c) && c !== groupVar) // 排除已選為類別變項和分組變項的欄位
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
            setWarningMessage(message);
            setShowWarning(true);
        }
    };

    const handleGroupChange = (val: string) => {
        // 如果選擇了新的分組變項，需要清除該變項在類別/連續變項中的選擇
        const prevGroupVar = groupVar;
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
        if (val && type !== "類別變項") {
            triggerWarning("⚠️ 建議選擇類別型欄位作為分組變項，目前選取的欄位系統判定非類別型。", val);
        }
    };

    const handleCatChange = (vals: string[]) => {
        // 過濾掉分組變項，防止被意外選中
        const filteredVals = vals.filter(v => v !== groupVar);

        filteredVals.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "連續變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️系統判定${v} 為 ${type}，請務必再次確認以免後續分析錯誤`, v);
            }
        });
        setCatVars(filteredVals);
    };

    const handleContChange = (vals: string[]) => {
        // 過濾掉分組變項，防止被意外選中
        const filteredVals = vals.filter(v => v !== groupVar);

        filteredVals.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "類別變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️ ${v} 為 ${type}，請務必再次確認以免後續分析錯誤。`, v);
            }
        });
        setContVars(filteredVals);
    };

    useEffect(() => {
        if (!groupVar) {
            setPointCost(1);
        } else {
            const groups = parsedData.map((row) => row[groupVar]).filter((v) => v !== undefined && v !== null && v !== "");
            const uniqueGroups = Array.from(new Set(groups));
            if (uniqueGroups.length <= 1) {
                setPointCost(1);
            } else if (uniqueGroups.length === 2) {
                setPointCost(2);
            } else {
                setPointCost(3);
            }
        }
    }, [groupVar, parsedData]);

    useEffect(() => {
        const fetchPoints = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    console.error("❌ 無法獲得 token");
                    return;
                }

                const res = await fetch(`${API_URL}/api/account/user/me/points`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    console.error("❌ 獲取用戶點數失敗:", res.status);
                    return;
                }

                const json = await res.json();
                setUserPoints(json.points);
                console.log("✅ 用戶點數:", json.points);
            } catch (err) {
                console.error("❌ 獲取點數錯誤:", err);
            }
        };
        fetchPoints();
    }, [getToken, API_URL]);

    const hasTypeMismatch = () => {
        const checkMismatch = (selected: string[], expectedType: string) =>
            selected.some((v) => getTypeOf(v) !== expectedType);

        if (groupVar && getTypeOf(groupVar) !== "類別變項") return true;
        if (checkMismatch(catVars, "類別變項")) return true;
        if (checkMismatch(contVars, "連續變項")) return true;
        return false;
    };

    const handleAnalyze = async () => {
        console.log("🚀 開始分析流程...");
        console.log("📊 分析參數:", {
            groupVar,
            catVars,
            contVars,
            fillNA,
            isValid,
            hasTypeMismatch: hasTypeMismatch()
        });

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
        console.log("🔬 執行分析...");

        // 更新 context 狀態
        setCtxGroupVar(groupVar);
        setCtxCatVars(catVars);
        setCtxContVars(contVars);
        setLoading(true);
        setErrorMsg(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error("授權失敗，請重新登入");
            }

            console.log("📡 呼叫分析 API...");
            console.log("API URL:", `${API_URL}/api/table/analyze`);

            const requestBody = {
                data: parsedData,
                group_col: groupVar, // 注意：後端使用 group_col，不是 groupVar
                cat_vars: catVars,
                cont_vars: contVars,
                fillNA,
            };

            console.log("📤 請求內容:", {
                ...requestBody,
                data: `${parsedData.length} rows`
            });

            const res = await fetch(`${API_URL}/api/table/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            console.log("📄 API 回應狀態:", res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ API 錯誤詳情:", errorText);

                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.detail || errorJson.message || `API 錯誤: ${res.status}`);
                } catch (parseError) {
                    throw new Error(`API 錯誤 ${res.status}: ${errorText}`);
                }
            }

            const result = await res.json();
            console.log("✅ 分析結果:", result);

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

            console.log("📊 設置分析結果...");
            setResultTable(result.data.table);

            if (result.data.groupCounts) {
                setGroupCounts(result.data.groupCounts);
                console.log("👥 群組計數:", result.data.groupCounts);
            }

            console.log("🎯 跳轉到 Step3...");
            router.push("/step3_v3");

        } catch (err: any) {
            console.error("❌ 分析失敗：", err);
            const errorMessage = err?.message || err?.toString() || "未知錯誤";
            setErrorMsg(`分析失敗: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parsedData.length === 0) {
            console.log("📍 沒有資料，重導向到 Step1");
            router.push("/step1_v2");
        }
    }, [parsedData, router]);

    return (
        <>
            {/* 預先載入ICON圖片 */}
            <div>
                <img
                    src="/step2/sparkles_icon@2x.png"
                    alt="preload"
                    width={1}
                    height={1}
                    style={{ display: "none" }}
                />
                <img
                    src="/step2/sparkles_icon_white.png"
                    alt="preload"
                    width={1}
                    height={1}
                    style={{ display: "none" }}
                />
                <img
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
                                {parsedData.length > 0 && (
                                    <>
                                        {/* 積分提示 */}
                                        <InlineNotice
                                            type="warn"
                                            icon={<Siren className="w-4 h-4 text-[#E4A700] mt-[2px]" />}
                                            className="text-[14px] leading-[24px] sm:text-[15px] sm:leading-[26px]"
                                        >
                                            免費模式開放中
                                        </InlineNotice>

                                        <InlineNotice
                                            type="error"
                                            icon={<ShieldAlert className="w-4 h-4 text-[#DC2626] mt-[2px]" />}
                                            className="text-[14px] leading-[24px] sm:text-[15px] sm:leading-[26px]"
                                        >
                                            <span className="text-[#DC2626] font-semibold">注意：</span>
                                            目前系統不支援 <span className="font-semibold text-[#DC2626]">配對 (paired)</span> 分析
                                        </InlineNotice>
                                    </>
                                )}
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
                                                <p>多選一或多個類別型欄位（如性別、分期等）</p>
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
                                                <p>多選一或多個數值欄位（如年齡、檢驗值等）</p>
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
                                disabled={!isValid || loading || (userPoints !== null && userPoints < pointCost)}
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

                <AnalysisErrorDialog
                    open={!!errorMsg || showWarning}
                    onClose={() => {
                        if (warningMessage) {
                            const matchedCol = allColumns.find((col) => warningMessage.includes(col));
                            if (matchedCol) {
                                setConfirmedWarnings((prev) => new Set(prev).add(matchedCol));
                            }
                            setWarningMessage("");
                            setShowWarning(false);
                        } else {
                            setErrorMsg(null);
                        }
                    }}
                    message={errorMsg || warningMessage}
                />

                <ConfirmTypeMismatchDialog
                    open={showConfirmDialog}
                    onCancel={() => setShowConfirmDialog(false)}
                    onConfirm={() => {
                        setShowConfirmDialog(false);
                        runAnalysis();
                    }}
                    message={confirmMessage}
                />
            </div>
        </>
    );
}