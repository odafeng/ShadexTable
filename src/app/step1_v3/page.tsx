"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import * as XLSX from "xlsx";
import Image from "next/image";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import { useAnalysis } from "@/context/AnalysisContext";
import { typeColorClass } from "@/lib/constants";
import { ChevronDown, TableProperties } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import LightButton from "@/components/LightButton";
import ActionButton2 from "@/components/ActionButton2";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "@/components/ui/accordion";

const allowedExtensions = [".csv", ".xls", ".xlsx"];

export default function Step1Page() {
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();
    const {
        parsedData,
        setFile: setCtxFile,
        setParsedData,
        setGroupVar: setCtxGroupVar,
        setCatVars: setCtxCatVars,
        setContVars: setCtxContVars,
        fillNA,
        setFillNA,
        setResultTable,
        setColumnTypes,
        setGroupCounts,
    } = useAnalysis();

    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [columnsPreview, setColumnsPreview] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        getToken().then((token) => {
            if (token) localStorage.setItem("__session", token);
        });
    }, [getToken]);

    useEffect(() => {
        if (isSignedIn === false) {
            router.push("/sign-in");
        }
    }, [isSignedIn]);

    if (!isSignedIn) return null;

    const validateFile = (file: File) => {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        return allowedExtensions.includes(ext);
    };

    const handleAnalyze = () => {
        if (!file) {
            setError("請先選擇檔案後再上傳。");
            return;
        }

        setLoading(true);
        setCtxFile(file);
        setTimeout(() => {
            setLoading(false);
            router.push("/step2_v3");
        }, 1000);
    };

    const handleFile = (file: File) => {
        if (!validateFile(file)) {
            setError("請上傳 CSV 或 Excel 檔案。");
            setFile(null);
            return;
        }

        setError("");
        setFile(file);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

            const allKeys = Array.from(new Set(json.flatMap((row) => Object.keys(row))));
            const normalizedData = json.map((row) => {
                const completeRow: any = {};
                allKeys.forEach((key) => {
                    completeRow[key] = key in row ? row[key] : "";
                });
                return completeRow;
            });

            setParsedData(normalizedData);
            fetchColumnProfile(normalizedData);
        };

        reader.readAsArrayBuffer(file);
    };

    const fetchColumnProfile = async (data: any[]) => {
        try {
            const token = localStorage.getItem("__session") || "";
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/table/columns-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data }),
            });

            const json = await res.json();
            setColumnsPreview(json.columns || []);
            setColumnTypes(json.columns || []);
            setShowPreview(true);
        } catch (err) {
            console.error("❌ 欄位解析錯誤：", err);
            setShowPreview(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    // 🚀 新增：自动分析函数
    const handleAutoAnalyze = async () => {
        if (!file || parsedData.length === 0) {
            setError("請先選擇檔案後再上傳。");
            return;
        }

        setLoading(true);
        setCtxFile(file);

        try {
            console.log("🤖 開始自動分析流程...");

            const token = await getToken();
            if (!token) {
                throw new Error("授權失敗，請重新登入");
            }

            // 調用自動分析 API
            console.log("📡 調用自動分析 API...");
            const response = await fetch(`http://localhost:8001/api/ai_automation/auto-analyze`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    parsedData: parsedData,
                    fillNA: fillNA
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `API 错误: ${response.status}`);
            }

            const result = await response.json();
            console.log("✅ 自动分析结果:", result);

            if (!result.success) {
                throw new Error(result.message || "自动分析失败");
            }

            // 更新 context 状态
            console.log("📝 更新分析上下文...");
            setCtxGroupVar(result.group_var || "");
            setCtxCatVars(result.cat_vars || []);
            setCtxContVars(result.cont_vars || []);

            // 设置分析结果
            if (result.analysis?.table) {
                setResultTable(result.analysis.table);
                console.log("📊 分析表格已设置，行数:", result.analysis.table.length);
            }

            if (result.analysis?.groupCounts) {
                setGroupCounts(result.analysis.groupCounts);
                console.log("👥 分组计数已设置:", result.analysis.groupCounts);
            }

            console.log("🎯 AI 变量分类:");
            console.log("  - 分组变项:", result.group_var);
            console.log("  - 类别变项:", result.cat_vars);
            console.log("  - 连续变项:", result.cont_vars);

            // 跳转到结果页面
            console.log("🚀 跳转到 Step3...");
            router.push("/step3_v3");

        } catch (err: any) {
            console.error("❌ 自动分析失败:", err);
            setError(`自动分析失败: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white">
            <Header />
            <div className="container-custom pt-[70px] lg:pt-[110px] pb-2 lg:pb-45">
                <StepNavigator />

                {/* 標題 */}
                <h2
                    style={{
                        letterSpacing: "3px",
                        lineHeight: "42px",
                        fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                        color: "#0F2844",
                    }}
                    className="text-[26px] lg:text-[30px] mt-0 lg:mt-4 mb-4"
                >
                    Step1：上傳資料檔案
                </h2>

                {/* 提醒文字 */}
                <div className="flex items-start gap-2 mb-8 text-[18px] lg:text-[20px]">
                    <Image
                        src="/step1/alert_icon@2x.png"
                        alt="alert"
                        width={21.6}
                        height={24}
                        className="w-[18px] h-[20px] mt-[8px] lg:w-[21.6px] lg:h-[24px] lg:mt-[5px]"
                    />
                    <p
                        style={{
                            letterSpacing: "2px",
                            lineHeight: "32px",
                            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                            color: "#0F2844",
                        }}
                    >
                        請注意：請務必移除所有個資欄位(如姓名、病歷號等)，避免違反資料安全規範！
                    </p>
                </div>

                {/* 上傳區 */}
                <div
                    className={`w-full max-w-[1366px] h-[154px] border rounded-xl flex flex-col items-center justify-center space-y-4 ${dragOver ? "bg-[#dce3f1]" : "bg-[#EEF2F9]"
                        }`}
                    style={{
                        borderColor: "#C4C8D0",
                        borderWidth: "1px",
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* 檔案選擇框 + Tooltip */}
                    <div className="max-w-[549px] max-h-[50px] flex items-center justify-between px-4 border border-[#C4C8D0] bg-white rounded-md relative group">
                        <div className="-mt-1 cursor-pointer">
                            <label
                                htmlFor="file-upload"
                                className="text-[#0F2844] text-[16px] lg:text-[20px] cursor-pointer"
                                style={{
                                    fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                                    letterSpacing: "2px",
                                    lineHeight: "30px",
                                }}
                            >
                                選擇檔案
                            </label>

                            {/* Tooltip */}
                            <div className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded mt-2 z-10 left-0 whitespace-nowrap">
                                僅限上傳 Excel 或 CSV
                            </div>
                        </div>

                        <span
                            className="truncate text-right"
                            style={{
                                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                                fontSize: "18px",
                                letterSpacing: "1.8px",
                                lineHeight: "30px",
                                color: "#9CA3AF",
                                maxWidth: "320px",
                            }}
                        >
                            {fileName || "未選擇任何檔案"}
                        </span>

                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".csv,.xls,.xlsx"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* 拖曳提示文字 */}
                    <p
                        style={{
                            fontSize: "18px",
                            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                            color: "#5B6D81",
                        }}
                    >
                        拖曳檔案至此或點擊選取
                    </p>
                </div>

                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

                {parsedData.length > 0 && (
                    <div className="mt-10 lg:mt-16 space-y-2">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/step1/checkbox_icon@2x.png"
                                alt="checkbox"
                                width={21.33}
                                height={20}
                                className="-mt-10 -mr-2 lg:-mt-6 lg-mr-0"
                            />
                            <p className="text-xs text-[#0F2844] -mt-4 mb-2">
                                已上傳檔案，以下為預覽資料（最多顯示前五列）：
                            </p>
                        </div>
                        <div className="overflow-auto border rounded-lg text-sm max-h-64 text-[#0F2844]">
                            <table className="min-w-full border-collapse text-left">
                                <thead className="bg-[#EEF2F9] text-[#586D81] sticky top-0 z-10">
                                    <tr>
                                        {Object.keys(parsedData[0]).map((key) => (
                                            <th key={key} className="px-3 py-2 border-b font-medium text-gray-700 whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 5).map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {Object.keys(parsedData[0]).map((col, j) => {
                                                // 判斷是否為數字型日期
                                                const value = row[col];
                                                let displayValue = value;

                                                // 轉換Excel數字日期為JavaScript日期
                                                if (typeof value === "number" && value > 20000 && value < 60000) {
                                                    const excelDateToJSDate = (excelDate: number) => {
                                                        return new Date((excelDate - 25569) * 86400 * 1000);
                                                    };
                                                    const date = excelDateToJSDate(value);
                                                    displayValue = date.toLocaleDateString(); // 格式化為日期
                                                } else if (value instanceof Date) {
                                                    displayValue = value.toLocaleDateString();
                                                }

                                                return (
                                                    <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                                                        {displayValue ?? ""}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {showPreview && columnsPreview.length > 0 && (
                    <Accordion type="multiple" defaultValue={["column-preview"]} className="w-full mt-8 lg:mt-10">
                        <AccordionItem value="column-preview">
                            <AccordionTrigger
                                className="text-[#0F2844] text-[20px] font-medium tracking-[1.5px] flex items-center justify-between group"
                                style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                            >
                                <div className="flex items-center gap-2">
                                    <TableProperties className="text-[#0F2844]" size={20} />
                                    <span className="cursor-pointer">自動欄位解析結果</span>
                                    <ChevronDown className="h-5 w-5 text-[#0F2844] transition-transform duration-300 group-data-[state=open]:rotate-180 cursor-pointer" />
                                </div>

                            </AccordionTrigger>

                            <AccordionContent className="mt-2">
                                <div className="overflow-auto max-h-64 rounded-lg border">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-[#EEF2F9] sticky top-0 text-[#586D81] border-b border-gray-300">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">欄位名稱</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">遺漏值比例</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">極端值比例</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">系統建議型別</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {columnsPreview.map((col, i) => (
                                                <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                                                    <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">{col.column}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">{col.missing_pct !== null && col.missing_pct !== undefined
                                                        ? `${col.missing_pct.toFixed(1)}%`
                                                        : "–"}</td>
                                                    <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                        {col.outlier_pct !== null && col.outlier_pct !== undefined
                                                            ? `${col.outlier_pct}%`
                                                            : "–"}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2 whitespace-nowrap font-medium ${typeColorClass[col.suggested_type] || "text-gray-500"
                                                            }`}
                                                    >
                                                        {col.suggested_type ?? "不明"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}

                {/* 🆕 填補缺值選項 */}
                {parsedData.length > 0 && (
                    <div className="flex items-center space-x-1">
                        <input
                            type="checkbox"
                            id="fillna"
                            className="w-[25px] h-[25px] rounded-md border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844] cursor-pointer"
                            checked={fillNA}
                            onChange={(e) => setFillNA(e.target.checked)} />
                        <label htmlFor="fillna" className="text-[20px] text-[#555555] tracking-[2px] leading-[32px] font-bold cursor-pointer">
                            填補缺值
                        </label>
                    </div>
                )}

                <div className="flex gap-10 mt-4 justify-center">
                    <div>
                        <ActionButton
                            text={loading ? "AI 分析中..." : "AI 全自動模式"}
                            loading={loading}
                            disabled={!file || loading}
                            onClick={handleAutoAnalyze}
                            iconSrc="/step1/upload_white.png"
                            iconGraySrc="/step1/upload_gray.png"
                            iconHoverSrc="/step1/Group_50@2x.png"
                            className="min-w-[220px] w-auto"
                        />
                    </div>
                    <ActionButton2
                        text="半自動模式"
                        loading={loading}
                        disabled={!file}
                        onClick={handleAnalyze}
                        iconSrc="/step1/Group_50@2x.png"
                        iconGraySrc="/step1/upload_gray.png"
                        iconHoverSrc="/step1/upload_white.png"
                        className="min-w-[186px] w-auto text-[18px]"
                    />
                </div>
            </div>
            <Footer />
        </div>
    );
}