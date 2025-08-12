// step1_useStep1Logic.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useUserLimits } from '@/features/auth/hooks/useUserLimits';
import { FileAnalysisService } from '@/features/step1/services/fileAnalysisService';
import { createErrorHandler, CommonErrors } from '@/utils/error';
import { reportError } from '@/lib/reportError';
import { AppError } from '@/types/errors';
import { useFileValidation } from './useFileValidation';
import { usePrivacyDetection } from './usePrivacyDetection';
import { useColumnAnalysis } from './useColumnAnalysis';
import { useAnalysisTrigger } from './useAnalysisTrigger';

export function useStep1Logic() {
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();
    
    const parsedData = useAnalysisStore(state => state.parsedData);
    const setParsedData = useAnalysisStore(state => state.setParsedData);
    const fillNA = useAnalysisStore(state => state.fillNA);
    const setFillNA = useAnalysisStore(state => state.setFillNA);
    const setColumnTypes = useAnalysisStore(state => state.setColumnTypes);
    const setFile: (file: File | null) => void = useAnalysisStore(state => state.setFile);

    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setLocalFile] = useState<File | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const fileValidation = useFileValidation();
    const privacyDetection = usePrivacyDetection();
    const columnAnalysis = useColumnAnalysis();
    const analysisTrigger = useAnalysisTrigger();
    const limitsInfo = useUserLimits();

    const errorHandler = createErrorHandler((appError: AppError) => {
        setError(appError);
        
        reportError(appError, {
            step: "step1",
            component: "Step1Page",
            fileName: file?.name || privacyDetection.pendingFile?.name,
            hasSensitiveData: privacyDetection.sensitiveColumns.length > 0,
            autoMode: analysisTrigger.autoMode,
            timestamp: new Date().toISOString()
        }).catch(console.warn);
    });

    useEffect(() => {
        getToken()
            .then((token) => {
                if (token) localStorage.setItem("__session", token);
            })
            .catch((err) => {
                console.warn("無法取得初始 token:", err);
            });
    }, [getToken]);

    useEffect(() => {
        if (isSignedIn === false) {
            router.push("/sign-in");
        }
    }, [isSignedIn, router]);

    // 🔥 修正：確保取得 token 後再進行欄位分析
    const handleFileSelection = useCallback(async (selectedFile: File) => {
        setError(null);
        
        try {
            // 步驟 1: 檔案驗證
            const validation = await fileValidation.validateAndPrepareFile(selectedFile);
            if (!validation.isValid) {
                errorHandler(validation.error!, `檔案驗證: ${selectedFile.name}`);
                return;
            }

            // 步驟 2: 隱私檢測和檔案處理
            const privacyResult = await privacyDetection.detectSensitiveData(selectedFile);
            
            if (!privacyResult.success) {
                errorHandler(privacyResult.error!, "檔案處理");
                return;
            }

            // 檢查是否有敏感資料
            if (privacyResult.sensitiveColumns && privacyResult.sensitiveColumns.length > 0) {
                // 有敏感資料，對話框會自動顯示
                console.log("🔍 偵測到敏感資料，等待使用者確認");
                return;
            }

            // 沒有敏感資料，直接處理檔案
            if (privacyResult.data) {
                setLocalFile(selectedFile);
                setFile(selectedFile);
                setFileName(selectedFile.name);
                setParsedData(privacyResult.data);
                
                // 🔥 修正：確保取得 token 後再進行欄位分析
                try {
                    const token = await getToken();
                    if (token) {
                        localStorage.setItem("__session", token);
                        await columnAnalysis.analyzeColumns(privacyResult.data, token, setColumnTypes);
                    } else {
                        console.warn("⚠️ 無法取得 token，跳過欄位分析");
                        // 使用備用欄位資料
                        const fallbackColumns = FileAnalysisService.createFallbackColumnData(privacyResult.data);
                        if (setColumnTypes) {
                            const fallbackTypesData = fallbackColumns.map(col => ({
                                column: col.column,
                                suggested_type: col.suggested_type
                            }));
                            setColumnTypes(fallbackTypesData);
                        }
                    }
                } catch (columnError) {
                    console.error("⚠️ 欄位分析失敗:", columnError);
                    // 不中斷流程，使用備用方案
                    const fallbackColumns = FileAnalysisService.createFallbackColumnData(privacyResult.data);
                    if (setColumnTypes) {
                        const fallbackTypesData = fallbackColumns.map(col => ({
                            column: col.column,
                            suggested_type: col.suggested_type
                        }));
                        setColumnTypes(fallbackTypesData);
                    }
                }
            }

        } catch (err: unknown) {
            console.error("❌ 檔案處理失敗:", err);
            errorHandler(err, "檔案選擇處理");
            privacyDetection.resetPrivacyState();
        }
    }, [fileValidation, privacyDetection, columnAnalysis, setParsedData, setColumnTypes, setFile, errorHandler, getToken]);

    // 🔥 修正：隱私確認處理也要確保 token
    const handlePrivacyConfirm = useCallback(async () => {
        try {
            privacyDetection.confirmPrivacy();
            
            if (!privacyDetection.pendingFile) {
                errorHandler(CommonErrors.fileNotSelected(), "隱私確認");
                return;
            }

            // 重新處理檔案獲取資料
            const result = await FileAnalysisService.processFileComplete(
                privacyDetection.pendingFile, 
                limitsInfo.userType
            );
            
            if (result.success && result.data) {
                setLocalFile(privacyDetection.pendingFile);
                setFile(privacyDetection.pendingFile);
                setFileName(privacyDetection.pendingFile.name);
                setParsedData(result.data);
                
                // 🔥 修正：確保取得 token 後再進行欄位分析
                try {
                    const token = await getToken();
                    if (token) {
                        localStorage.setItem("__session", token);
                        await columnAnalysis.analyzeColumns(result.data, token, setColumnTypes);
                    } else {
                        console.warn("⚠️ 無法取得 token，使用備用欄位資料");
                        const fallbackColumns = FileAnalysisService.createFallbackColumnData(result.data);
                        if (setColumnTypes) {
                            const fallbackTypesData = fallbackColumns.map(col => ({
                                column: col.column,
                                suggested_type: col.suggested_type
                            }));
                            setColumnTypes(fallbackTypesData);
                        }
                    }
                } catch (columnError) {
                    console.error("⚠️ 欄位分析失敗:", columnError);
                    // 使用備用方案
                    const fallbackColumns = FileAnalysisService.createFallbackColumnData(result.data);
                    if (setColumnTypes) {
                        const fallbackTypesData = fallbackColumns.map(col => ({
                            column: col.column,
                            suggested_type: col.suggested_type
                        }));
                        setColumnTypes(fallbackTypesData);
                    }
                }
            }
            
            privacyDetection.resetPrivacyState();
            fileValidation.clearWarnings();
            
        } catch (err: unknown) {
            errorHandler(err, "隱私確認後處理");
        }
    }, [
        privacyDetection, 
        limitsInfo.userType, 
        columnAnalysis, 
        setParsedData,
        setColumnTypes,
        setFile,
        fileValidation,
        errorHandler,
        getToken
    ]);

    // 分析處理
    const handleAnalyze = useCallback(async () => {
        setError(null);
        
        const storeFile = useAnalysisStore.getState().file;
        
        if (!storeFile) {
            errorHandler(CommonErrors.fileNotSelected(), "分析處理 - 無檔案");
            return;
        }
        
        try {
            await analysisTrigger.triggerAnalysis(storeFile);
        } catch (err: unknown) {
            errorHandler(err, "分析處理");
        }
    }, [analysisTrigger, errorHandler]);

    // 重試欄位分析
    const retryColumnAnalysis = useCallback(async () => {
        if (parsedData.length > 0) {
            setError(null);
            try {
                // 🔥 修正：重試時也要取得 token
                const token = await getToken();
                if (token) {
                    await columnAnalysis.retryAnalysis(parsedData, setColumnTypes);
                } else {
                    errorHandler(CommonErrors.authTokenMissing(), "重試欄位分析");
                }
            } catch (err: unknown) {
                errorHandler(err, "重試欄位分析");
            }
        }
    }, [parsedData, columnAnalysis, setColumnTypes, errorHandler, getToken]);

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

    const clearError = () => setError(null);

    const isLoading = analysisTrigger.loading || 
                     privacyDetection.sensitiveDetectionLoading ||
                     columnAnalysis.columnAnalysisLoading;

    return {
        fileName,
        file,
        error,
        dragOver,
        parsedData,
        fillNA,
        isLoading,
        isSignedIn,
        limitsInfo,
        loading: analysisTrigger.loading,
        autoMode: analysisTrigger.autoMode,
        columnsPreview: columnAnalysis.columnsPreview,
        showPreview: columnAnalysis.showPreview,
        columnAnalysisLoading: columnAnalysis.columnAnalysisLoading,
        showPrivacyDialog: privacyDetection.showPrivacyDialog,
        sensitiveColumns: privacyDetection.sensitiveColumns,
        privacySuggestions: privacyDetection.privacySuggestions,
        fileValidationWarnings: fileValidation.fileValidationWarnings,
        fileBasicInfo: privacyDetection.fileBasicInfo,
        sensitiveDetectionLoading: privacyDetection.sensitiveDetectionLoading,
        setAutoMode: analysisTrigger.setAutoMode,
        setFillNA,
        handleFileChange,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handlePrivacyConfirm,
        handlePrivacyCancel: privacyDetection.cancelPrivacy,
        handleAnalyze,
        clearError,
        retryColumnAnalysis
    };
}