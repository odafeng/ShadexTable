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
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ToggleSwitch from "@/components/ToggleSwitch";

const allowedExtensions = [".csv", ".xls", ".xlsx"];

interface ParsedDataRow {
    [key: string]: any;
}

interface ColumnProfile {
    column: string;
    missing_pct: string; // 後端回傳的是字串格式，例如 "5.2%"
    suggested_type: string;
}

interface Step1PageProps {}

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
        setAutoAnalysisResult,
    } = useAnalysis();

    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [columnsPreview, setColumnsPreview] = useState<ColumnProfile[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [autoMode, setAutoMode] = useState(false); // false = 半自動, true = 全自動
    const [columnAnalysisLoading, setColumnAnalysisLoading] = useState(false);

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

    // Excel 日期轉換函數
    const excelDateToJSDate = (excelDate: number) => {
        return new Date((excelDate - 25569) * 86400 * 1000);
    };

    // 統一的分析處理函數
    const handleAnalyze = async () => {
        if (!file) {
            setError("請先選擇檔案後再上傳。");
            return;
        }

        if (autoMode) {
            await handleAutoAnalyze();
        } else {
            await handleManualAnalyze();
        }
    };

    // 半自動模式處理函數
    const handleManualAnalyze = async () => {
        setLoading(true);
        setCtxFile(file);
        setAutoAnalysisResult(null);

        try {
            setTimeout(() => {
                setLoading(false);
                router.push("/step2_v3");
            }, 1000);
        } catch (err) {
            console.error("❌ 半自動分析失敗:", err);
            setError("半自動分析失敗，請稍後再試");
            setLoading(false);
        }
    };

    // 自動分析函數
    const handleAutoAnalyze = async () => {
        if (!file || parsedData.length === 0) {
            setError("請先選擇檔案後再上傳。");
            return;
        }

        setLoading(true);
        setCtxFile(file);

        try {
            

            const token = await getToken();
            if (!token) {
                throw new Error("授權失敗，請重新登入");
            }

            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai_automation/auto-analyze`, {
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
            

            if (!result.success) {
                throw new Error(result.message || "自动分析失败");
            }

            // 更新 context 状态
            
            setCtxGroupVar(result.group_var || "");
            setCtxCatVars(result.cat_vars || []);
            setCtxContVars(result.cont_vars || []);

            // 設置自動分析結果到 context
            setAutoAnalysisResult(result);

            // 设置分析结果
            if (result.analysis?.table) {
                setResultTable(result.analysis.table);
                
            }

            if (result.analysis?.groupCounts) {
                setGroupCounts(result.analysis.groupCounts);
                
            }

            
            
            
            

            // 跳转到结果页面
            
            router.push("/step3_v3");

        } catch (err: any) {
            console.error("❌ 自动分析失败:", err);
            const errorMessage = err?.message || err?.toString() || "未知錯誤";
            setError(`自动分析失败: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
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

        // 重置狀態
        setShowPreview(false);
        setColumnsPreview([]);
        setColumnAnalysisLoading(false);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                

                if (json.length === 0) {
                    setError("檔案中沒有資料，請檢查檔案內容。");
                    return;
                }

                const allKeys = Array.from(new Set(json.flatMap((row) => Object.keys(row))));
                

                const normalizedData = json.map((row) => {
                    const completeRow: any = {};
                    allKeys.forEach((key) => {
                        completeRow[key] = key in row ? row[key] : "";
                    });
                    return completeRow;
                });

                
                setParsedData(normalizedData);

                // 立即呼叫欄位解析
                fetchColumnProfile(normalizedData);

            } catch (error) {
                console.error("❌ 檔案處理錯誤:", error);
                let errorMessage = "檔案處理失敗";
                if (error instanceof Error) {
                    errorMessage += `: ${error.message}`;
                } else if (typeof error === "string") {
                    errorMessage += `: ${error}`;
                }
                setError(errorMessage);
            }
        };

        reader.onerror = () => {
            console.error("❌ 檔案讀取失敗");
            setError("檔案讀取失敗，請重新選擇檔案。");
        };

        reader.readAsArrayBuffer(file);
    };

    const fetchColumnProfile = async (data: any[]) => {
        
        setColumnAnalysisLoading(true);

        try {
            const token = localStorage.getItem("__session") || "";
            
            if (!token) {
                throw new Error("授權 token 不存在");
            }

            if (!process.env.NEXT_PUBLIC_API_URL) {
                throw new Error("API URL 未配置");
            }

            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/preprocess/columns`;
            

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ data }),
            });

            

            if (!res.ok) {
                const errorText = await res.text();
                console.error("❌ API 錯誤:", res.status, errorText);
                throw new Error(`API 錯誤: ${res.status} - ${errorText}`);
            }

            const json = await res.json();
            

            // 檢查回應格式並設置狀態
            if (json && json.data && json.data.columns && Array.isArray(json.data.columns)) {
                
                setColumnsPreview(json.data.columns);
                setColumnTypes(json.data.columns);
                setShowPreview(true);
            } else {
                console.warn("⚠️ API 回應格式異常，使用備用方案");
                
                createFallbackColumnData(data);
            }

        } catch (err: any) {
            console.error("❌ 欄位解析錯誤：", err);
            setError(`欄位解析失敗: ${err.message}`);
            
            // 使用備用方案
            createFallbackColumnData(data);
        } finally {
            setColumnAnalysisLoading(false);
        }
    };

    // 備用方案：創建基本的欄位資訊
    const createFallbackColumnData = (data: any[]) => {
        if (data.length === 0) return;
        
        const columns: ColumnProfile[] = Object.keys(data[0]).map(col => ({
            column: col,
            missing_pct: "0.0%", // 字串格式
            suggested_type: "不明"
        }));
        
        
        setColumnsPreview(columns);
        setShowPreview(true);
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
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer text-[#0F2844] text-xl relative">
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
                                </TooltipTrigger>
                                <TooltipContent>
                                    支援Excel檔案(.xlsx、.xls)和CSV檔案(.csv)
                                </TooltipContent>
                            </Tooltip>
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

                {/* 資料預覽表格 */}
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
                                            <th key={key} className="px-3 py-2 border-b whitespace-nowrap">{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 5).map((row: ParsedDataRow, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            {Object.keys(parsedData[0] as ParsedDataRow).map((col: string, j: number) => {
                                                const value: any = row[col];
                                                let displayValue: any = value;

                                                // 轉換Excel數字日期為JavaScript日期
                                                if (typeof value === "number" && value > 20000 && value < 60000) {
                                                    const date: Date = excelDateToJSDate(value);
                                                    displayValue = date.toLocaleDateString();
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

                {/* 自動欄位解析結果 */}
                {parsedData.length > 0 && (
                    <div className="mt-8 lg:mt-10">
                        {/* 載入狀態 */}
                        {columnAnalysisLoading && (
                            <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                <p className="text-gray-600">正在分析欄位特性...</p>
                            </div>
                        )}

                        {/* 成功狀態 - 顯示表格 */}
                        {!columnAnalysisLoading && showPreview && columnsPreview.length > 0 && (
                            <Accordion type="multiple" defaultValue={["column-preview"]} className="w-full">
                                <AccordionItem value="column-preview">
                                    <AccordionTrigger
                                        className="text-[#0F2844] text-[20px] font-medium tracking-[1.5px] flex items-center justify-between group"
                                        style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <TableProperties className="text-[#0F2844]" size={20} />
                                            <span className="cursor-pointer">
                                                自動欄位解析結果 ({columnsPreview.length} 個欄位)
                                            </span>
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
                                                        <th className="px-3 py-2 text-left whitespace-nowrap">系統建議型別</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {columnsPreview.map((col, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                                                            <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                                {col.column || `欄位 ${i + 1}`}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                                {col.missing_pct || "–"}
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

                        {/* 錯誤狀態 */}
                        {!columnAnalysisLoading && !showPreview && error.includes("欄位解析") && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-red-600">⚠️</span>
                                    <span className="font-medium text-red-800">欄位解析失敗</span>
                                </div>
                                <p className="text-red-700 text-sm mb-3">{error}</p>
                                <button 
                                    onClick={() => fetchColumnProfile(parsedData)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                                >
                                    重新分析
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 填補缺值選項 */}
                {parsedData.length > 0 && (
                    <div className="flex items-center space-x-1 mt-6">
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
                )}

                {/* 模式選擇和分析按鈕 */}
                {parsedData.length > 0 && (
                    <div className="flex flex-col items-center gap-8 mt-8">
                        {/* AutoMode 開關 */}
                        <div className="flex flex-col items-center gap-4">
                            <ToggleSwitch
                                checked={autoMode}
                                onCheckedChange={setAutoMode}
                                label="AI 全自動分析模式"
                                size="sm"
                                className="justify-center"
                                labelClassName="text-[20px] font-bold tracking-[1px]"
                            />

                            {/* 模式說明 */}
                            <div className="text-center">
                                <div className={`text-sm font-medium transition-all duration-300 ${autoMode ? 'text-blue-600' : 'text-gray-600'
                                    }`}>
                                    {autoMode
                                        ? "🤖 AI 將自動完成所有分析步驟"
                                        : "👨‍💻 手動控制每個分析步驟"
                                    }
                                </div>
                                <div className="text-xs text-gray-500 mt-1 max-w-md">
                                    {autoMode
                                        ? "包含資料預處理、變項選擇、統計分析等，一鍵完成全部流程"
                                        : "您可以逐步檢視和調整分析參數，完全掌控分析過程"
                                    }
                                </div>
                            </div>
                        </div>

                        {/* 統一的開始分析按鈕 */}
                        <div className="flex justify-center">
                            <ActionButton
                                text={loading ? "分析中..." : `開始${autoMode ? 'AI 全自動' : '半自動'}分析`}
                                loading={loading}
                                disabled={!file || loading}
                                onClick={handleAnalyze}
                                iconSrc={autoMode ? "/step1/Group_50@2x.png" : "/step1/upload_white.png"}
                                iconGraySrc="/step1/upload_gray.png"
                                iconHoverSrc={autoMode ? "/step1/upload_white.png" : "/step1/Group_50@2x.png"}
                                className={`min-w-[240px] w-auto transition-all duration-300 ${autoMode
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:text-white'
                                    : ''
                                    }`}
                            />
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}