// FileUploadArea.tsx
import React, { useRef } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { FileProcessor } from '@/utils/fileProcessor';
import { toast } from 'sonner';

interface FileUploadAreaProps {
    fileName: string | null;
    dragOver: boolean;
    isLoading: boolean;
    limitsInfo: {
        formattedLimits: {
            userTypeName: string;
            maxSize: string;
            maxRows: string;
            maxColumns: string;
        };
        userType?: 'GENERAL' | 'PROFESSIONAL';
    };
    sensitiveDetectionLoading: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: () => void;
}

export default function FileUploadArea({
    fileName,
    dragOver,
    isLoading,
    limitsInfo,
    sensitiveDetectionLoading,
    onFileChange,
    onDrop,
    onDragOver,
    onDragLeave
}: FileUploadAreaProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 前端快速驗證
    const validateFileBeforeUpload = (file: File): boolean => {
        const userType = limitsInfo.userType || 'GENERAL';
        
        // 1. 檢查 MIME 類型
        const allowedMimeTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        // 有些瀏覽器可能無法正確識別 CSV 的 MIME type
        if (file.type && !allowedMimeTypes.includes(file.type)) {
            // 檢查副檔名作為備用方案
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!['.csv', '.xls', '.xlsx'].includes(ext)) {
                toast.error('不支援的檔案格式', {
                    description: '請選擇 CSV 或 Excel 檔案（.csv, .xls, .xlsx）',
                    duration: 5000
                });
                return false;
            }
        }
        
        // 2. 使用 FileProcessor 進行完整驗證
        const validation = FileProcessor.validateFile(file, userType);
        
        if (!validation.isValid && validation.error) {
            // 顯示錯誤訊息
            toast.error(validation.error.userMessage, {
                description: validation.error.action,
                duration: 5000
            });
            return false;
        }

        // 顯示警告訊息（如果有）
        if (validation.warnings && validation.warnings.length > 0) {
            validation.warnings.forEach(warning => {
                toast.warning(warning, { duration: 4000 });
            });
        }

        return true;
    };

    // 增強的檔案選擇處理
    const handleEnhancedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        if (!file) {
            // 使用者取消選擇，不顯示錯誤
            return;
        }

        // 前端驗證
        if (!validateFileBeforeUpload(file)) {
            // 清除檔案選擇
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // 通過驗證，呼叫原始的 onFileChange
        onFileChange(e);
    };

    // 增強的拖放處理
    const handleEnhancedDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        
        if (files.length === 0) {
            onDragLeave();
            return;
        }

        if (files.length > 1) {
            toast.error('請一次只上傳一個檔案', {
                description: '系統一次只能處理一個檔案',
                duration: 4000
            });
            onDragLeave();
            return;
        }

        const file = files[0];

        // 前端驗證
        if (!validateFileBeforeUpload(file)) {
            onDragLeave();
            return;
        }

        // 通過驗證，呼叫原始的 onDrop
        onDrop(e);
    };

    return (
        <div
            className={`w-full max-w-[1366px] h-[154px] border rounded-xl flex flex-col items-center justify-center space-y-4 transition-colors duration-200 ${
                dragOver ? "bg-[#dce3f1] border-blue-300" : "bg-[#EEF2F9] border-[#C4C8D0]"
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDrop={handleEnhancedDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            {/* 檔案選擇框 */}
            <div className="max-w-[549px] max-h-[50px] flex items-center justify-between px-4 border border-[#C4C8D0] bg-white rounded-md relative group">
                <div className="-mt-1 cursor-pointer">
                    <Tooltip>
                        <TooltipTrigger className="cursor-pointer text-[#0F2844] text-xl relative">
                            <label
                                htmlFor="file-upload"
                                className={`text-[#0F2844] text-[16px] lg:text-[20px] cursor-pointer hover:text-blue-600 transition-colors ${
                                    isLoading ? 'pointer-events-none opacity-50' : ''
                                }`}
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
                    ref={fileInputRef}
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleEnhancedFileChange}
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
    );
}