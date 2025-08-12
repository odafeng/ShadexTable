// step1_usePrivacyDetection.ts
import { useState, useCallback } from 'react';
import { FileAnalysisService } from '@/services/step1_fileAnalysisService';
import { useUserLimits } from '@/hooks/general_useUserLimits';
import { CommonErrors } from '@/utils/error';
import { AppError } from '@/types/errors';

interface PrivacyDetectionState {
    showPrivacyDialog: boolean;
    sensitiveColumns: string[];
    privacySuggestions: string[];
    fileBasicInfo: any;
    sensitiveDetectionLoading: boolean;
    pendingFile: File | null;
}

interface UsePrivacyDetectionReturn extends PrivacyDetectionState {
    detectSensitiveData: (file: File) => Promise<{
        success: boolean;
        sensitiveColumns: string[];
        suggestions: string[];
        fileInfo: any;
        data?: any[];
        error?: AppError;
    }>;
    confirmPrivacy: () => void;
    cancelPrivacy: () => void;
    resetPrivacyState: () => void;
}

export function usePrivacyDetection(): UsePrivacyDetectionReturn {
    const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
    const [sensitiveColumns, setSensitiveColumns] = useState<string[]>([]);
    const [privacySuggestions, setPrivacySuggestions] = useState<string[]>([]);
    const [fileBasicInfo, setFileBasicInfo] = useState<any>(null);
    const [sensitiveDetectionLoading, setSensitiveDetectionLoading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    
    const { userType } = useUserLimits();

    const detectSensitiveData = useCallback(async (file: File) => {
        setSensitiveDetectionLoading(true);
        setPendingFile(file);
        
        try {
            const result = await FileAnalysisService.processFileComplete(file, userType);
            
            if (!result.success) {
                setSensitiveDetectionLoading(false);
                return {
                    success: false,
                    sensitiveColumns: [],
                    suggestions: [],
                    fileInfo: null,
                    error: result.error
                };
            }

            // 設定檔案基本資訊
            setFileBasicInfo({
                name: file.name,
                size: file.size,
                rows: result.fileInfo?.rows,
                columns: result.fileInfo?.columns,
                hasMultipleSheets: result.fileInfo?.hasMultipleSheets || false
            });

            // 檢查是否有敏感資料
            if (result.sensitiveColumns && result.sensitiveColumns.length > 0) {
                setSensitiveColumns(result.sensitiveColumns);
                setPrivacySuggestions(result.suggestions || []);
                setShowPrivacyDialog(true);
            } else {
                // 沒有敏感資料，清空相關狀態
                setSensitiveColumns([]);
                setPrivacySuggestions([]);
            }
            
            return {
                success: true,
                sensitiveColumns: result.sensitiveColumns || [],
                suggestions: result.suggestions || [],
                fileInfo: result.fileInfo,
                data: result.data
            };
            
        } catch (error) {
            console.error('❌ 敏感資料檢測失敗:', error);
            return {
                success: false,
                sensitiveColumns: [],
                suggestions: [],
                fileInfo: null,
                error: error as AppError
            };
        } finally {
            setSensitiveDetectionLoading(false);
        }
    }, [userType]);

    const confirmPrivacy = useCallback(() => {
        // 使用者確認繼續，即使有敏感資料
        // 這裡只是關閉對話框，實際處理在父元件
        setShowPrivacyDialog(false);
    }, []);

    const cancelPrivacy = useCallback(() => {
        // 使用者取消上傳
        setShowPrivacyDialog(false);
        resetPrivacyState();
        
        // 清除檔案輸入
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, []);

    const resetPrivacyState = useCallback(() => {
        setPendingFile(null);
        setSensitiveColumns([]);
        setPrivacySuggestions([]);
        setFileBasicInfo(null);
    }, []);

    return {
        showPrivacyDialog,
        sensitiveColumns,
        privacySuggestions,
        fileBasicInfo,
        sensitiveDetectionLoading,
        pendingFile,
        detectSensitiveData,
        confirmPrivacy,
        cancelPrivacy,
        resetPrivacyState
    };
}