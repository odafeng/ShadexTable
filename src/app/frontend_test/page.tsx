"use client";

{/*此份為引入ShadyPrep的各模組通用Step1前端*/}

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
import { TableProperties, SquareActivity, ChevronDown, AlertTriangle, Ban, Wand2, ArrowBigRight } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
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
    } = useAnalysis();

    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [columnsPreview, setColumnsPreview] = useState<any[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [aiDiagnosis, setAiDiagnosis] = useState<any | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [ColumnProfile, setColumnProfile] = useState<any[]>([]);
    const [enableAiDiagnosis, setEnableAiDiagnosis] = useState<boolean>(true);




    useEffect(() => {
        getToken().then((token) => {
            if (token) localStorage.setItem("__session", token);
        });
    }, [getToken]);

    useEffect(() => {
        if (isSignedIn === false) {
            router.push("/sign-in"); // ← 若未登入就跳去登入頁
        }
    }, [isSignedIn]);

    if (!isSignedIn) return null;

    const validateFile = (file: File) => {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        return allowedExtensions.includes(ext);
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
            const res = await fetch(`http://localhost:8001/api/preprocess/columns`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data }),
            });

            const json = await res.json();
            setColumnProfile(json.columns || []);
            setColumnsPreview(json.columns || []);
            setColumnTypes(json.columns || []);
            setShowPreview(true);

            // 🧠 呼叫 AI 分析
            if (enableAiDiagnosis) {
                fetchAiDiagnosis(json.columns || []);
            }
        } catch (err) {
            console.error("❌ 欄位解析錯誤：", err);
            setShowPreview(false);
        }
    };

    const fetchAiDiagnosis = async (columns: any[]) => {
        try {
            setAiLoading(true);
            const token = localStorage.getItem("__session") || "";
            const res = await fetch(`http://localhost:8001/api/preprocess/ai_diagnosis`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ columns }),
            });

            const json = await res.json();
            const parsed = typeof json === "string" ? JSON.parse(json) : json;
            setAiDiagnosis(parsed);
        } catch (err) {
            console.error("❌ AI 分析失敗：", err);
            setAiDiagnosis(null);
        } finally {
            setAiLoading(false);
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

    const handleAnalyze = () => {
        if (!file) {
            setError("請先選擇檔案後再上傳。");
            return;
        }

        setLoading(true);
        setCtxFile(file);
        setTimeout(() => {
            setLoading(false);
            router.push("/step2_v2");
        }, 1000);
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

                {/* AI是否啟用checkbox */}
                <div className="mt-4 mb-2 flex items-center gap-1">
                    <input
                        type="checkbox"
                        id="enable-ai"
                        checked={enableAiDiagnosis}
                        onChange={() => setEnableAiDiagnosis(!enableAiDiagnosis)}
                        className="w-3 h-3 lg:w-4 lg:h-4  text-[#586D81]"
                    />
                    <label htmlFor="enable-ai" className="text-[16px] lg:text-[20px] text-[#0F2844] font-medium">
                        啟用 AI 智慧資料健檢
                    </label>
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
                                className="text-[#0F2844] text-[16px] lg:text-[20px]"
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
                                            {Object.keys(parsedData[0]).map((col, j) => (
                                                <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                                                    {String(row[col] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                {/* 顯示自動欄位解析 */}
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
                                                    <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">{col.missing_pct ?? "–"}</td>
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


                {/* AI分析中動畫 */}
                {aiLoading && (
                    <div className="flex items-center space-x-2 text-sm text-[#1E40AF] mt-4 mb-4">
                        <svg className="animate-spin h-4 w-4 text-[#1E40AF]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                            />
                        </svg>
                        <span>AI 分析中，請稍候...</span>
                    </div>
                )}

                {/* AI資料健檢報告 */}
                {aiDiagnosis && (
                    <div className="mt-4">
                        <Accordion type="multiple" defaultValue={["ai-summary"]} className="w-full">
                            <AccordionItem value="ai-summary">
                                <AccordionTrigger
                                    className="text-[#0F2844] text-[20px] font-medium tracking-[1.5px] group px-4 py-3 rounded-t-md"
                                    style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <SquareActivity className="text-[#0F2844]" size={20} />
                                        <span className="cursor-pointer">AI 資料健檢報告</span>
                                        <ChevronDown className="h-5 w-5 text-[#0F2844] transition-transform duration-300 group-data-[state=open]:rotate-180" />
                                    </div>
                                </AccordionTrigger>

                                <AccordionContent className="bg-[#EEF2F9] text-[#586D81] px-4 py-6 space-y-2 rounded-lg">
                                    {/* 異常值警告 */}
                                    {aiDiagnosis.outlier_warnings?.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-[#F87171]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle size={20} className="text-[#F87171]" />
                                                <h4 className="font-medium text-[#0F2844] text-[20px]">異常值警告</h4>
                                            </div>
                                            <ul className="list-disc list-inside text-[18px] leading-6 tracking-tight pl-2">
                                                {aiDiagnosis.outlier_warnings.map((item: any, i: number) => (
                                                    <li key={i}>
                                                        <strong>{item.column}</strong>：{item.issue}
                                                        {item.suggestion ? `（${item.suggestion}）` : ""}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 缺值補值建議 */}
                                    {aiDiagnosis.missing_value_suggestions?.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-[#FACC15]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Ban size={20} className="text-[#FACC15]" />
                                                <h4 className="font-medium text-[#0F2844] text-[20px]">缺值處理建議</h4>
                                            </div>
                                            <ul className="list-disc list-inside text-[18px] leading-6 tracking-tight pl-2">
                                                {aiDiagnosis.missing_value_suggestions.map((item: any, i: number) => (
                                                    <li key={i}>
                                                        <strong>{item.column}</strong>
                                                        （建議：{item.suggestion}，方法：{item.method}）：{item.reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 極端值提醒 */}
                                    {aiDiagnosis.extreme_value_alerts?.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-[#60A5FA]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ArrowBigRight size={20} className="text-[#60A5FA]" />
                                                <h4 className="font-medium text-[#0F2844] text-[20px]">極端值提醒</h4>
                                            </div>
                                            <ul className="list-disc list-inside text-[18px] leading-6 tracking-tight pl-2">
                                                {aiDiagnosis.extreme_value_alerts.map((item: any, i: number) => {
                                                    const matched = ColumnProfile.find((c) => c.column === item.column);
                                                    const count = matched?.outlier_count ?? "？";
                                                    return (
                                                        <li key={i}>
                                                            <strong>{item.column}</strong>：{item.alert}（共 {count} 筆）
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 欄位命名建議 */}
                                    {aiDiagnosis.rename_suggestions?.length > 0 && (
                                        <div className="bg-white p-4 rounded-lg shadow-md border border-[#34D399]">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Wand2 size={20} className="text-[#34D399]" />
                                                <h4 className="font-medium text-[#0F2844] text-[20px]">欄位命名建議</h4>
                                            </div>
                                            <ul className="list-disc list-inside text-[18px] leading-6 tracking-tight pl-2">
                                                {aiDiagnosis.rename_suggestions.map((item: any, i: number) => (
                                                    <li key={i}>
                                                        <strong>{item.column}</strong> →{" "}
                                                        <span className="text-[#B5894C] font-semibold">
                                                            {item.suggestion}
                                                        </span>
                                                        {item.reason ? `（${item.reason}）` : ""}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}

                <div className="flex justify-center mt-6 lg:mt-10 mb-8 lg:mb-24">
                    <button
                        disabled={!file || loading}
                        onClick={handleAnalyze}
                        className={`w-[186px] h-[50px] rounded-full border flex items-center justify-center gap-2 text-[18px] tracking-[2px] transition-all ${file ? "bg-[#0F2844] text-white border-[#0F2844]" : "bg-transparent text-gray-400 border-gray-400"
                            } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                        {loading ? (
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                                />
                            </svg>
                        ) : (
                            <>
                                <Image
                                    src={file ? "/step1/upload_white.png" : "/step1/upload_gray.png"}
                                    alt="upload"
                                    width={20}
                                    height={20}
                                />
                                上傳並分析
                            </>
                        )}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}
