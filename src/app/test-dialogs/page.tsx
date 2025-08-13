"use client";

import { useState } from "react";
import AnalysisErrorDialog from "@/components/ui/custom/AnalysisErrorDialog";
import AnalysisLoadingModal, { DEFAULT_ANALYSIS_STEPS } from "@/components/ui/custom/AnalysisLoadingModal";
import ConfirmTypeMismatchDialog from "@/components/ui/custom/ConfirmTypeMismatchDialog";
import { AppErrorBoundary } from "@/components/ui/custom/AppErrorBoundary";
import { Button } from "@/components/ui/button";

export default function TestDialogPage() {
  // 各個對話框的開關狀態
  const [showError, setShowError] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [triggerError, setTriggerError] = useState(false);

  // 觸發 Error Boundary 的元件
  const ThrowError = () => {
    if (triggerError) {
      throw new Error("這是一個測試錯誤，用來展示 Error Boundary 的樣式");
    }
    return null;
  };

  // 模擬 Error Boundary 的顯示（不實際拋出錯誤）
  const [showMockError, setShowMockError] = useState(false);
  
  // 建立一個假的 AppError 物件來展示 UI
  const mockError = {
    code: 'TEST_ERROR',
    context: 'TESTING',
    severity: 'error' as const,
    canRetry: true,
    userMessage: '無法完成操作，系統遇到了未預期的問題。我們已經記錄了這個錯誤，請稍後再試。',
    action: '請重新整理頁面或返回首頁',
    correlationId: 'test-' + Math.random().toString(36).substr(2, 9),
    details: process.env.NODE_ENV === 'development' ? {
      timestamp: new Date().toISOString(),
      component: 'TestDialogPage',
      testMode: true
    } : undefined
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0F2844] mb-8">
          對話框元件預覽
        </h1>
        
        <div className="space-y-6">
          {/* 區塊 1: 錯誤對話框 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0F2844] mb-4">
              1. AnalysisErrorDialog（分析錯誤）
            </h2>
            <p className="text-gray-600 mb-4">
              用於顯示分析過程中的錯誤訊息，包含複製錯誤訊息功能
            </p>
            <Button
              onClick={() => setShowError(true)}
              className="bg-[#0F2844] hover:bg-[#0F2844]/90 text-white"
            >
              開啟錯誤對話框
            </Button>
          </div>

          {/* 區塊 2: 載入動畫 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0F2844] mb-4">
              2. AnalysisLoadingModal（載入動畫）
            </h2>
            <p className="text-gray-600 mb-4">
              顯示分析進度的載入動畫，包含步驟指示和進度條
            </p>
            <Button
              onClick={() => setShowLoading(true)}
              className="bg-[#0F2844] hover:bg-[#0F2844]/90 text-white"
            >
              開啟載入動畫
            </Button>
          </div>

          {/* 區塊 3: 確認對話框 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0F2844] mb-4">
              3. ConfirmTypeMismatchDialog（型別不一致提醒）
            </h2>
            <p className="text-gray-600 mb-4">
              當變項型別不一致時的確認對話框
            </p>
            <Button
              onClick={() => setShowConfirm(true)}
              className="bg-[#0F2844] hover:bg-[#0F2844]/90 text-white"
            >
              開啟確認對話框
            </Button>
          </div>

          {/* 區塊 4: Error Boundary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0F2844] mb-4">
              4. AppErrorBoundary（錯誤邊界）
            </h2>
            <p className="text-gray-600 mb-4">
              捕捉應用程式錯誤並顯示友善的錯誤頁面
            </p>
            
            <div className="space-y-3">
              {/* 方法 1: 模擬顯示 */}
              <div>
                <p className="text-sm text-gray-500 mb-2">方法 1：模擬錯誤畫面（推薦）</p>
                <Button
                  onClick={() => setShowMockError(true)}
                  className="bg-[#0F2844] hover:bg-[#0F2844]/90 text-white"
                >
                  顯示錯誤邊界 UI
                </Button>
              </div>
              
              {/* 方法 2: 實際觸發（生產環境可用） */}
              <div>
                <p className="text-sm text-gray-500 mb-2">方法 2：實際觸發錯誤</p>
                <p className="text-red-500 text-xs mb-2">
                  ⚠️ 開發環境會被 Error Overlay 攔截，請在生產環境測試
                </p>
                <Button
                  onClick={() => setTriggerError(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  觸發真實錯誤
                </Button>
              </div>
            </div>
          </div>

          {/* 視覺規範說明 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-[#0F2844] mb-4">
              設計規範
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">主色調：</span>
                <span className="ml-2 px-3 py-1 bg-[#0F2844] text-white rounded">
                  #0F2844
                </span>
              </div>
              <div>
                <span className="font-semibold">背景色：</span>
                <span className="ml-2 px-3 py-1 bg-[#EEF2F9] text-[#0F2844] rounded border">
                  #EEF2F9
                </span>
              </div>
              <div>
                <span className="font-semibold">對話框規格：</span>
                <span className="ml-2">max-w-[789px] h-[299px] rounded-2xl</span>
              </div>
              <div>
                <span className="font-semibold">按鈕規格：</span>
                <span className="ml-2">h-[50px] rounded-full</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 各個對話框元件 */}
      <AnalysisErrorDialog
        open={showError}
        onClose={() => setShowError(false)}
        message="無法完成分析，請檢查您的資料格式是否正確。如果問題持續發生，請聯繫技術支援團隊。錯誤代碼：ERR_ANALYSIS_001"
      />

      <AnalysisLoadingModal
        isOpen={showLoading}
        steps={DEFAULT_ANALYSIS_STEPS}
        onComplete={() => {
          setShowLoading(false);
          alert("載入完成！");
        }}
        onCancel={() => setShowLoading(false)}
        allowCancel={true}
        autoStart={true}
      />

      <ConfirmTypeMismatchDialog
        open={showConfirm}
        message={`檢測到變項型別不一致：\n• "年齡" 被標記為類別變項，但包含連續數值\n• "性別" 被標記為連續變項，但只有離散值\n\n是否要繼續使用目前的設定進行分析？`}
        onConfirm={() => {
          setShowConfirm(false);
          alert("確認繼續分析");
        }}
        onCancel={() => {
          setShowConfirm(false);
          alert("返回修改設定");
        }}
      />

      {/* Error Boundary 包裝 */}
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>

      {/* 模擬 Error Boundary UI 顯示 */}
      {showMockError && (
        <div className="fixed inset-0 bg-[#EEF2F9] z-50 flex items-center justify-center p-8">
          <div className="relative w-full max-w-[789px]">
            <div className="relative bg-[#EEF2F9] border border-[#0F2844]/10 rounded-2xl shadow-lg p-10">
              <div className="space-y-6">
                {/* 圖標與標題 */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#0F2844] rounded flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <h1 className="text-[#0F2844] text-[24px] font-bold tracking-[2px] leading-[36px]">
                    系統發生錯誤
                  </h1>
                </div>

                {/* 錯誤訊息 */}
                <div className="space-y-4">
                  <p className="text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px]">
                    {mockError.userMessage}
                  </p>
                  
                  {mockError.action && (
                    <p className="text-[#0F2844]/70 text-[16px] leading-[28px] tracking-[1px]">
                      建議動作：{mockError.action}
                    </p>
                  )}
                </div>

                {/* 開發者資訊（模擬） */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4">
                    <summary className="text-[14px] text-[#0F2844]/60 cursor-pointer hover:text-[#0F2844] tracking-[0.8px]">
                      開發者資訊 ▼
                    </summary>
                    <div className="mt-3 p-4 bg-[#0F2844]/5 rounded-xl text-[12px] font-mono text-[#0F2844]/80 space-y-1">
                      <div><strong>錯誤代碼:</strong> {mockError.code}</div>
                      <div><strong>上下文:</strong> {mockError.context}</div>
                      <div><strong>嚴重程度:</strong> {mockError.severity}</div>
                      <div><strong>可重試:</strong> {mockError.canRetry ? '是' : '否'}</div>
                      <div><strong>追蹤碼:</strong> {mockError.correlationId}</div>
                      {mockError.details && (
                        <div className="mt-2">
                          <strong>詳細資訊:</strong>
                          <pre className="mt-1 overflow-x-auto text-[10px]">
                            {JSON.stringify(mockError.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* 操作按鈕 */}
                <div className="flex justify-end gap-4 mt-10">
                  {mockError.canRetry && (
                    <button
                      onClick={() => {
                        alert('重試操作');
                        setShowMockError(false);
                      }}
                      className="w-[160px] h-[50px] text-[#0F2844] border border-[#0F2844] hover:bg-[#0F2844] hover:text-white text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      重試
                    </button>
                  )}

                  <button
                    onClick={() => {
                      alert('返回首頁');
                      setShowMockError(false);
                    }}
                    className="w-[140px] h-[50px] bg-[#0F2844] text-white hover:bg-white hover:text-[#0F2844] text-[20px] tracking-[2px] leading-[32px] px-6 py-2 rounded-full flex items-center justify-center gap-2 border border-[#0F2844] transition-all duration-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    回首頁
                  </button>
                </div>

                {/* 錯誤追蹤碼 */}
                {mockError.correlationId && (
                  <div className="border-t border-[#0F2844]/10 pt-6 mt-6">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center space-x-3 text-[12px] text-[#0F2844]/60 bg-[#0F2844]/5 border border-[#0F2844]/10 px-4 py-2 rounded-full">
                        <svg className="w-3 h-3 text-[#0F2844]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                        </svg>
                        <span className="tracking-[0.5px]">
                          錯誤代碼
                        </span>
                        <span className="font-mono text-[#0F2844]/70 tracking-wider">
                          {mockError.correlationId.split('-')[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}