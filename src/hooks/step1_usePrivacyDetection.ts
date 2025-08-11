// hooks/step1/usePrivacyDetection.ts
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
                return {
                    success: false,
                    sensitiveColumns: [],
                    suggestions: [],
                    fileInfo: null,
                    error: result.error
                };
            }

            setSensitiveColumns(result.sensitiveColumns || []);
            setPrivacySuggestions(result.suggestions || []);
            setFileBasicInfo({
                name: file.name,
                size: file.size,
                hasMultipleSheets: result.fileInfo?.hasMultipleSheets || false
            });
            
            setShowPrivacyDialog(true);
            
            return {
                success: true,
                sensitiveColumns: result.sensitiveColumns || [],
                suggestions: result.suggestions || [],
                fileInfo: result.fileInfo,
                data: result.data
            };
            
        } finally {
            setSensitiveDetectionLoading(false);
        }
    }, [userType]);

    const confirmPrivacy = useCallback(() => {
        if (!pendingFile) {
            throw CommonErrors.fileNotSelected();
        }
        
        if (sensitiveColumns.length > 0) {
            throw CommonErrors.sensitiveDataDetected();
        }
        
        setShowPrivacyDialog(false);
    }, [pendingFile, sensitiveColumns]);

    const cancelPrivacy = useCallback(() => {
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