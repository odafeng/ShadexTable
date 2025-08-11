// hooks/step1/useStep1Logic.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useAnalysis } from '@/context/AnalysisContext';
import { useUserLimits } from '@/hooks/general_useUserLimits';
import { FileAnalysisService } from '@/services/step1_fileAnalysisService';
import { createErrorHandler, CommonErrors } from '@/utils/error';
import { reportError } from '@/lib/apiClient';
import { AppError } from '@/types/errors';
import { useFileValidation } from './step1_useFileValidation';
import { usePrivacyDetection } from './step1_usePrivacyDetection';
import { useColumnAnalysis } from './step1_useColumnAnalysis';
import { useAnalysisTrigger } from './step1_useAnalysisTrigger';

export function useStep1Logic() {
    const router = useRouter();
    const { getToken, isSignedIn } = useAuth();
    const {
        parsedData,
        setParsedData,
        fillNA,
        setFillNA,
        setColumnTypes,
    } = useAnalysis();

    // 基本狀態
    const [fileName, setFileName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<AppError | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // 使用拆分後的 hooks
    const fileValidation = useFileValidation();
    const privacyDetection = usePrivacyDetection();
    const columnAnalysis = useColumnAnalysis(setColumnTypes);
    const analysisTrigger = useAnalysisTrigger();
    const limitsInfo = useUserLimits();

    // 錯誤處理器
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
    const handleFileSelection = useCallback(async (selectedFile: File) => {
        setError(null);
        
        try {
            // 步驟 1: 檔案驗證
            const validation = await fileValidation.validateAndPrepareFile(selectedFile);
            if (!validation.isValid) {
                errorHandler(validation.error!, `檔案驗證: ${selectedFile.name}`);
                return;
            }

            // 步驟 2: 隱私檢測
            const privacyResult = await privacyDetection.detectSensitiveData(selectedFile);
            
            if (!privacyResult.success) {
                errorHandler(privacyResult.error!, "檔案處理");
                return;
            }

        } catch (err: unknown) {
            console.error("❌ 檔案處理失敗:", err);
            errorHandler(err, "檔案選擇處理");
            privacyDetection.resetPrivacyState();
        }
    }, [fileValidation, privacyDetection, errorHandler]);

    // 隱私確認處理
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
                setFile(privacyDetection.pendingFile);
                setFileName(privacyDetection.pendingFile.name);
                setParsedData(result.data);
                
                // 進行欄位分析
                await columnAnalysis.analyzeColumns(result.data);
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
        fileValidation,
        errorHandler
    ]);

    // 分析處理
    const handleAnalyze = useCallback(async () => {
        setError(null);
        
        try {
            await analysisTrigger.triggerAnalysis(file);
        } catch (err: unknown) {
            errorHandler(err, "分析處理");
        }
    }, [file, analysisTrigger, errorHandler]);

    // 重試欄位分析
    const retryColumnAnalysis = useCallback(async () => {
        if (parsedData.length > 0) {
            setError(null);
            try {
                await columnAnalysis.retryAnalysis(parsedData);
            } catch (err: unknown) {
                errorHandler(err, "重試欄位分析");
            }
        }
    }, [parsedData, columnAnalysis, errorHandler]);

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

    // 計算總體載入狀態
    const isLoading = analysisTrigger.loading || 
                     privacyDetection.sensitiveDetectionLoading ||
                     columnAnalysis.columnAnalysisLoading;

    return {
        // 基本狀態
        fileName,
        file,
        error,
        dragOver,
        parsedData,
        fillNA,
        isLoading,
        isSignedIn,
        limitsInfo,
        
        // 從其他 hooks 的狀態
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
        
        // 設置函數
        setAutoMode: analysisTrigger.setAutoMode,
        setFillNA,
        
        // 事件處理
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