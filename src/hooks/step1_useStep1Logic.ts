import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysis } from '@/context/AnalysisContext';
import { useUserLimits, useFileValidation } from '@/hooks/general_useUserLimits';
import { FileAnalysisService, ColumnProfile } from '@/services/step1_fileAnalysisService';
import { createError, createErrorHandler, CommonErrors, ErrorCode, ErrorContext } from '@/utils/error';
import { reportError } from '@/lib/apiClient';
import { AppError } from '@/types/errors';

export function useStep1Logic() {
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

    // 隱私相關狀態
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [sensitiveColumns, setSensitiveColumns] = useState<string[]>([]);
    const [privacySuggestions, setPrivacySuggestions] = useState<string[]>([]);
    const [fileValidationWarnings, setFileValidationWarnings] = useState<string[]>([]);
    const [fileBasicInfo, setFileBasicInfo] = useState<any>(null);
    const [sensitiveDetectionLoading, setSensitiveDetectionLoading] = useState(false);

    // 檔案限制相關
    const limitsInfo = useUserLimits();
    const { validateFile, getFileSizeWarning } = useFileValidation();

    // 錯誤處理器
    const errorHandler = createErrorHandler((appError: AppError) => {
        setError(appError);

        const isTemporaryError = [
            ErrorCode.NETWORK_ERROR,
            ErrorCode.RATE_LIMIT_ERROR
        ].includes(appError.code);

        if (isTemporaryError) {
            setTimeout(() => setError(null), 8000);
        }

        reportError(appError, {
            step: "step1",
            component: "Step1Page",
            fileName: file?.name || pendingFile?.name,
            hasSensitiveData: sensitiveColumns.length > 0,
            autoMode,
            timestamp: new Date().toISOString()
        }).catch(console.warn);
    });

    // 初始化
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

    // 檔案選擇處理
    const handleFileSelection = async (selectedFile: File) => {
        setError(null);
        setSensitiveDetectionLoading(true);
        
        try {
            // 檔案驗證
            const validation = validateFile(selectedFile);
            if (!validation.isValid) {
                errorHandler(validation.error!, `檔案驗證: ${selectedFile.name}`);
                return;
            }

            // 檢查檔案大小警告
            const sizeWarning = getFileSizeWarning(selectedFile);
            const warnings: string[] = [];
            
            if (validation.warnings) warnings.push(...validation.warnings);
            if (sizeWarning) warnings.push(sizeWarning);
            
            setFileValidationWarnings(warnings);
            setPendingFile(selectedFile);

            // 完整檔案處理（包含敏感資料檢測）
            const result = await FileAnalysisService.processFileComplete(selectedFile, limitsInfo.userType);
            
            if (!result.success) {
                errorHandler(result.error, "檔案處理");
                setPendingFile(null);
                return;
            }

            // 設置結果
            setSensitiveColumns(result.sensitiveColumns || []);
            setPrivacySuggestions(result.suggestions || []);
            setFileBasicInfo({
                name: selectedFile.name,
                size: selectedFile.size,
                hasMultipleSheets: result.fileInfo?.hasMultipleSheets || false
            });

            setShowPrivacyDialog(true);

        } catch (err: unknown) {
            console.error("❌ 檔案處理失敗:", err);
            errorHandler(err, "檔案選擇處理");
            setPendingFile(null);
        } finally {
            setSensitiveDetectionLoading(false);
        }
    };

    // 隱私確認
    const handlePrivacyConfirm = async () => {
        if (!pendingFile) {
            errorHandler(CommonErrors.fileNotSelected(), "隱私確認");
            return;
        }

        if (sensitiveColumns.length > 0) {
            errorHandler(CommonErrors.sensitiveDataDetected(), "隱私確認 - 有敏感資料");
            return;
        }

        setShowPrivacyDialog(false);
        
        try {
            // 重新處理檔案獲取資料
            const result = await FileAnalysisService.processFileComplete(pendingFile, limitsInfo.userType);
            
            if (result.success && result.data) {
                setFile(pendingFile);
                setFileName(pendingFile.name);
                setParsedData(result.data);
                
                // 進行欄位分析
                await performColumnAnalysis(result.data);
            }
            
            cleanupPendingState();
        } catch (err: unknown) {
            errorHandler(err, "隱私確認後處理");
        }
    };

    // 欄位分析
    const performColumnAnalysis = async (data: any[]) => {
        setColumnAnalysisLoading(true);
        
        try {
            const token = localStorage.getItem("__session") || "";
            if (!token) throw CommonErrors.authTokenMissing();

            const result = await FileAnalysisService.analyzeColumns(data, token);
            
            if (result.success && result.columns) {
                setColumnsPreview(result.columns);
                setColumnTypes(result.columns);
                setShowPreview(true);
            } else {
                // 使用備用方案
                const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
                setColumnsPreview(fallbackColumns);
                setShowPreview(true);
            }
        } catch (err: unknown) {
            errorHandler(err, "欄位分析");
            const fallbackColumns = FileAnalysisService.createFallbackColumnData(data);
            setColumnsPreview(fallbackColumns);
            setShowPreview(true);
        } finally {
            setColumnAnalysisLoading(false);
        }
    };

    // 分析處理
    const handleAnalyze = async () => {
        if (!file) {
            errorHandler(CommonErrors.fileNotSelected(), "分析按鈕點擊");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            if (autoMode) {
                await handleAutoAnalyze();
            } else {
                await handleManualAnalyze();
            }
        } catch (err: unknown) {
            errorHandler(err, "分析處理");
        } finally {
            setLoading(false);
        }
    };

    const handleManualAnalyze = async () => {
        setCtxFile(file);
        setAutoAnalysisResult(null);
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push("/step2");
    };

    const handleAutoAnalyze = async () => {
        if (!file || parsedData.length === 0) {
            throw CommonErrors.fileNotSelected();
        }

        setCtxFile(file);
        const token = await getToken();
        if (!token) throw CommonErrors.analysisAuthFailed();

        const result = await FileAnalysisService.performAutoAnalysis(parsedData, fillNA, token);
        
        if (!result.success) {
            throw result.error;
        }

        // 更新 context 狀態
        setCtxGroupVar(result.result?.group_var || "");
        setCtxCatVars(result.result?.cat_vars || []);
        setCtxContVars(result.result?.cont_vars || []);
        setAutoAnalysisResult(result.result);

        if (result.result?.analysis?.table) {
            setResultTable(result.result.analysis.table);
        }

        if (result.result?.analysis?.groupCounts) {
            setGroupCounts(result.result.analysis.groupCounts);
        }

        router.push("/step3");
    };

    // 清理函數
    const cleanupPendingState = () => {
        setPendingFile(null);
        setSensitiveColumns([]);
        setPrivacySuggestions([]);
        setFileValidationWarnings([]);
        setFileBasicInfo(null);
    };

    const handlePrivacyCancel = () => {
        setShowPrivacyDialog(false);
        cleanupPendingState();
        
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const clearError = () => setError(null);

    const retryColumnAnalysis = async () => {
        if (parsedData.length > 0) {
            clearError();
            await performColumnAnalysis(parsedData);
        }
    };

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

    const isLoading = loading || sensitiveDetectionLoading;

    return {
        // 狀態
        fileName,
        file,
        error,
        loading,
        dragOver,
        columnsPreview,
        showPreview,
        autoMode,
        columnAnalysisLoading,
        showPrivacyDialog,
        sensitiveColumns,
        privacySuggestions,
        fileValidationWarnings,
        fileBasicInfo,
        sensitiveDetectionLoading,
        limitsInfo,
        parsedData,
        fillNA,
        isLoading,
        isSignedIn,
        
        // 設置函數
        setAutoMode,
        setFillNA,
        
        // 事件處理
        handleFileChange,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handlePrivacyConfirm,
        handlePrivacyCancel,
        handleAnalyze,
        clearError,
        retryColumnAnalysis
    };
}