// step1/components/AnalysisControl.tsx
import React from 'react';
import { CircleQuestionMark } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ToggleSwitch from "@/components/ToggleSwitch";
import ActionButton from "@/components/ActionButton";
import { useAnalysisStore } from '@/stores/analysisStore';
import { useAnalysisTrigger } from '@/hooks/step1_useAnalysisTrigger';

export default function AnalysisControls() {
    // 從 Zustand 獲取需要的狀態
    const file = useAnalysisStore(state => state.file);
    const fillNA = useAnalysisStore(state => state.fillNA);
    const setFillNA = useAnalysisStore(state => state.setFillNA);
    
    // 使用 Analysis Trigger Hook
    const {
        autoMode,
        setAutoMode,
        loading,
        triggerAnalysis
    } = useAnalysisTrigger();
    
    // 處理分析
    const handleAnalyze = async () => {
        try {
            await triggerAnalysis(file);
        } catch (err) {
            console.error('分析錯誤:', err);
        }
    };
    
    // 從其他地方可能需要的狀態（如果需要可以加入）
    const sensitiveDetectionLoading = false; // 可以從 usePrivacyDetection 取得
    
    return (
        <>
            {/* 填補缺值選項 */}
            <div className="flex items-center space-x-1 mt-6">
                <input
                    type="checkbox"
                    id="fillna"
                    className="w-[25px] h-[25px] rounded-md border border-gray-400 bg-white checked:bg-[#0F2844] checked:border-[#0F2844] cursor-pointer disabled:opacity-50"
                    checked={fillNA}
                    onChange={(e) => setFillNA(e.target.checked)}
                    disabled={loading}
                />
                <label
                    htmlFor="fillna"
                    className={`text-[20px] text-[#555555] tracking-[2px] leading-[32px] font-bold cursor-pointer transition-opacity ${
                        loading ? 'opacity-50' : ''
                    }`}
                >
                    填補缺值
                </label>
                <Tooltip>
                    <TooltipTrigger className="ml-0 text-gray-400 hover:text-gray-600">
                        <CircleQuestionMark className="mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                        自動填補資料中的缺失值<br />
                        數值型：使用中位數/平均數<br />
                        類別型：使用眾數
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* 模式選擇和分析按鈕 */}
            <div className="flex flex-col items-center gap-8 mt-8">
                {/* AutoMode 開關 */}
                <div className="flex flex-col items-center gap-4">
                    <ToggleSwitch
                        checked={autoMode}
                        onCheckedChange={setAutoMode}
                        label="AI 全自動分析模式"
                        size="sm"
                        className="justify-center"
                        labelClassName="text-[20px] font-bold tracking-[1px]"
                    />

                    {/* 模式說明 */}
                    <div className="text-center">
                        <div className={`text-sm font-medium transition-all duration-300 ${
                            autoMode ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                            {autoMode
                                ? "AI 將自動完成所有分析步驟"
                                : "手動控制每個分析步驟"
                            }
                        </div>
                        <div className="text-xs text-gray-500 mt-1 max-w-md">
                            {autoMode
                                ? "包含資料預處理、變項選擇、統計分析等，一鍵完成全部流程"
                                : "您可以逐步檢視和調整分析參數，完全掌控分析過程"
                            }
                        </div>
                    </div>
                </div>

                {/* 統一的開始分析按鈕 */}
                <div className="flex justify-center">
                    <ActionButton
                        text={loading ? "處理中..." : `開始${autoMode ? ' AI 全自動' : ' 半自動'}分析`}
                        loading={loading}
                        disabled={!file || loading}
                        onClick={handleAnalyze}
                        iconSrc={autoMode ? "/step1/upload_white.png" : "/step1/upload_white.png"}
                        iconGraySrc="/step1/upload_gray.png"
                        iconHoverSrc={autoMode ? "/step1/upload_white.png" : "/step1/Group_50@2x.png"}
                        className={`min-w-[240px] w-auto transition-all duration-300 ${
                            autoMode
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:text-white'
                                : ''
                        } ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    />
                </div>

                {/* 載入狀態下的額外提示 */}
                {loading && (
                    <div className="text-center text-sm text-gray-500">
                        <p>⏱️ 預估時間：{autoMode ? '30-60' : '5-10'} 秒</p>
                        <p className="mt-1">
                            {sensitiveDetectionLoading
                                ? "正在進行隱私檢測，請稍候..."
                                : "請耐心等候，系統正在處理您的資料..."
                            }
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}