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
import { ChevronDown, TableProperties, Shield, AlertTriangle, Info, CircleQuestionMark } from "lucide-react";
import ActionButton from "@/components/ActionButton";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "@/components/ui/accordion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ToggleSwitch from "@/components/ToggleSwitch";

import { SensitiveDataDetector } from "@/services/sensitiveDataDetector";
import { FileProcessor } from "@/utils/fileProcessor";
import { useUserLimits, useFileValidation } from "@/hooks/useUserLimits";
import DataPrivacyDialog from "./components/DataPrivacyDialog";
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    createErrorHandler,
    CommonErrors
} from "@/utils/error";
import { reportError } from "@/lib/apiClient";
import { AppError } from "@/types/errors";

const allowedExtensions = [".csv", ".xls", ".xlsx"];

interface ParsedDataRow {
    [key: string]: any;
}

interface ColumnProfile {
    column: string;
    missing_pct: string;
    suggested_type: string;
}

interface Step1PageProps { }

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

    // 基本狀態
    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [columnsPreview, setColumnsPreview] = useState<ColumnProfile[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [autoMode, setAutoMode] = useState(false);
    const [columnAnalysisLoading, setColumnAnalysisLoading] = useState(false);

    // 敏感資料檢測相關狀態
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [sensitiveColumns, setSensitiveColumns] = useState<string[]>([]);
    const [privacySuggestions, setPrivacySuggestions] = useState<string[]>([]);
    const [fileValidationWarnings, setFileValidationWarnings] = useState<string[]>([]);
    const [fileBasicInfo, setFileBasicInfo] = useState<any>(null);
    const [sensitiveDetectionLoading, setSensitiveDetectionLoading] = useState(false);

    // 檔案大小相關狀態 (使用 hook)
    const limitsInfo = useUserLimits();
    const { validateFile, getFileSizeWarning } = useFileValidation();

    // ==========================================
    // 統一錯誤處理器
    const errorHandler = createErrorHandler((appError: AppError) => {
        setError(appError);

        // 自動清除非關鍵錯誤
        const isTemporaryError = [
            ErrorCode.NETWORK_ERROR,
            ErrorCode.RATE_LIMIT_ERROR
        ].includes(appError.code);

        if (isTemporaryError) {
            setTimeout(() => setError(null), 8000);
        }

        // 記錄錯誤到外部系統
        reportError(appError, {
            step: "step1",
            component: "Step1Page",
            fileName: file?.name || pendingFile?.name,
            hasSensitiveData: sensitiveColumns.length > 0,
            autoMode,
            timestamp: new Date().toISOString()
        }).catch(console.warn);
    });

    const clearError = () => setError(null);

    // ==========================================
    // 生命週期 Effects
    useEffect(() => {
        getToken()
            .then((token) => {
                if (token) localStorage.setItem("__session", token);
            })
            .catch((err) => {
                errorHandler(CommonErrors.authTokenMissing(), "獲取認證令牌");
            });
    }, [getToken]);

    useEffect(() => {
        if (isSignedIn === false) {
            router.push("/sign-in");
        }
    }, [isSignedIn, router]);

    if (!isSignedIn) return null;

    // ==========================================
    // 敏感資料檢測處理
    const handleSensitiveDataDetection = async (selectedFile: File) => {
        setSensitiveDetectionLoading(true);
        clearError();

        try {
            console.log(`🔍 開始敏感資料檢測: ${selectedFile.name}`);

            // 使用 SensitiveDataDetector 檢測敏感資料
            const sensitiveResult = await SensitiveDataDetector.checkFileForSensitiveData(selectedFile);

            if (sensitiveResult.error) {
                errorHandler(sensitiveResult.error, "敏感資料檢測");
                return false;
            }

            console.log(`🔒 敏感資料檢測完成: 發現 ${sensitiveResult.sensitiveColumns.length} 個敏感欄位`);

            // 設置敏感資料相關狀態
            setSensitiveColumns(sensitiveResult.sensitiveColumns);
            setPrivacySuggestions(sensitiveResult.suggestions);

            // 準備檔案基本資訊
            setFileBasicInfo({
                name: selectedFile.name,
                size: selectedFile.size,
                hasMultipleSheets: false // 將在檔案處理時更新
            });

            return true;

        } catch (err: unknown) {
            console.error(`❌ 敏感資料檢測失敗:`, err);
            errorHandler(
                createError(
                    ErrorCode.PRIVACY_ERROR,
                    undefined,
                    undefined,
                    {
                        customMessage: "敏感資料檢測失敗，請重試",
                        cause: err instanceof Error ? err : undefined
                    }
                ),
                "敏感資料檢測"
            );
            return false;
        } finally {
            setSensitiveDetectionLoading(false);
        }
    };

    // ==========================================
    // 檔案處理主函數 (使用 FileProcessor)
    const handleFileSelection = async (selectedFile: File) => {
        clearError();
        console.log(`📁 開始處理檔案: ${selectedFile.name} (${FileProcessor.formatFileSize(selectedFile.size)})`);

        // 1. 使用 hook 進行檔案驗證
        const validation = validateFile(selectedFile);
        if (!validation.isValid) {
            errorHandler(validation.error!, `檔案驗證: ${selectedFile.name}`);
            return;
        }

        // 2. 檢查檔案大小警告
        const sizeWarning = getFileSizeWarning(selectedFile);
        const warnings: string[] = [];

        if (validation.warnings) {
            warnings.push(...validation.warnings);
        }

        if (sizeWarning) {
            warnings.push(sizeWarning);
        }

        setFileValidationWarnings(warnings);

        // 3. 設置待處理檔案
        setPendingFile(selectedFile);

        // 4. 進行敏感資料檢測
        const detectionSuccess = await handleSensitiveDataDetection(selectedFile);
        if (!detectionSuccess) {
            setPendingFile(null);
            return;
        }

        // 5. 顯示隱私對話框
        setShowPrivacyDialog(true);
    };

    // ==========================================
    // 隱私對話框處理
    const handlePrivacyConfirm = async () => {
        if (!pendingFile) {
            errorHandler(CommonErrors.fileNotSelected(), "隱私確認");
            return;
        }

        // 檢查是否有敏感資料
        if (sensitiveColumns.length > 0) {
            errorHandler(CommonErrors.sensitiveDataDetected(), "隱私確認 - 有敏感資料");
            return;
        }

        setShowPrivacyDialog(false);
        console.log(`✅ 隱私確認完成，開始處理檔案: ${pendingFile.name}`);

        try {
            await processFile(pendingFile);
            cleanupPendingState();
        } catch (err: unknown) {
            errorHandler(
                createError(
                    ErrorCode.PRIVACY_ERROR,
                    undefined,
                    'privacy.agreement_required',
                    {
                        customMessage: "檔案處理失敗，請重試",
                        cause: err instanceof Error ? err : undefined
                    }
                ),
                "隱私確認後檔案處理"
            );
        }
    };

    const handlePrivacyCancel = () => {
        console.log(`❌ 用戶取消隱私確認`);
        setShowPrivacyDialog(false);
        cleanupPendingState();

        // 清除檔案選擇
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const cleanupPendingState = () => {
        setPendingFile(null);
        setSensitiveColumns([]);
        setPrivacySuggestions([]);
        setFileValidationWarnings([]);
        setFileBasicInfo(null);
    };

    // ==========================================
    // 檔案內容處理 (使用 FileProcessor)
    const processFile = async (fileToProcess: File) => {
        setFile(fileToProcess);
        setFileName(fileToProcess.name);
        setShowPreview(false);
        setColumnsPreview([]);
        setColumnAnalysisLoading(false);

        try {
            console.log(`⚙️ 開始解析檔案內容: ${fileToProcess.name}`);

            // 使用 FileProcessor 處理檔案
            const result = await FileProcessor.processFile(fileToProcess, limitsInfo.userType);

            if (result.error) {
                errorHandler(result.error, `檔案處理: ${fileToProcess.name}`);
                return;
            }

            if (result.data.length === 0) {
                const error = createError(
                    ErrorCode.FILE_ERROR,
                    ErrorContext.FILE_UPLOAD,
                    'file.empty_file'
                );
                errorHandler(error, `檔案處理: ${fileToProcess.name}`);
                return;
            }

            // 更新檔案基本資訊
            setFileBasicInfo((prev: any) => ({
                ...prev,
                hasMultipleSheets: result.fileInfo?.hasMultipleSheets || false
            }));

            console.log(`📊 檔案解析成功，資料筆數: ${result.data.length}，欄位數: ${result.fileInfo?.columns || 0}`);
            setParsedData(result.data);

            // 立即進行欄位分析
            await fetchColumnProfile(result.data);

        } catch (err: unknown) {
            console.error("❌ 檔案處理錯誤:", err);
            const appError = createError(
                ErrorCode.FILE_ERROR,
                ErrorContext.FILE_UPLOAD,
                'file.read_failed',
                {
                    customMessage: `檔案處理失敗: ${err instanceof Error ? err.message : String(err)}`,
                    cause: err instanceof Error ? err : undefined
                }
            );
            errorHandler(appError, `檔案處理: ${fileToProcess.name}`);
        }
    };

    // ==========================================
    // 欄位分析
    const fetchColumnProfile = async (data: any[]) => {
        setColumnAnalysisLoading(true);
        console.log(`🔍 開始分析欄位特性，資料筆數: ${data.length}`);

        try {
            const token = localStorage.getItem("__session") || "";

            if (!token) {
                throw CommonErrors.authTokenMissing();
            }

            if (!process.env.NEXT_PUBLIC_API_URL) {
                throw createError(
                    ErrorCode.SERVER_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    { customMessage: "API URL 未配置" }
                );
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

                // 根據 HTTP 狀態碼創建適當的錯誤
                if (res.status === 401 || res.status === 403) {
                    throw CommonErrors.analysisAuthFailed();
                } else if (res.status >= 500) {
                    throw CommonErrors.serverError(ErrorContext.ANALYSIS);
                } else {
                    throw createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        'column.type_detection_failed',
                        { customMessage: `API 錯誤: ${res.status} - ${errorText}` }
                    );
                }
            }

            const json = await res.json();

            if (json && json.data && json.data.columns && Array.isArray(json.data.columns)) {
                console.log(`✅ 欄位分析成功，發現 ${json.data.columns.length} 個有效欄位`);
                setColumnsPreview(json.data.columns);
                setColumnTypes(json.data.columns);
                setShowPreview(true);
            } else {
                console.warn("⚠️ API 回應格式異常，使用備用方案");
                createFallbackColumnData(data);
            }

        } catch (err: unknown) {
            console.error("❌ 欄位解析錯誤:", err);

            if (err instanceof isAppError) {
                errorHandler(err, "欄位分析");
            } else {
                errorHandler(
                    createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        'column.type_detection_failed',
                        {
                            customMessage: `欄位解析失敗: ${err instanceof Error ? err.message : String(err)}`,
                            cause: err instanceof Error ? err : undefined
                        }
                    ),
                    "欄位分析"
                );
            }

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
            missing_pct: "0.0%",
            suggested_type: "不明"
        }));

        setColumnsPreview(columns);
        setShowPreview(true);
    };

    // ==========================================
    // 分析處理函數
    const handleAnalyze = async () => {
        if (!file) {
            errorHandler(CommonErrors.fileNotSelected(), "分析按鈕點擊");
            return;
        }

        clearError();

        try {
            if (autoMode) {
                await handleAutoAnalyze();
            } else {
                await handleManualAnalyze();
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes('timeout')) {
                errorHandler(CommonErrors.analysisTimeout(), "分析處理超時");
            } else if (err instanceof Error && err.message.includes('unauthorized')) {
                errorHandler(CommonErrors.analysisAuthFailed(), "分析授權失敗");
            } else {
                errorHandler(err, "分析處理");
            }
        }
    };

    const handleManualAnalyze = async () => {
        setLoading(true);
        setCtxFile(file);
        setAutoAnalysisResult(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setLoading(false);
            router.push("/step2");
        } catch (err: unknown) {
            errorHandler(
                createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    undefined,
                    {
                        customMessage: "半自動分析初始化失敗，請重試",
                        cause: err instanceof Error ? err : undefined
                    }
                ),
                "半自動分析"
            );
            setLoading(false);
        }
    };

    const handleAutoAnalyze = async () => {
        if (!file || parsedData.length === 0) {
            errorHandler(CommonErrors.fileNotSelected(), "自動分析");
            return;
        }

        setLoading(true);
        setCtxFile(file);

        try {
            const token = await getToken();
            if (!token) {
                throw CommonErrors.analysisAuthFailed();
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
                if (response.status === 401 || response.status === 403) {
                    throw CommonErrors.analysisAuthFailed();
                } else if (response.status >= 500) {
                    throw CommonErrors.serverError(ErrorContext.ANALYSIS);
                } else {
                    const errorData = await response.json();
                    throw createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        'analysis.auto_failed',
                        { customMessage: errorData.detail || `API 錯誤: ${response.status}` }
                    );
                }
            }

            const result = await response.json();

            if (!result.success) {
                throw createError(
                    ErrorCode.ANALYSIS_ERROR,
                    ErrorContext.ANALYSIS,
                    'analysis.auto_failed',
                    { customMessage: result.message || "自動分析失敗" }
                );
            }

            // 更新 context 狀態
            setCtxGroupVar(result.group_var || "");
            setCtxCatVars(result.cat_vars || []);
            setCtxContVars(result.cont_vars || []);
            setAutoAnalysisResult(result);

            if (result.analysis?.table) {
                setResultTable(result.analysis.table);
            }

            if (result.analysis?.groupCounts) {
                setGroupCounts(result.analysis.groupCounts);
            }

            router.push("/step3");

        } catch (err: unknown) {
            console.error("❌ 自動分析失敗:", err);

            if (err instanceof isAppError) {
                errorHandler(err, "AI 自動分析");
            } else {
                errorHandler(
                    createError(
                        ErrorCode.ANALYSIS_ERROR,
                        ErrorContext.ANALYSIS,
                        'analysis.auto_failed',
                        {
                            customMessage: `自動分析失敗: ${err instanceof Error ? err.message : String(err)}`,
                            cause: err instanceof Error ? err : undefined
                        }
                    ),
                    "AI 自動分析"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 重試函數
    const handleRetryColumnAnalysis = async () => {
        if (parsedData.length > 0) {
            clearError();
            console.log(`🔄 重試欄位分析`);
            await fetchColumnProfile(parsedData);
        }
    };

    // ==========================================
    // 事件處理
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) handleFileSelection(selectedFile);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const selectedFile = e.dataTransfer.files?.[0];
        if (selectedFile) handleFileSelection(selectedFile);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    // ==========================================
    // 取得用戶限制資訊 (已由 hook 提供，移除此函數)

    // ==========================================
    // 錯誤顯示元件
    const ErrorDisplay = () => {
        if (!error) return null;

        const getSeverityColor = () => {
            switch (error.code) {
                case ErrorCode.PRIVACY_ERROR:
                    return "bg-red-50 border-red-200 text-red-800";
                case ErrorCode.AUTH_ERROR:
                    return "bg-blue-50 border-blue-200 text-blue-800";
                case ErrorCode.NETWORK_ERROR:
                case ErrorCode.RATE_LIMIT_ERROR:
                    return "bg-yellow-50 border-yellow-200 text-yellow-800";
                default:
                    return "bg-red-50 border-red-200 text-red-800";
            }
        };

        return (
            <div className={`mb-4 p-4 rounded-lg border ${getSeverityColor()}`}>
                <div className="flex items-center gap-2 mb-2">
                    {error.code === ErrorCode.PRIVACY_ERROR && <Shield className="w-5 h-5" />}
                    {error.code === ErrorCode.AUTH_ERROR && <Shield className="w-5 h-5" />}
                    {(error.code === ErrorCode.NETWORK_ERROR || error.code === ErrorCode.RATE_LIMIT_ERROR) && <AlertTriangle className="w-5 h-5" />}
                    <span className="font-medium">發生錯誤</span>
                    {error.correlationId && (
                        <span className="text-xs opacity-60">#{error.correlationId.slice(-8)}</span>
                    )}
                </div>
                <p className="text-sm mb-3">{error.userMessage}</p>
                <p className="text-xs mb-3 opacity-80">建議動作：{error.action}</p>
                <div className="flex gap-2">
                    <button
                        onClick={clearError}
                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                    >
                        關閉
                    </button>
                    {error.context === ErrorContext.ANALYSIS && (
                        <button
                            onClick={handleRetryColumnAnalysis}
                            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
                        >
                            重試
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const isLoading = loading || sensitiveDetectionLoading;

    // ==========================================
    // 主要渲染
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

                {/* 檔案限制警語 */}
                <div className="mb-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full">
                        {limitsInfo.formattedLimits.userTypeName}: {limitsInfo.formattedLimits.maxSize} • {limitsInfo.formattedLimits.maxRows} 筆 • {limitsInfo.formattedLimits.maxColumns} 欄位
                        {limitsInfo.canUpgradeFile && <span className="ml-2 text-blue-600">↗ 升級</span>}
                    </span>
                </div>

                {/* 隱私提醒 */}
                <div className="flex items-start gap-2 mb-8 text-[18px] lg:text-[20px]">
                    <Shield className="w-6 h-6 text-[#0F2844] mt-1" />
                    <div>
                        <p
                            style={{
                                letterSpacing: "2px",
                                lineHeight: "32px",
                                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                                color: "#0F2844",
                            }}
                            className="mb-2"
                        >
                            <strong>隱私保護提醒：</strong>請務必移除所有個資欄位(如姓名、病歷號、生日等)，避免違反資料安全規範！<br></br>系統將自動檢測敏感資料並提醒您進行處理。
                        </p>
                    </div>
                </div>

                {/* 錯誤訊息顯示 */}
                <ErrorDisplay />

                {/* 上傳區 */}
                <div
                    className={`w-full max-w-[1366px] h-[154px] border rounded-xl flex flex-col items-center justify-center space-y-4 transition-colors duration-200 ${dragOver ? "bg-[#dce3f1] border-blue-300" : "bg-[#EEF2F9] border-[#C4C8D0]"
                        }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* 檔案選擇框 */}
                    <div className="max-w-[549px] max-h-[50px] flex items-center justify-between px-4 border border-[#C4C8D0] bg-white rounded-md relative group">
                        <div className="-mt-1 cursor-pointer">
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer text-[#0F2844] text-xl relative">
                                    <label
                                        htmlFor="file-upload"
                                        className="text-[#0F2844] text-[16px] lg:text-[20px] cursor-pointer hover:text-blue-600 transition-colors"
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
                                    支援Excel檔案(.xlsx、.xls)和CSV檔案(.csv)<br />
                                    {limitsInfo.formattedLimits.userTypeName} 限制：{limitsInfo.formattedLimits.maxSize}，{limitsInfo.formattedLimits.maxRows} 筆資料，{limitsInfo.formattedLimits.maxColumns} 欄位<br />
                                    系統將自動檢測敏感資料並進行隱私保護
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
                                color: fileName ? "#0F2844" : "#9CA3AF",
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
                            disabled={isLoading}
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
                        拖曳檔案至此或點擊選取（限制：{limitsInfo.formattedLimits.maxSize}）
                    </p>

                    {/* 敏感資料檢測載入指示 */}
                    {sensitiveDetectionLoading && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            🔍 正在檢測敏感資料...
                        </div>
                    )}
                </div>

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
                                以下為預覽資料（最多顯示前五列）：
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
                                                const displayValue = FileProcessor.formatDisplayValue(value);

                                                return (
                                                    <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                                                        {displayValue}
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
                                <p className="text-gray-600">🔍 正在分析欄位特性...</p>
                                <p className="text-gray-500 text-sm mt-1">系統正在自動識別資料類型和統計特徵</p>
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
                    </div>
                )}

                {/* 填補缺值選項 */}
                {parsedData.length > 0 && (
                    <div className="flex items-center space-x-1 mt-6">
                        <input
                            type="checkbox"
                            id="fillna"
                            className="w-[25px] h-[25px] rounded-md border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844] cursor-pointer disabled:opacity-50"
                            checked={fillNA}
                            onChange={(e) => setFillNA(e.target.checked)}
                            disabled={isLoading}
                        />
                        <label
                            htmlFor="fillna"
                            className={`text-[20px] text-[#555555] tracking-[2px] leading-[32px] font-bold cursor-pointer transition-opacity ${isLoading ? 'opacity-50' : ''
                                }`}
                        >
                            填補缺值
                        </label>
                        <Tooltip>
                            <TooltipTrigger className="ml-0 text-gray-400 hover:text-gray-600">
                                <CircleQuestionMark className="mt-0.5" />
                            </TooltipTrigger>
                            <TooltipContent>
                                自動填補資料中的缺失值<br />
                                數值型：使用中位數/平均數<br />
                                類別型：使用眾數
                            </TooltipContent>
                        </Tooltip>
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
                                        ? "AI 將自動完成所有分析步驟"
                                        : "手動控制每個分析步驟"
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
                                text={isLoading ? "處理中..." : `開始${autoMode ? ' AI 全自動' : ' 半自動'}分析`}
                                loading={isLoading}
                                disabled={!file || isLoading}
                                onClick={handleAnalyze}
                                iconSrc={autoMode ? "/step1/upload_white.png" : "/step1/upload_white.png"}
                                iconGraySrc="/step1/upload_gray.png"
                                iconHoverSrc={autoMode ? "/step1/upload_white.png" : "/step1/Group_50@2x.png"}
                                className={`min-w-[240px] w-auto transition-all duration-300 ${autoMode
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:text-white'
                                        : ''
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            />
                        </div>

                        {/* 載入狀態下的額外提示 */}
                        {isLoading && (
                            <div className="text-center text-sm text-gray-500">
                                <p>⏱️ 預估時間：{autoMode ? '30-60' : '5-10'} 秒</p>
                                <p className="mt-1">
                                    {sensitiveDetectionLoading
                                        ? "正在進行隱私檢測，請稍候..."
                                        : "請耐心等候，系統正在處理您的資料..."
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Footer />

            {/* 隱私對話框 */}
            <DataPrivacyDialog
                open={showPrivacyDialog}
                onConfirm={handlePrivacyConfirm}
                onCancel={handlePrivacyCancel}
                sensitiveColumns={sensitiveColumns}
                suggestions={privacySuggestions}
                fileInfo={fileBasicInfo}
                warnings={fileValidationWarnings}
            />
        </div>
    );
}