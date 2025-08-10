'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { isAppError } from '@/utils/error'
import { AppError } from '@/types/errors'

export default function DemoErrorPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<AppError | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const [shouldThrowError, setShouldThrowError] = useState(false)

    // 測試 API 呼叫
    const handleApiCall = async (endpoint: string) => {
        setLoading(true)
        setError(null)
        setData(null)

        // 建立取消控制器
        const controller = new AbortController()
        setAbortController(controller)

        try {
            const result = await apiClient.get(endpoint, {
                correlationId: crypto.randomUUID(),
                signal: controller.signal
            })
            setData(result)
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // 使用者主動取消，不顯示錯誤
                return
            }
            setError(err as AppError)
        } finally {
            setLoading(false)
            setAbortController(null)
        }
    }

    // 取消請求
    const handleCancel = () => {
        if (abortController) {
            abortController.abort()
        }
    }

    // 觸發未捕獲錯誤（測試 Error Boundary）
    const triggerUncaughtError = () => {
        setShouldThrowError(true)
    }

    if (shouldThrowError) {
        throw new Error('這是測試用的未捕獲錯誤 - Error Boundary 應該捕獲這個錯誤')
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">錯誤處理示範</h1>

            {/* API 測試區域 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">API 錯誤測試</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={() => handleApiCall('/api/test?type=success')}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        成功請求
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=404')}
                        disabled={loading}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                    >
                        404 錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=500')}
                        disabled={loading}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        500 錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=slow')}
                        disabled={loading}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        逾時測試
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=auth')}
                        disabled={loading}
                        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                        401 錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=rateLimit')}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        429 錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('https://invalid-domain-12345.com/api')}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        網路錯誤
                    </button>

                    <button
                        onClick={triggerUncaughtError}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        未捕獲錯誤
                    </button>
                </div>

                {/* 載入狀態 */}
                {loading && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-blue-800">請求進行中...</span>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                            取消
                        </button>
                    </div>
                )}

                {/* 錯誤顯示 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-red-800 font-medium">
                                    {t(error.messageUser || 'errors.unknown')}
                                </p>
                                {error.correlationId && (
                                    <p className="text-red-600 text-sm mt-1">
                                        追蹤碼: {error.correlationId}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 成功回應 */}
                {data && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="text-green-800 font-medium mb-2">請求成功</h3>
                        <pre className="text-green-700 text-sm bg-green-100 p-2 rounded overflow-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* 錯誤分類說明 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">錯誤分類說明</h2>
                <div className="space-y-4">
                    <div className="border-l-4 border-yellow-400 pl-4">
                        <h3 className="font-medium text-gray-900">ValidationError</h3>
                        <p className="text-gray-600 text-sm">表單驗證失敗、必填欄位缺失、格式不正確</p>
                        <p className="text-yellow-700 text-sm">→ {t('errors.validation')}</p>
                    </div>

                    <div className="border-l-4 border-red-400 pl-4">
                        <h3 className="font-medium text-gray-900">NetworkError</h3>
                        <p className="text-gray-600 text-sm">網路連線中斷、請求逾時、DNS 解析失敗</p>
                        <p className="text-red-700 text-sm">→ {t('errors.network')}</p>
                    </div>

                    <div className="border-l-4 border-purple-400 pl-4">
                        <h3 className="font-medium text-gray-900">AuthError</h3>
                        <p className="text-gray-600 text-sm">JWT 過期、登入失敗、權限不足（401/403）</p>
                        <p className="text-purple-700 text-sm">→ {t('errors.auth')}</p>
                    </div>

                    <div className="border-l-4 border-orange-400 pl-4">
                        <h3 className="font-medium text-gray-900">RateLimitError</h3>
                        <p className="text-gray-600 text-sm">API 呼叫頻率超過限制（429）</p>
                        <p className="text-orange-700 text-sm">→ {t('errors.rateLimit')}</p>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                        <h3 className="font-medium text-gray-900">ServerError</h3>
                        <p className="text-gray-600 text-sm">伺服器內部錯誤（500/502/503/504）</p>
                        <p className="text-red-800 text-sm">→ {t('errors.server')}</p>
                    </div>

                    <div className="border-l-4 border-gray-400 pl-4">
                        <h3 className="font-medium text-gray-900">UnknownError</h3>
                        <p className="text-gray-600 text-sm">未預期的錯誤或無法分類的例外</p>
                        <p className="text-gray-700 text-sm">→ {t('errors.unknown')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}