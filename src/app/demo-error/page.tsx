//這是錯誤回報系統測試系統，確保每一種可能的錯誤都有被catch並回報

'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { isAppError, CommonErrors, createError, extractErrorMessage, createErrorHandler, createErrorFromHttp } from '@/utils/error'
import { AppError, ErrorCode, ErrorContext, ErrorSeverity } from '@/types/errors'

export default function DemoErrorPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<AppError | null>(null)
    const [abortController, setAbortController] = useState<AbortController | null>(null)
    const [shouldThrowError, setShouldThrowError] = useState(false)
    const [testResults, setTestResults] = useState<Array<{type: string, success: boolean, message: string, code?: string}>>([])

    // 錯誤處理器
    const handleError = createErrorHandler(
        (appError: AppError, context?: string) => {
            setError(appError)
            console.log('Error handled:', { appError, context })
        },
        { shouldLog: true }
    )

    // 測試 API 呼叫
    const handleApiCall = async (endpoint: string) => {
        setLoading(true)
        setError(null)
        setData(null)

        const controller = new AbortController()
        setAbortController(controller)

        console.log(`🚀 Making API call to: ${endpoint}`) // 除錯日誌

        try {
            const result = await apiClient.get(endpoint, {
                correlationId: crypto.randomUUID(),
                signal: controller.signal,
                context: ErrorContext.NETWORK // 明確指定上下文
            })
            console.log('✅ API call successful:', result)
            setData(result)
        } catch (err) {
            console.log('❌ API call failed:', err) // 除錯日誌
            
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('⚠️ Request was aborted')
                return
            }
            
            // 檢查是否為 AppError
            if (isAppError(err)) {
                console.log('📋 AppError details:', {
                    code: err.code,
                    context: err.context,
                    userMessage: err.userMessage,
                    details: err.details
                })
            }
            
            handleError(err, `API call to ${endpoint}`)
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

    // 測試各種錯誤類型
    const testErrorTypes = () => {
        const results: Array<{type: string, success: boolean, message: string, code?: string}> = []

        // 測試檔案錯誤
        try {
            const fileError = CommonErrors.fileNotSelected()
            results.push({ 
                type: 'File Not Selected', 
                success: isAppError(fileError), 
                message: fileError.userMessage,
                code: fileError.code
            })
        } catch (e) {
            results.push({ 
                type: 'File Not Selected', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試檔案大小錯誤
        try {
            const sizeError = CommonErrors.fileSizeExceeded(10485760, 5242880) // 10MB vs 5MB
            results.push({ 
                type: 'File Size Exceeded', 
                success: isAppError(sizeError), 
                message: sizeError.userMessage,
                code: sizeError.code
            })
        } catch (e) {
            results.push({ 
                type: 'File Size Exceeded', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試格式不支援錯誤
        try {
            const formatError = CommonErrors.fileFormatUnsupported()
            results.push({ 
                type: 'Unsupported Format', 
                success: isAppError(formatError), 
                message: formatError.userMessage,
                code: formatError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Unsupported Format', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試隱私錯誤
        try {
            const privacyError = CommonErrors.sensitiveDataDetected()
            results.push({ 
                type: 'Sensitive Data', 
                success: isAppError(privacyError), 
                message: privacyError.userMessage,
                code: privacyError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Sensitive Data', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試認證錯誤
        try {
            const authError = CommonErrors.authError()
            results.push({ 
                type: 'Auth Error', 
                success: isAppError(authError), 
                message: authError.userMessage,
                code: authError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Auth Error', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試分析錯誤
        try {
            const analysisError = CommonErrors.analysisFailed('自定義分析失敗訊息')
            results.push({ 
                type: 'Analysis Failed', 
                success: isAppError(analysisError), 
                message: analysisError.userMessage,
                code: analysisError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Analysis Failed', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試網路錯誤
        try {
            const networkError = CommonErrors.networkError()
            results.push({ 
                type: 'Network Error', 
                success: isAppError(networkError), 
                message: networkError.userMessage,
                code: networkError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Network Error', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        // 測試自定義錯誤
        try {
            const customError = createError(
                ErrorCode.VALIDATION_ERROR,
                ErrorContext.DATA_VALIDATION,
                undefined,
                {
                    customMessage: '這是一個自定義錯誤訊息',
                    details: { field: 'email', value: 'invalid-email' }
                }
            )
            results.push({ 
                type: 'Custom Error', 
                success: isAppError(customError), 
                message: customError.userMessage,
                code: customError.code
            })
        } catch (e) {
            results.push({ 
                type: 'Custom Error', 
                success: false, 
                message: 'Failed to create error' 
            })
        }

        setTestResults(results)
    }

    // 測試錯誤提取
    const testErrorExtraction = () => {
        const testCases = [
            CommonErrors.fileNotSelected(),
            new Error('Standard JavaScript Error'),
            'Simple string error',
            { custom: 'object error' }
        ]

        const extractedMessages = testCases.map(testCase => ({
            original: testCase,
            extracted: extractErrorMessage(testCase)
        }))

        console.log('Error extraction test:', extractedMessages)
        alert('錯誤提取測試完成，請查看控制台')
    }

    // 觸發未捕獲錯誤（測試 Error Boundary）
    const triggerUncaughtError = () => {
        setShouldThrowError(true)
    }

    // 模擬各種錯誤情境
    const simulateFileUploadError = () => {
        handleError(CommonErrors.fileSizeExceeded(15728640, 10485760), 'File Upload Simulation')
    }

    const simulateAnalysisError = () => {
        handleError(CommonErrors.noVariablesSelected(), 'Analysis Simulation')
    }

    const simulateNetworkError = () => {
        handleError(CommonErrors.serverError(ErrorContext.NETWORK), 'Network Simulation')
    }

    // 🆕 測試 POST 請求
    const testPostRequest = async () => {
        setLoading(true)
        setError(null)
        setData(null)

        console.log('🚀 Testing POST request with validation error')

        try {
            const result = await apiClient.post('/api/test?type=validation', {
                // 故意發送不完整的資料來觸發驗證錯誤
                incomplete: 'data'
            }, {
                correlationId: crypto.randomUUID(),
                context: ErrorContext.DATA_VALIDATION
            })
            console.log('✅ POST request successful:', result)
            setData(result)
        } catch (err) {
            console.log('❌ POST request failed:', err)
            
            if (isAppError(err)) {
                console.log('📋 POST AppError details:', {
                    code: err.code,
                    context: err.context,
                    userMessage: err.userMessage,
                    details: err.details
                })
            }
            
            handleError(err, 'POST validation test')
        } finally {
            setLoading(false)
        }
    }

    // 🆕 測試所有 API 端點
    // 🆕 測試所有 API 端點
    const testAllApiEndpoints = async () => {
        setLoading(true)
        setError(null)
        setData(null)

        const results: Array<{type: string, success: boolean, message: string, code?: string}> = []
        
        const testCases = [
            'success',
            'validation', 
            'auth',
            'forbidden',
            '404',
            'rateLimit',
            '500'
        ]

        console.log('🧪 Testing all API endpoints...')

        for (const testType of testCases) {
            try {
                await apiClient.get(`/api/test?type=${testType}`, {
                    correlationId: crypto.randomUUID(),
                    context: ErrorContext.NETWORK
                })
                
                results.push({
                    type: testType,
                    success: true,
                    message: '請求成功'
                })
            } catch (err) {
                if (isAppError(err)) {
                    results.push({
                        type: testType,
                        success: true, // 預期的錯誤也算成功
                        message: err.userMessage,
                        code: err.code
                    })
                } else {
                    results.push({
                        type: testType,
                        success: false,
                        message: 'Unexpected error type'
                    })
                }
            }
        }

        console.log('📊 All API tests completed:', results)
        setTestResults(results)
        setLoading(false)
    }

    // 🆕 測試所有 HTTP 狀態碼（使用你的 API）
    const testHttpStatusCodes = () => {
        const results: Array<{type: string, success: boolean, message: string, code?: string}> = []

        // 測試各種 HTTP 狀態碼錯誤創建
        const httpTestCases = [
            { status: 400, name: 'Bad Request (驗證錯誤)' },
            { status: 401, name: 'Unauthorized (未認證)' },
            { status: 403, name: 'Forbidden (禁止存取)' },
            { status: 404, name: 'Not Found (資源不存在)' },
            { status: 429, name: 'Rate Limited (頻率限制)' },
            { status: 500, name: 'Internal Server Error (伺服器錯誤)' }
        ]

        console.log('🧪 Testing HTTP status code error creation...')

        httpTestCases.forEach(({ status, name }) => {
            try {
                const error = createErrorFromHttp(status, ErrorContext.NETWORK)
                results.push({
                    type: `${status} ${name}`,
                    success: isAppError(error),
                    message: error.userMessage,
                    code: error.code
                })
                console.log(`✅ ${status}: ${error.code} - ${error.userMessage}`)
            } catch (e) {
                results.push({
                    type: `${status} ${name}`,
                    success: false,
                    message: 'Failed to create error'
                })
                console.error(`❌ ${status}: Failed to create error`, e)
            }
        })

        setTestResults(results)
    }

    if (shouldThrowError) {
        throw new Error('這是測試用的未捕獲錯誤 - Error Boundary 應該捕獲這個錯誤')
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">錯誤處理系統測試頁面</h1>

            {/* API 測試區域 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">API 錯誤測試</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={() => handleApiCall('/api/test?type=success')}
                        disabled={loading}
                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                    >
                        ✅ 200 成功
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=validation')}
                        disabled={loading}
                        className="bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 text-xs"
                    >
                        ❌ 400 驗證錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=auth')}
                        disabled={loading}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:opacity-50 text-xs"
                    >
                        🔒 401 未認證
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=forbidden')}
                        disabled={loading}
                        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                    >
                        🚫 403 禁止存取
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=404')}
                        disabled={loading}
                        className="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 disabled:opacity-50 text-xs"
                    >
                        🔍 404 不存在
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=rateLimit')}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 text-xs"
                    >
                        ⏱️ 429 頻率限制
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=500')}
                        disabled={loading}
                        className="bg-red-800 text-white px-3 py-2 rounded hover:bg-red-900 disabled:opacity-50 text-xs"
                    >
                        💥 500 伺服器錯誤
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=slow')}
                        disabled={loading}
                        className="bg-cyan-600 text-white px-3 py-2 rounded hover:bg-cyan-700 disabled:opacity-50 text-xs"
                    >
                        ⏰ 逾時測試 (25s)
                    </button>

                    <button
                        onClick={() => handleApiCall('https://invalid-domain-12345.com/api')}
                        disabled={loading}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                    >
                        🌐 網路錯誤
                    </button>

                    <button
                        onClick={() => testPostRequest()}
                        disabled={loading}
                        className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 disabled:opacity-50 text-xs"
                    >
                        📤 POST 驗證錯誤
                    </button>

                    <button
                        onClick={triggerUncaughtError}
                        className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 text-xs"
                    >
                        💣 未捕獲錯誤
                    </button>

                    <button
                        onClick={() => testHttpStatusCodes()}
                        className="bg-teal-600 text-white px-3 py-2 rounded hover:bg-teal-700 text-xs"
                    >
                        🧪 測試所有狀態碼
                    </button>

                    <button
                        onClick={() => handleApiCall('/api/test?type=invalid_type_test')}
                        disabled={loading}
                        className="bg-slate-600 text-white px-3 py-2 rounded hover:bg-slate-700 disabled:opacity-50 text-xs"
                    >
                        ❓ 無效參數
                    </button>

                    <button
                        onClick={() => testAllApiEndpoints()}
                        disabled={loading}
                        className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 text-xs"
                    >
                        🚀 測試全部 API
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
                                    {error.userMessage}
                                </p>
                                <div className="mt-2 text-sm text-red-600 space-y-1">
                                    <p><strong>錯誤代碼:</strong> <span className="font-mono bg-red-100 px-1 rounded">{error.code}</span></p>
                                    <p><strong>嚴重程度:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        error.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                                        error.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                                        'bg-green-200 text-green-800'
                                    }`}>{error.severity}</span></p>
                                    <p><strong>上下文:</strong> <span className="font-mono bg-red-100 px-1 rounded">{error.context}</span></p>
                                    <p><strong>追蹤碼:</strong> <span className="font-mono bg-red-100 px-1 rounded text-xs">{error.correlationId}</span></p>
                                    <p><strong>可重試:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        error.canRetry ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                    }`}>{error.canRetry ? '是' : '否'}</span></p>
                                    <p><strong>建議行動:</strong> {error.action}</p>
                                    {error.details && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-red-700 hover:text-red-900">詳細資訊 ▼</summary>
                                            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                                                {JSON.stringify(error.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                                
                                {/* 🆕 除錯按鈕 */}
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => console.log('🔍 Complete Error Object:', error)}
                                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                                    >
                                        在控制台查看完整錯誤
                                    </button>
                                    {error.canRetry && (
                                        <button
                                            onClick={() => {
                                                setError(null)
                                                console.log('🔄 Clearing error state for retry')
                                            }}
                                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                                        >
                                            清除錯誤
                                        </button>
                                    )}
                                </div>
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

            {/* 錯誤類型測試區域 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">錯誤類型系統測試</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={testErrorTypes}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        測試所有錯誤類型
                    </button>

                    <button
                        onClick={testErrorExtraction}
                        className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700"
                    >
                        測試錯誤訊息提取
                    </button>

                    <button
                        onClick={simulateFileUploadError}
                        className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
                    >
                        模擬檔案上傳錯誤
                    </button>

                    <button
                        onClick={simulateAnalysisError}
                        className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                    >
                        模擬分析錯誤
                    </button>

                    <button
                        onClick={simulateNetworkError}
                        className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                    >
                        模擬網路錯誤
                    </button>

                    <button
                        onClick={() => setTestResults([])}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        清除測試結果
                    </button>
                </div>

                {/* 測試結果顯示 */}
                {testResults.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium mb-3">測試結果</h3>
                        <div className="space-y-2">
                            {testResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded ${
                                        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-lg">
                                            {result.success ? '✅' : '❌'}
                                        </span>
                                        <div>
                                            <span className="font-medium">{result.type}</span>
                                            {'code' in result && result.code && (
                                                <span className="ml-2 text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                                    {result.code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm max-w-xs text-right">
                                        {result.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <p>💡 <strong>說明：</strong></p>
                            <ul className="mt-1 space-y-1 text-xs">
                                <li>• ✅ 表示錯誤處理正常運作（包括預期的錯誤）</li>
                                <li>• ❌ 表示發生非預期的錯誤或錯誤處理失敗</li>
                                <li>• 成功請求和適當的錯誤回應都算是正常運作</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* 錯誤分類說明 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">錯誤分類和嚴重程度說明</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="border-l-4 border-red-500 pl-4">
                            <h3 className="font-medium text-gray-900">CRITICAL - 關鍵錯誤</h3>
                            <p className="text-gray-600 text-sm">系統無法運作，需要立即處理</p>
                        </div>

                        <div className="border-l-4 border-orange-500 pl-4">
                            <h3 className="font-medium text-gray-900">HIGH - 高嚴重性</h3>
                            <p className="text-gray-600 text-sm">影響核心功能，需要優先處理</p>
                            <p className="text-orange-700 text-sm">隱私錯誤、認證錯誤、伺服器錯誤</p>
                        </div>

                        <div className="border-l-4 border-yellow-500 pl-4">
                            <h3 className="font-medium text-gray-900">MEDIUM - 中等嚴重性</h3>
                            <p className="text-gray-600 text-sm">影響用戶體驗但不阻止操作</p>
                            <p className="text-yellow-700 text-sm">檔案錯誤、驗證錯誤、分析錯誤</p>
                        </div>

                        <div className="border-l-4 border-green-500 pl-4">
                            <h3 className="font-medium text-gray-900">LOW - 低嚴重性</h3>
                            <p className="text-gray-600 text-sm">輕微問題，不影響核心功能</p>
                            <p className="text-green-700 text-sm">網路暫時性錯誤、頻率限制</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-blue-400 pl-4">
                            <h3 className="font-medium text-gray-900">可重試錯誤</h3>
                            <p className="text-gray-600 text-sm">網路錯誤、伺服器錯誤、分析超時</p>
                        </div>

                        <div className="border-l-4 border-purple-400 pl-4">
                            <h3 className="font-medium text-gray-900">不可重試錯誤</h3>
                            <p className="text-gray-600 text-sm">檔案格式錯誤、檔案大小超限、敏感資料檢測</p>
                        </div>

                        <div className="border-l-4 border-gray-400 pl-4">
                            <h3 className="font-medium text-gray-900">錯誤追蹤</h3>
                            <p className="text-gray-600 text-sm">每個錯誤都有唯一的 correlationId 用於追蹤和除錯</p>
                        </div>

                        <div className="border-l-4 border-indigo-400 pl-4">
                            <h3 className="font-medium text-gray-900">用戶指導</h3>
                            <p className="text-gray-600 text-sm">每個錯誤都包含用戶友善的訊息和建議行動</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}