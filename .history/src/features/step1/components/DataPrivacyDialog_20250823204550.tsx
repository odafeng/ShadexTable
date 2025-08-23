"use client";

import { useState } from "react";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Image from "next/image";

import ActionButton from "@/components/ui/custom/ActionButton";
import ActionButton2 from "@/components/ui/custom/ActionButton2";
import { reportError } from "@/lib/reportError";

// 使用統一錯誤處理系統
import { AppError } from '@/types/errors'
import { 
    ErrorCode, 
    createError, 
    createErrorHandler,
    CommonErrors 
} from "@/utils/error";
import { FileProcessor } from "@/utils/fileProcessor";

interface Props {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    sensitiveColumns?: string[];
    suggestions?: string[];
    fileInfo?: {
        name: string;
        size: number;
        hasMultipleSheets?: boolean;
    };
    warnings?: string[];
}

export default function DataPrivacyDialog({ 
    open, 
    onConfirm, 
    onCancel, 
    sensitiveColumns = [], 
    suggestions = [],
    fileInfo,
    warnings = []
}: Props) {
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const hasSensitiveData = sensitiveColumns.length > 0;

    // 統一錯誤處理器
    const errorHandler = createErrorHandler((appError: AppError) => {
        setError(appError);
        // 同時記錄到外部系統
        reportError(appError, { 
            component: "DataPrivacyDialog", 
            fileName: fileInfo?.name,
            hasSensitiveData,
            sensitiveColumns: sensitiveColumns.length 
        });
    });

    // 錯誤清除函數
    const clearError = () => setError(null);

    const handleConfirm = async () => {
        // 驗證使用者同意條款（僅在無敏感資料時）
        if (!hasSensitiveData && !agreed) {
            errorHandler(CommonErrors.privacyAgreementRequired(), "確認按鈕 - 未同意條款");
            return;
        }

        // 有敏感資料時不允許確認
        if (hasSensitiveData) {
            errorHandler(CommonErrors.sensitiveDataDetected(), "確認按鈕 - 有敏感資料");
            return;
        }

        setIsProcessing(true);
        clearError();

        try {
            onConfirm();
        } catch (err) {
            errorHandler(
                createError(ErrorCode.PRIVACY_ERROR, undefined, undefined, {
                    customMessage: "隱私確認失敗，請重試",
                    cause: err instanceof Error ? err : undefined
                }),
                "隱私確認處理"
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        try {
            onCancel();
        } catch {
            // 記錄取消時的錯誤，但不阻擋用戶操作
            errorHandler(
                createError(ErrorCode.UNKNOWN_ERROR, undefined, undefined, {
                    customMessage: "取消操作時發生錯誤"
                }),
                "取消操作"
            );
        }
    };

    const handleAgreementChange = (checked: boolean) => {
        setAgreed(checked);
        if (checked) {
            clearError(); // 清除同意相關的錯誤
        }
    };

    return (
        <AlertDialog.Root open={open}>
            <AlertDialog.Portal>
                <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
                <AlertDialog.Content
                    className="fixed z-50 w-[90vw] sm:max-w-[900px] max-h-[80vh] bg-[#EEF2F9] p-6 sm:p-8 rounded-2xl shadow-lg overflow-y-auto"
                    style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                    {/* 標題 */}
                    <AlertDialog.Title asChild>
                        <div className="flex items-center gap-3 text-[#0F2844] text-[20px] sm:text-[24px] font-bold tracking-[2px] leading-[30px] sm:leading-[36px] mb-4">
                            <Image
                                src={hasSensitiveData ? "/step1/alert_icon@2x.png" : "/step1/privacy_icon.png"}
                                alt={hasSensitiveData ? "warning" : "privacy"}
                                width={24}
                                height={24}
                            />
                            {hasSensitiveData ? "偵測到敏感資料" : "資料隱私聲明"}
                        </div>
                    </AlertDialog.Title>

                    {/* 錯誤訊息顯示 - 使用統一錯誤處理 */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-600">⚠️</span>
                                <span className="font-medium text-red-800">發生錯誤</span>
                            </div>
                            <p className="text-red-700 text-sm mb-3">{error.userMessage}</p>
                            <p className="text-red-600 text-xs mb-3">建議動作：{error.action}</p>
                            {error.correlation_id && (
                                <p className="text-red-500 text-xs mb-3">錯誤代碼: {error.correlation_id}</p>
                            )}
                            <button
                                onClick={clearError}
                                className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                            >
                                我知道了
                            </button>
                        </div>
                    )}

                    {/* 檔案資訊 */}
                    {fileInfo && (
                        <div className="bg-white/50 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-[#0F2844] mb-2">檔案資訊</h3>
                            <p className="text-sm text-[#0F2844]">
                                檔案名稱：{fileInfo.name}<br/>
                                檔案大小：{FileProcessor.formatFileSize(fileInfo.size)}
                                {fileInfo.hasMultipleSheets && (
                                    <><br/><span className="text-orange-600">⚠️ 檔案包含多個工作表，系統將讀取第一個工作表</span></>
                                )}
                            </p>
                        </div>
                    )}

                    {/* 警告訊息 */}
                    {warnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-yellow-800 mb-2">📋 注意事項</h3>
                            {warnings.map((warning, index) => (
                                <p key={index} className="text-sm text-yellow-700 mb-1">• {warning}</p>
                            ))}
                        </div>
                    )}

                    {/* 敏感資料警告 */}
                    {hasSensitiveData ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-red-800 mb-3">🚫 發現敏感欄位</h3>
                            <div className="mb-3">
                                <p className="text-sm text-red-700 mb-2">以下欄位可能包含個人敏感資料：</p>
                                <div className="flex flex-wrap gap-2">
                                    {sensitiveColumns.map((column, index) => (
                                        <span key={index} className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs">
                                            {column}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-red-700 mb-2">建議處理方式：</p>
                                <ul className="text-xs text-red-600 space-y-1">
                                    {suggestions.map((suggestion, index) => (
                                        <li key={index}>• {suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                            <p className="text-sm text-red-800 font-semibold mt-3">
                                ❌ 為保護個人隱私，請移除敏感欄位後重新上傳
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* 隱私聲明 */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="text-sm text-[#0F2844] space-y-2">
                                    <p>• 請確認您的檔案不包含任何個人識別資訊，包括但不限於：</p>
                                    <p className="ml-4">- 姓名、身分證號、病歷號</p>
                                    <p className="ml-4">- 電話號碼、地址、電子郵件</p>
                                    <p className="ml-4">- 出生日期或其他可識別個人身分的資訊</p>
                                    <p>• 上傳的資料僅用於統計分析，不會用於其他用途</p>
                                    <p>• 分析結果不會儲存個人資料</p>
                                    <p>• 如有疑慮，請先進行資料去識別化處理</p>
                                </div>
                            </div>

                            {/* 同意確認 */}
                            <div className="flex items-start space-x-3 mb-6">
                                <input
                                    type="checkbox"
                                    id="privacy-agreement"
                                    className="w-5 h-5 rounded border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844] cursor-pointer mt-0.5"
                                    checked={agreed}
                                    onChange={(e) => handleAgreementChange(e.target.checked)}
                                />
                                <label htmlFor="privacy-agreement" className="text-sm text-[#0F2844] cursor-pointer">
                                    我確認已詳細閱讀上述聲明，並保證上傳的檔案不包含任何個人敏感資料。我理解並同意按照隱私聲明使用此服務。
                                </label>
                            </div>
                        </>
                    )}

                    {/* 按鈕區 */}
                    <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-3 sm:gap-4">
                        {/* 取消/重新選擇檔案按鈕 */}
                        <ActionButton2
                            text={hasSensitiveData ? "重新選擇檔案" : "取消"}
                            onClick={handleCancel}
                            iconSrc="/alert/close_icon_dark.png"
                            iconHoverSrc="/alert/close_icon@2x.png"
                            className="w-full sm:w-auto"
                            disabled={isProcessing}
                        />

                        {/* 確認上傳按鈕 - 只在沒有敏感資料時顯示 */}
                        {!hasSensitiveData && (
                            <ActionButton
                                text={isProcessing ? "確認中..." : "確認上傳"}
                                onClick={handleConfirm}
                                disabled={!agreed || isProcessing}
                                loading={isProcessing}
                                iconSrc="/step1/upload_white.png"
                                iconGraySrc="/step1/upload_gray.png"
                                iconHoverSrc="/step1/Group_50@2x.png"
                                className="w-full sm:w-auto"
                            />
                        )}
                    </div>
                </AlertDialog.Content>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    );
}