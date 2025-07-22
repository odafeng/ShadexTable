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

    const groupOptions = allColumns.map((col) => ({ label: col, value: col, type: getTypeOf(col) }));
    const catOptions = allColumns.filter((c) => !contVars.includes(c)).map((col) => ({ label: col, value: col, type: getTypeOf(col) }));
    const contOptions = allColumns.filter((c) => !catVars.includes(c)).map((col) => ({ label: col, value: col, type: getTypeOf(col) }));
    const [confirmMessage, setConfirmMessage] = useState("");


    const isValid = catVars.length > 0 || contVars.length > 0;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const triggerWarning = (message: string, col: string) => {
        if (!confirmedWarnings.has(col)) {
            setWarningMessage(message);
            setShowWarning(true);
        }
    };

    const handleGroupChange = (val: string) => {
        setGroupVar(val);
        const type = getTypeOf(val);
        if (type !== "類別變項") {
            triggerWarning("⚠️ 建議選擇類別型欄位作為分組變項，目前選取的欄位系統判定非類別型。", val);
        }
    };

    const handleCatChange = (vals: string[]) => {
        vals.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "連續變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️系統判定${v} 為 ${type}，請務必再次確認以免後續分析錯誤`, v);
            }
        });
        setCatVars(vals);
    };

    const handleContChange = (vals: string[]) => {
        vals.forEach((v) => {
            const type = getTypeOf(v);
            if ((type === "類別變項" || type === "日期變項") && !confirmedWarnings.has(v)) {
                triggerWarning(`⚠️ ${v} 為 ${type}，請務必再次確認以免後續分析錯誤。`, v);
            }
        });
        setContVars(vals);
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
            const token = await getToken();
            const res = await fetch(`${API_URL}/user/me/points`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            setUserPoints(json.points);
        };
        fetchPoints();
    }, []);

    const hasTypeMismatch = () => {
        const checkMismatch = (selected: string[], expectedType: string) =>
            selected.some((v) => getTypeOf(v) !== expectedType);

        if (groupVar && getTypeOf(groupVar) !== "類別變項") return true;
        if (checkMismatch(catVars, "類別變項")) return true;
        if (checkMismatch(contVars, "連續變項")) return true;
        return false;
    };

    const handleAnalyze = async () => {
        if (hasTypeMismatch()) {
            setShowConfirmDialog(true);
            setConfirmMessage("部份您指定的變項類型和系統判定不一致，請務必確認後再繼續分析。");
            return;
        }

        runAnalysis();
    };

    const runAnalysis = async () => {
        setCtxGroupVar(groupVar);
        setCtxCatVars(catVars);
        setCtxContVars(contVars);
        setLoading(true);

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: parsedData,
                    groupVar,
                    catVars,
                    contVars,
                    fillNA,
                }),
            });

            const result = await res.json();
            if (!res.ok || !Array.isArray(result.table)) throw new Error(result.detail || "分析失敗");

            setResultTable(result.table);
            setGroupCounts(result.groupCounts);
            router.push("/step3_v2");
        } catch (err: any) {
            console.error("分析失敗：", err);
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (parsedData.length === 0) router.push("/step1_v2");
    }, [parsedData, router]);

    return (
        <div className="bg-white">
            <Header />
            <div className="container-custom pt-[70px] lg:pt-[110px] pb-2 lg:pb-45">
                <StepNavigator />
                <h2 className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4 leading-[42px] tracking-[3px] text-[#0F2844] font-normal">Step2：選擇變項</h2>
                <div className="space-y-8">
                    <div className="flex flex-col lg:flex-row gap-6 mt-4 lg:mt-8">
                        <div className="flex-1">
                            <label className="block mb-2 text-[20px] tracking-[2px] leading-[32px] font-bold text-[#555555]">分組變項…</label>
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
                            className="w-[25px] h-[25px] rounded-md border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844]"
                            checked={fillNA}
                            onChange={(e) => setFillNA(e.target.checked)}
                        />
                        <label htmlFor="fillna" className="text-[20px] text-[#555555] tracking-[2px] leading-[32px] font-bold">
                            填補缺值
                        </label>
                    </div>
                    <div className="flex justify-center pt-4 pb-10 lg:pb-24">
                        <button
                            className="w-[260px] h-[50px] rounded-full border border-[#0F2844] text-[#0F2844] flex items-center justify-center gap-2 text-[20px] tracking-[2px] leading-[35px] transition-all hover:bg-[#0F2844] hover:text-white"
                            onClick={handleAnalyze}
                            disabled={!isValid || loading || (userPoints !== null && userPoints < pointCost)}
                            onMouseEnter={() => setIsHover(true)}
                            onMouseLeave={() => setIsHover(false)}
                        >
                            <Image
                                src={isHover ? "/step2/sparkles_icon_white.png" : "/step2/sparkles_icon@2x.png"}
                                alt="sparkles"
                                width={20}
                                height={20}
                                className="transition duration-200"
                            />
                            {loading ? "分析中..." : `開始分析`}
                        </button>
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
                }} message={confirmMessage} />
        </div>
    );
}