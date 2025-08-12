"use client";

// Step 1 page implementation for the feature‑based architecture.
// This file was moved from `app/step1/page.tsx` so that the route under `app/` can be
// a thin wrapper.  The imports below reference local feature components via
// relative paths (../components), while shared components continue to use the
// `@/components` alias.

import React from "react";
import { Shield } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import StepNavigator from "@/components/shared/stepNavigator";
import DataPrivacyDialog from "../components/DataPrivacyDialog";
import FileUploadArea from "../components/FileUploadArea";
import DataPreviewTable from "../components/DataPreviewTable";
import ColumnAnalysisDisplay from "../components/ColumnAnalysisDisplay";
import ErrorDisplay from "../components/ErrorDisplay";
import AnalysisControls from "../components/AnalysisControl";
import { useStep1Logic } from "../hooks/useStep1Logic";

export default function Step1Page() {
    const {
        // 狀態
        fileName,
        // file,  // 移除未使用的變數
        error,
        dragOver,
        showPrivacyDialog,
        sensitiveColumns,
        privacySuggestions,
        fileValidationWarnings,
        fileBasicInfo,
        sensitiveDetectionLoading,
        limitsInfo,
        parsedData,
        isLoading,
        isSignedIn,

        // 事件處理
        handleFileChange,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handlePrivacyConfirm,
        handlePrivacyCancel,
        clearError,
        retryColumnAnalysis,
    } = useStep1Logic();

    // 如果尚未登入，避免閃爍不必要的 UI
    if (!isSignedIn) return null;

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

                {/* 檔案限制警語 - 簡約一行式 */}
                <div className="mb-4 text-xs text-gray-500">
                    檔案上限 {limitsInfo.formattedLimits.maxSize} · {limitsInfo.formattedLimits.maxRows}
                    筆資料 · {limitsInfo.formattedLimits.maxColumns} 個欄位
                    {limitsInfo.canUpgradeFile && (
                        <span className="ml-2 text-gray-400 hover:text-blue-500 cursor-pointer transition-colors">
                            · 專業版解鎖更大限制
                        </span>
                    )}
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
                            <strong>隱私保護提醒：</strong>請務必移除所有個資欄位(如姓名、病歷號、生日等)，避免違反資料安全規範！<br />
                            系統將自動檢測敏感資料並提醒您進行處理。
                        </p>
                    </div>
                </div>

                {/* 錯誤訊息顯示 - 保持使用 props */}
                <ErrorDisplay error={error} onClearError={clearError} onRetry={retryColumnAnalysis} />

                {/* 檔案上傳區 - 保持使用 props */}
                <FileUploadArea
                    fileName={fileName}
                    dragOver={dragOver}
                    isLoading={isLoading}
                    limitsInfo={limitsInfo}
                    sensitiveDetectionLoading={sensitiveDetectionLoading}
                    onFileChange={handleFileChange}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                />

                {/* 資料預覽表格 - 保持使用 props */}
                {parsedData.length > 0 && <DataPreviewTable parsedData={parsedData} />}

                {/* 自動欄位解析結果 - 改用 Zustand，不需要傳 props */}
                {parsedData.length > 0 && <ColumnAnalysisDisplay />}

                {/* 分析控制區 - 改用 Zustand，不需要傳 props */}
                {parsedData.length > 0 && <AnalysisControls />}
            </div>

            <Footer />

            {/* 隱私對話框 - 保持使用 props */}
            <DataPrivacyDialog
                open={showPrivacyDialog}
                onConfirm={handlePrivacyConfirm}
                onCancel={handlePrivacyCancel}
                sensitiveColumns={sensitiveColumns}
                suggestions={privacySuggestions}
                fileInfo={fileBasicInfo || undefined}
                warnings={fileValidationWarnings}
            />
        </div>
    );
}