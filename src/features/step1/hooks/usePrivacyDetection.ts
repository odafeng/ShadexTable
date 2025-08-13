// app/features/step1/hooks/usePrivacyDetection.ts

import { useState, useCallback } from "react";
import { FileAnalysisService } from "@/features/step1/services/fileAnalysisService";
import { useUserLimits } from "@/features/auth/hooks/useUserLimits";
import { AppError } from "@/types/errors";
import { isAppError } from "@/utils/error";
import type { DataRow } from "@/stores/analysisStore";

// 定義檔案基本資訊類型
interface FileBasicInfo {
  name: string;
  size: number;
  rows?: number;
  columns?: number;
  hasMultipleSheets: boolean;
}

interface PrivacyDetectionState {
  showPrivacyDialog: boolean;
  sensitiveColumns: string[];
  privacySuggestions: string[];
  fileBasicInfo: FileBasicInfo | null;
  sensitiveDetectionLoading: boolean;
  pendingFile: File | null;
}

interface UsePrivacyDetectionReturn extends PrivacyDetectionState {
  detectSensitiveData: (file: File) => Promise<{
    success: boolean;
    sensitiveColumns: string[];
    suggestions: string[];
    fileInfo: FileBasicInfo | null;
    data?: DataRow[];
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
  const [fileBasicInfo, setFileBasicInfo] = useState<FileBasicInfo | null>(
    null,
  );
  const [sensitiveDetectionLoading, setSensitiveDetectionLoading] =
    useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { userType } = useUserLimits();

  const resetPrivacyState = useCallback(() => {
    setPendingFile(null);
    setSensitiveColumns([]);
    setPrivacySuggestions([]);
    setFileBasicInfo(null);
    // 不要在這裡重置 showPrivacyDialog
  }, []);

  const detectSensitiveData = useCallback(
    async (file: File) => {
      console.log("🔍 開始檢測敏感資料:", file.name);
      console.log("📊 當前 showPrivacyDialog 狀態:", showPrivacyDialog);
      setSensitiveDetectionLoading(true);
      setPendingFile(file);

      try {
        const result = await FileAnalysisService.processFileComplete(
          file,
          userType,
        );

        if (!result.success) {
          setSensitiveDetectionLoading(false);
          console.log("❌ 檔案處理失敗");

          const appError =
            result.error && isAppError(result.error) ? result.error : undefined;

          return {
            success: false,
            sensitiveColumns: [],
            suggestions: [],
            fileInfo: null,
            error: appError,
          };
        }

        // 設定檔案基本資訊
        const basicInfo: FileBasicInfo = {
          name: file.name,
          size: file.size,
          rows: result.fileInfo?.rows,
          columns: result.fileInfo?.columns,
          hasMultipleSheets: result.fileInfo?.hasMultipleSheets || false,
        };
        setFileBasicInfo(basicInfo);

        // 檢查是否有敏感資料
        if (result.sensitiveColumns && result.sensitiveColumns.length > 0) {
          console.log("⚠️ 偵測到敏感欄位:", result.sensitiveColumns);
          setSensitiveColumns(result.sensitiveColumns);
          setPrivacySuggestions(result.suggestions || []);

          console.log("🚀 準備顯示對話框，敏感欄位:", result.sensitiveColumns);
          setShowPrivacyDialog(true);
        } else {
          console.log("✅ 沒有偵測到敏感資料");
          setSensitiveColumns([]);
          setPrivacySuggestions([]);

          // 沒有敏感資料也要顯示隱私聲明對話框
          setTimeout(() => {
            setShowPrivacyDialog(true);
            console.log("✅ 顯示隱私聲明對話框");
          }, 100);
        }

        return {
          success: true,
          sensitiveColumns: result.sensitiveColumns || [],
          suggestions: result.suggestions || [],
          fileInfo: basicInfo,
          data: result.data,
        };
      } catch (error) {
        console.error("❌ 敏感資料檢測失敗:", error);
        return {
          success: false,
          sensitiveColumns: [],
          suggestions: [],
          fileInfo: null,
          error: error as AppError,
        };
      } finally {
        setSensitiveDetectionLoading(false);
      }
    },
    [userType],
  );

  const confirmPrivacy = useCallback(() => {
    console.log("✅ 使用者確認隱私");
    // 使用者確認繼續，即使有敏感資料
    // 這裡只是關閉對話框，實際處理在父元件
    setShowPrivacyDialog(false);
  }, []);

  const cancelPrivacy = useCallback(() => {
    console.log("❌ 使用者取消上傳");
    // 使用者取消上傳
    setShowPrivacyDialog(false);
    resetPrivacyState();

    // 清除檔案輸入
    const fileInput = document.getElementById(
      "file-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }, [resetPrivacyState]);

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
    resetPrivacyState,
  };
}
