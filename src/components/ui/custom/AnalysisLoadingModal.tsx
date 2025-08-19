// components/ui/custom/AnalysisLoadingModal.tsx - 優化版本
"use client";

import { useEffect, useState, useCallback, memo, useMemo } from "react";

import { createPortal } from "react-dom";

interface LoadingStep {
    id: number;
    title: string;
    subtitle: string;
    duration: number; // 毫秒
}

interface AnalysisLoadingModalProps {
    isOpen: boolean;
    steps: LoadingStep[];
    onComplete?: () => void;
    onCancel?: () => void;
    allowCancel?: boolean;
    autoStart?: boolean;
}

// 使用 memo 優化重新渲染
const AnalysisLoadingModal = memo(function AnalysisLoadingModal({
    isOpen,
    steps,
    onComplete,
    onCancel,
    allowCancel = false,
    autoStart = true
}: AnalysisLoadingModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 確保客戶端渲染
    useEffect(() => {
        setMounted(true);
    }, []);

    // 處理取消
    const handleCancel = useCallback(() => {
        onCancel?.();
    }, [onCancel]);

    // 執行步驟邏輯
    useEffect(() => {
        if (!isOpen || !autoStart) {
            setCurrentStep(0);
            setIsCompleted(false);
            return;
        }

        let timeoutId: NodeJS.Timeout;
        
        const runStep = (stepIndex: number) => {
            if (stepIndex >= steps.length) {
                setIsCompleted(true);
                timeoutId = setTimeout(() => {
                    onComplete?.();
                }, 800);
                return;
            }

            setCurrentStep(stepIndex + 1);
            timeoutId = setTimeout(() => {
                runStep(stepIndex + 1);
            }, steps[stepIndex].duration);
        };

        // 使用 requestAnimationFrame 優化動畫
        requestAnimationFrame(() => {
            runStep(0);
        });

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isOpen, steps, onComplete, autoStart]);

    // 計算當前步驟資料和進度
    const { currentStepData, progress } = useMemo(() => {
        const data = currentStep > 0 ? steps[currentStep - 1] : null;
        const prog = Math.round((currentStep / steps.length) * 100);
        return { currentStepData: data, progress: prog };
    }, [currentStep, steps]);

    if (!isOpen || !mounted) return null;

    const modalContent = (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fadeIn">
            <div className="relative bg-[#EEF2F9] rounded-2xl p-10 max-w-[500px] w-[90vw] text-center shadow-lg animate-slideUp">
                
                {/* 取消按鈕 */}
                {allowCancel && !isCompleted && (
                    <button
                        onClick={handleCancel}
                        className="absolute top-4 right-4 text-[#0F2844]/60 hover:text-[#0F2844] transition-colors"
                        aria-label="取消"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                )}
                
                <div className="relative mb-8">
                    {/* 進階載入動畫 */}
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                        <div className="absolute inset-0 rounded-full bg-[#0F2844]/10 animate-pulse"></div>
                        <svg className="animate-spin w-full h-full text-[#0F2844] drop-shadow-sm" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-[#0F2844] rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* 主要文字 */}
                    <h3 className="text-[#0F2844] text-[24px] font-bold mb-3 tracking-[2px] leading-[36px]">
                        {isCompleted ? "完成！" : currentStepData?.title || "準備中..."}
                    </h3>
                    
                    {/* 副標題 */}
                    <p className="text-[#0F2844]/70 text-[16px] mb-6 tracking-[1px] leading-[28px]">
                        {isCompleted ? "處理完成" : currentStepData?.subtitle || "正在初始化..."}
                    </p>
                    
                    {/* 進度條容器 */}
                    <div className="relative">
                        <div className="w-full bg-[#0F2844]/10 rounded-full h-3 shadow-inner">
                            <div 
                                className="bg-[#0F2844] h-3 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                        
                        {/* 進度百分比 */}
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-[14px] text-[#0F2844]/60 tracking-[0.8px]">進度</span>
                            <span className="text-[16px] text-[#0F2844] font-bold tracking-[1px]">
                                {progress}%
                            </span>
                        </div>
                    </div>
                    
                    {/* 步驟指示器 */}
                    <div className="flex justify-center space-x-2 mt-6">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index < currentStep 
                                        ? 'bg-[#0F2844] shadow-sm' 
                                        : 'bg-[#0F2844]/20'
                                }`}
                            />
                        ))}
                    </div>
                </div>
                
                {/* 完成訊息 */}
                {isCompleted && (
                    <div className="relative animate-fadeIn">
                        <div className="bg-[#0F2844]/5 border border-[#0F2844]/20 rounded-2xl p-4 mb-4">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-6 h-6 bg-[#0F2844] rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <span className="text-[#0F2844] font-bold text-[18px] tracking-[1.5px]">處理完成！</span>
                            </div>
                        </div>
                        <p className="text-[#0F2844]/70 text-[14px] tracking-[0.8px] animate-pulse">
                            即將為您跳轉...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // 使用 Portal 確保 Modal 渲染在 body 底部
    return createPortal(modalContent, document.body);
});

export default AnalysisLoadingModal;