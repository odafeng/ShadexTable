'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    extractErrorMessage,
} from '@/utils/error'
import { reportError } from '@/lib/apiClient'
import { AppError } from '@/types/errors'

interface Props {
    children: ReactNode
    fallback?: (error: AppError, retry: () => void) => ReactNode
    context?: ErrorContext // 新增：允許設定錯誤情境
}

interface State {
    hasError: boolean
    error: AppError | null
}

export class AppErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        // 使用統一錯誤處理系統創建 AppError
        let appError: AppError

        // 🔧 修正：使用 isAppError 類型守衛而不是 instanceof
        if (isAppError(error)) {
            // 如果已經是 AppError，直接使用
            appError = error as AppError
        } else {
            // 轉換為 AppError
            appError = createError(
                ErrorCode.UNKNOWN_ERROR,
                ErrorContext.UNKNOWN, // 預設情境，可以透過 props 覆蓋
                undefined,
                {
                    customMessage: `應用程式發生未預期的錯誤：${extractErrorMessage(error)}`,
                    correlationId: crypto.randomUUID(),
                    cause: error
                }
            )
        }

        return {
            hasError: true,
            error: appError
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const appError = this.state.error!

        // 使用統一的錯誤回報系統
        reportError(appError, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            context: this.props.context || 'ErrorBoundary',
            originalError: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            timestamp: new Date().toISOString()
        }).catch(reportErr => {
            console.error('Failed to report error boundary error:', reportErr)
        })

        // 開發環境額外的 console 輸出
        if (process.env.NODE_ENV === 'development') {
            console.group('🚨 Error Boundary Caught Error')
            console.error('Original Error:', error)
            console.error('Error Info:', errorInfo)
            console.error('App Error:', appError)
            console.groupEnd()
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })

        // 可以選擇重新載入頁面或只是重置狀態
        // window.location.reload()
    }

    handleGoHome = () => {
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError && this.state.error) {
            // 如果有自訂 fallback，使用它
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, this.handleRetry)
            }

            // 預設的錯誤 UI
            return (
                <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-stone-100 flex items-center justify-center p-8">
                    {/* Subtle geometric background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-stone-200/20 to-zinc-300/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-amber-100/20 to-stone-200/20 rounded-full blur-3xl" />
                    </div>

                    {/* Main container */}
                    <div className="relative w-full max-w-md">
                        {/* Luxury card */}
                        <div className="relative bg-white/95 backdrop-blur-sm border border-stone-200/60 rounded-3xl shadow-2xl shadow-stone-900/5 overflow-hidden">
                            {/* Subtle top accent line */}
                            <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />

                            {/* Content */}
                            <div className="px-8 py-12">
                                {/* Minimalist icon */}
                                <div className="flex justify-center mb-8">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/20">
                                            <svg className="w-7 h-7 text-stone-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                            </svg>
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full shadow-sm" />
                                    </div>
                                </div>

                                {/* Typography with luxury spacing */}
                                <div className="text-center space-y-6 mb-10">
                                    <div className="space-y-3">
                                        <h1 className="text-2xl font-light tracking-wide text-stone-900 leading-tight">
                                            系統發生錯誤
                                        </h1>
                                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent mx-auto" />
                                    </div>

                                    <p className="text-stone-600 text-sm leading-relaxed font-light tracking-wide">
                                        我們已經記錄了這個問題，請稍後重試
                                    </p>
                                </div>

                                {/* Error message - premium styling */}
                                <div className="mb-10">
                                    <div className="relative bg-stone-50/80 border border-stone-200/60 rounded-2xl p-6 shadow-inner">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="w-6 h-6 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-stone-700 text-sm font-medium leading-relaxed">
                                                    {this.state.error.userMessage}
                                                </p>
                                                {this.state.error.action && (
                                                    <p className="text-stone-600 text-xs">
                                                        建議動作：{this.state.error.action}
                                                    </p>
                                                )}
                                                {/* 🆕 顯示錯誤詳細資訊（開發模式） */}
                                                {process.env.NODE_ENV === 'development' && (
                                                    <details className="mt-3">
                                                        <summary className="text-xs text-stone-500 cursor-pointer hover:text-stone-700">
                                                            開發者資訊 ▼
                                                        </summary>
                                                        <div className="mt-2 p-3 bg-stone-100 rounded-lg text-xs font-mono text-stone-600 space-y-1">
                                                            <div><strong>錯誤代碼:</strong> {this.state.error.code}</div>
                                                            <div><strong>上下文:</strong> {this.state.error.context}</div>
                                                            <div><strong>嚴重程度:</strong> {this.state.error.severity}</div>
                                                            <div><strong>可重試:</strong> {this.state.error.canRetry ? '是' : '否'}</div>
                                                            <div><strong>追蹤碼:</strong> {this.state.error.correlationId}</div>
                                                            {this.state.error.details && (
                                                                <div><strong>詳細資訊:</strong> {JSON.stringify(this.state.error.details, null, 2)}</div>
                                                            )}
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Premium action buttons */}
                                <div className="space-y-4 mb-8">
                                    {/* 🆕 只在可重試時顯示重試按鈕 */}
                                    {this.state.error.canRetry && (
                                        <button
                                            onClick={this.handleRetry}
                                            className="group w-full relative bg-gradient-to-r from-stone-800 to-stone-900 text-white px-6 py-4 rounded-2xl font-medium tracking-wide shadow-lg shadow-stone-900/20 hover:shadow-xl hover:shadow-stone-900/30 transition-all duration-300 overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="relative flex items-center justify-center space-x-3">
                                                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                </svg>
                                                <span>重試</span>
                                            </div>
                                        </button>
                                    )}

                                    <button
                                        onClick={this.handleGoHome}
                                        className="group w-full relative bg-white border border-stone-200 text-stone-700 px-6 py-4 rounded-2xl font-medium tracking-wide hover:bg-stone-50 hover:border-stone-300 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-center space-x-3">
                                            <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                            </svg>
                                            <span>回到首頁</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Sophisticated correlation ID */}
                                {this.state.error.correlationId && (
                                    <div className="border-t border-stone-200/60 pt-6">
                                        <div className="flex items-center justify-center">
                                            <div className="inline-flex items-center space-x-3 text-xs text-stone-500 bg-stone-50/60 border border-stone-200/40 px-4 py-2 rounded-full">
                                                <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                                </svg>
                                                <span className="font-light">
                                                    錯誤代碼
                                                </span>
                                                <span className="font-mono text-stone-600 tracking-wider">
                                                    {this.state.error.correlationId.split('-')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Subtle bottom accent */}
                            <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
                        </div>

                        {/* Elegant shadow elements */}
                        <div className="absolute -inset-4 bg-gradient-to-b from-stone-200/10 to-stone-300/10 rounded-3xl blur-2xl -z-10" />
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// 便利的 HOC (Higher-Order Component) 包裝器
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <AppErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </AppErrorBoundary>
    )

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

    return WrappedComponent
}

// 使用範例：

/*
// 1. 基本用法
function App() {
  return (
    <AppErrorBoundary>
      <MyComponent />
    </AppErrorBoundary>
  )
}

// 2. 指定錯誤情境
function FileUploadPage() {
  return (
    <AppErrorBoundary context={ErrorContext.FILE_UPLOAD}>
      <FileUploadComponent />
    </AppErrorBoundary>
  )
}

// 3. 自訂錯誤 UI
function AnalysisPage() {
  return (
    <AppErrorBoundary 
      context={ErrorContext.ANALYSIS}
      fallback={(error, retry) => (
        <div className="custom-error-ui">
          <h2>分析失敗</h2>
          <p>{error.userMessage}</p>
          {error.canRetry && <button onClick={retry}>重試分析</button>}
        </div>
      )}
    >
      <AnalysisComponent />
    </AppErrorBoundary>
  )
}

// 4. 使用 HOC
const SafeComponent = withErrorBoundary(MyComponent, {
  context: ErrorContext.DATA_FETCH
})

// 5. 在頁面層級使用
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary context={ErrorContext.UNKNOWN}>
      <div className="min-h-screen">
        {children}
      </div>
    </AppErrorBoundary>
  )
}
*/