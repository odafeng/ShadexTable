"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import Image from "next/image";
import ActionButton from "@/components/ui/custom/ActionButton";
import ActionButton2 from "@/components/ui/custom/ActionButton2";

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  showCopyButton?: boolean;
  confirmText?: string;
  onConfirm?: () => void;
  className?: string;
  titleClassName?: string;
  messageClassName?: string;
  buttonAreaClassName?: string;
}

export default function SuccessDialog({ 
  open, 
  onClose, 
  title = "操作成功",
  message,
  showCopyButton = true,
  confirmText = "確定",
  onConfirm,
  className = "",
  titleClassName = "",
  messageClassName = "",
  buttonAreaClassName = ""
}: SuccessDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <AlertDialog.Content
          className={`fixed z-50 max-w-[789px] w-[90vw] min-h-[299px] bg-[#EEF2F9] p-10 rounded-2xl shadow-lg flex flex-col ${className}`}
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {/* 標題 + ICON */}
          <AlertDialog.Title asChild>
            <div className={`flex items-center gap-3 text-[#0F2844] text-[24px] font-bold tracking-[2px] leading-[36px] ${titleClassName}`}>
              <Image
                src="/alert/success_icon@2x.png"
                alt="success"
                width={24}
                height={24}
                onError={(e) => {
                  // 如果成功圖標不存在，使用備用方案
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold';
                    fallback.innerHTML = '✓';
                    parent.appendChild(fallback);
                  }
                }}
              />
              {title}
            </div>
          </AlertDialog.Title>

          {/* 內文 - flex-grow 讓它佔據剩餘空間 */}
          <div className="flex-grow mt-4">
            <div className={`text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px] whitespace-pre-wrap ${messageClassName}`}>
              {message}
            </div>
          </div>

          {/* 按鈕區 - 確保在底部 */}
          <div className={`flex justify-end gap-4 mt-6 ${buttonAreaClassName}`}>
            {showCopyButton && (
              <ActionButton2
                text={copied ? "已複製" : "複製訊息"}
                onClick={handleCopy}
                iconSrc="/alert/copy_dark.png"
                iconHoverSrc="/alert/copy_white.png"
                className="min-w-[160px] whitespace-nowrap cursor-pointer"
              />
            )}

            <ActionButton
              text={confirmText}
              onClick={handleConfirm}
              iconSrc="/alert/check_icon_dark.png"
              iconHoverSrc="/alert/check_icon_white.png"
              className="min-w-[100px] whitespace-nowrap cursor-pointer"
            />
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

// 匯出一個預設配置的版本，方便快速使用
export function SimpleSuccessDialog({ 
  open, 
  onClose, 
  message 
}: { 
  open: boolean; 
  onClose: () => void; 
  message: string 
}) {
  return (
    <SuccessDialog
      open={open}
      onClose={onClose}
      message={message}
      showCopyButton={false}
      confirmText="確定"
    />
  );
}

// 匯出一個填補成功專用的版本
export function FillSuccessDialog({ 
  open, 
  onClose, 
  fillSummary,
  statistics 
}: { 
  open: boolean; 
  onClose: () => void; 
  fillSummary: Array<{
    column: string;
    before_pct: string;
    after_pct: string;
    fill_method: string;
  }>;
  statistics: {
    total_rows: number;
    total_columns: number;
  };
}) {
  const formatFillMethod = (method: string) => {
    const methodMap: Record<string, string> = {
      'mean': '平均值填補',
      'median': '中位數填補',
      'mode': '眾數填補',
      'knn': 'KNN填補',
      'delete_column': '刪除欄位',
      '平均值填補': '平均值填補',
      '中位數填補': '中位數填補',
      '眾數填補': '眾數填補',
      'KNN填補': 'KNN填補',
      '未處理': '未處理'
    };
    return methodMap[method] || method;
  };

  const processedColumns = fillSummary.filter(item => item.fill_method !== "未處理");
  
  const message = `已成功處理 ${processedColumns.length} 個欄位的遺漏值\n\n` +
    `資料統計：\n` +
    `• 總筆數：${statistics.total_rows} 筆\n` +
    `• 總欄位：${statistics.total_columns} 個\n\n` +
    `處理詳情：\n` +
    processedColumns.slice(0, 5).map(item => 
      `• ${item.column}：${item.before_pct} → ${item.after_pct} (${formatFillMethod(item.fill_method)})`
    ).join('\n') +
    (processedColumns.length > 5 ? `\n... 及其他 ${processedColumns.length - 5} 個欄位` : '');

  return (
    <SuccessDialog
      open={open}
      onClose={onClose}
      title="遺漏值處理完成"
      message={message}
      showCopyButton={true}
      confirmText="確定"
    />
  );
}