// step1/components/AnalysisControl.tsx
import React, { useState } from 'react';

import { CircleQuestionMark } from 'lucide-react';

import ActionButton from "@/components/ui/custom/ActionButton";
import ConfirmTypeMismatchDialog from "@/components/ui/custom/ConfirmTypeMismatchDialog";
import GroupSelect from "@/components/ui/custom/GroupSelect";
import ToggleSwitch from "@/components/ui/custom/ToggleSwitch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAnalysisTrigger } from '@/features/step1/hooks/useAnalysisTrigger';
import { useAnalysisStore } from '@/stores/analysisStore';

export default function AnalysisControls() {
    // 從 Zustand 獲取需要的狀態
    const file = useAnalysisStore(state => state.file);
    const fillNA = useAnalysisStore(state => state.fillNA);
    const setFillNA = useAnalysisStore(state => state.setFillNA);
    const parsedData = useAnalysisStore(state => state.parsedData);
    
    // 分組變項相關狀態
    const groupVar = useAnalysisStore(state => state.groupVar);
    const catVars = useAnalysisStore(state => state.catVars);
    const contVars = useAnalysisStore(state => state.contVars);
    const setGroupVar = useAnalysisStore(state => state.setGroupVar);
    const setCatVars = useAnalysisStore(state => state.setCatVars);
    const setContVars = useAnalysisStore(state => state.setContVars);
    const columnTypes = useAnalysisStore(state => state.columnTypes);
    
    // 本地狀態
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [pendingGroupVar, setPendingGroupVar] = useState<string>("");
    const [confirmedWarnings, setConfirmedWarnings] = useState<Set<string>>(new Set());
    
    // 使用 Analysis Trigger Hook
    const {
        autoMode,
        setAutoMode,
        loading,
        triggerAnalysis
    } = useAnalysisTrigger();
    
    // 準備分組變項選項
    const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
    const getTypeOf = (col: string) => 
        columnTypes.find((c) => c.column === col)?.suggested_type ?? "不明";
    
    // 排序函數：按照 suggested_type 排序
    type SelectOption = {
        label: string;
        value: string;
        type?: string;
        disabled?: boolean;
        suffix?: string;
    };
    
    const sortByType = (options: SelectOption[]): SelectOption[] => {
        const typeOrder = ["類別變項", "連續變項", "日期變項", "不明"];
        return options.sort((a, b) => {
            const aType = a.type as string || "不明";
            const bType = b.type as string || "不明";
            const aIndex = typeOrder.indexOf(aType);
            const bIndex = typeOrder.indexOf(bType);
            
            if (aIndex === bIndex) {
                return a.label.localeCompare(b.label);
            }
            
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            
            return aIndex - bIndex;
        });
    };
    
    // 不加入「不分組」選項，因為 GroupSelect 組件會自動加入
    const groupOptions: SelectOption[] = sortByType(
        allColumns.map((col) => ({
            label: col,
            value: col,
            type: getTypeOf(col)
        } as SelectOption))
    );
    
    // 處理分組變項變更
    const handleGroupChange = (val: string) => {
        // 如果選擇「不分組」或空值，直接設定
        if (!val) {
            setGroupVar("");
            return;
        }
        
        const type = getTypeOf(val);
        
        // 檢查是否為非類別變項且尚未確認過
        if (type !== "類別變項" && type !== "不明" && !confirmedWarnings.has(val)) {
            setPendingGroupVar(val);
            setShowConfirmDialog(true);
            setConfirmMessage(
                `⚠️ 系統判定「${val}」為${type}，建議選擇類別型變項作為分組依據。\n\n是否確定要使用此變項作為分組變項？`
            );
            return;
        }
        
        // 正常設定分組變項
        setGroupVar(val);
        
        // 如果新選的分組變項在類別變項中，移除它
        if (catVars.includes(val)) {
            setCatVars(catVars.filter(v => v !== val));
        }
        
        // 如果新選的分組變項在連續變項中，移除它
        if (contVars.includes(val)) {
            setContVars(contVars.filter(v => v !== val));
        }
    };
    
    // 處理確認對話框的確認
    const handleConfirmTypeMismatch = () => {
        setConfirmedWarnings(prev => new Set(prev).add(pendingGroupVar));
        setGroupVar(pendingGroupVar);
        
        // 移除可能的衝突
        if (catVars.includes(pendingGroupVar)) {
            setCatVars(catVars.filter(v => v !== pendingGroupVar));
        }
        if (contVars.includes(pendingGroupVar)) {
            setContVars(contVars.filter(v => v !== pendingGroupVar));
        }
        
        setShowConfirmDialog(false);
        setPendingGroupVar("");
        setConfirmMessage("");
    };
    
    // 處理確認對話框的取消
    const handleCancelTypeMismatch = () => {
        setShowConfirmDialog(false);
        setPendingGroupVar("");
        setConfirmMessage("");
        // 不改變當前的分組變項選擇
    };
    
    // 處理分析
    const handleAnalyze = async () => {
        try {
            await triggerAnalysis(file);
        } catch (err) {
            console.error('分析錯誤:', err);
        }
    };
    
    // 當 autoMode 關閉時，清除必須選擇的限制
    React.useEffect(() => {
        if (!autoMode) {
            setConfirmedWarnings(new Set());
        }
    }, [autoMode]);
    
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
            <div className="flex flex-col items-center gap-6 mt-8">
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

                    {/* 模式說明 - 簡潔版 */}
                    <div className="text-center text-sm text-gray-600">
                        {autoMode
                            ? "AI 將自動完成所有分析步驟"
                            : "手動控制每個分析步驟"
                        }
                    </div>
                </div>

                {/* 分組變項選擇器 - 只在 AutoMode 開啟時顯示 */}
                {autoMode && columnTypes.length > 0 && (
                    <div className="w-full max-w-md text-center">
                        <label className="block mb-2 text-[16px] tracking-[1px] font-semibold text-[#555555]">
                            選擇分組變項 
                            <span className="text-sm font-normal text-gray-500 ml-1">
                                （AI 全自動分析必填）
                            </span>
                        </label>
                        <GroupSelect
                            options={groupOptions}
                            selected={groupVar}
                            onChange={handleGroupChange}
                            placeholder="選擇分組變項或不分組"
                        />
                        {groupVar && getTypeOf(groupVar) !== "類別變項" && getTypeOf(groupVar) !== "不明" && (
                            <p className="mt-2 text-xs text-gray-500">
                                註：建議選擇類別型變項作為分組依據
                            </p>
                        )}
                    </div>
                )}

                {/* 統一的開始分析按鈕 */}
                <div className="flex justify-center">
                    <ActionButton
                        text={loading ? "處理中..." : `開始${autoMode ? ' AI 全自動' : '半自動'}分析`}
                        loading={loading}
                        disabled={!file || loading}
                        onClick={handleAnalyze}
                        iconSrc={autoMode ? "/step1/upload_white.png" : "/step1/upload_white.png"}
                        iconGraySrc="/step1/upload_gray.png"
                        iconHoverSrc={autoMode ? "/step1/upload_white.png" : "/step1/Group_50@2x.png"}
                        className={`min-w-[240px] w-auto transition-all duration-300 ${
                            loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    />
                </div>

                {/* 載入狀態提示 - 簡潔版 */}
                {loading && (
                    <div className="text-center text-sm text-gray-500">
                        請稍候，系統正在處理您的資料...
                    </div>
                )}
            </div>

            {/* 類型不匹配確認對話框 */}
            <ConfirmTypeMismatchDialog
                open={showConfirmDialog}
                message={confirmMessage}
                onConfirm={handleConfirmTypeMismatch}
                onCancel={handleCancelTypeMismatch}
            />
        </>
    );
}