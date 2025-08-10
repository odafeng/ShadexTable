import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
    return (
        <div
            className={`w-full max-w-[1366px] h-[154px] border rounded-xl flex flex-col items-center justify-center space-y-4 transition-colors duration-200 ${
                dragOver ? "bg-[#dce3f1] border-blue-300" : "bg-[#EEF2F9] border-[#C4C8D0]"
            }`}
            onDrop={onDrop}
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
                    onChange={onFileChange}
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