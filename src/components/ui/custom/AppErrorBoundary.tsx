'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

import Image from 'next/image'

import ActionButton from '@/components/ui/custom/ActionButton'
import ActionButton2 from '@/components/ui/custom/ActionButton2'
import { reportError } from '@/lib/reportError'
import { AppError } from '@/types/errors'
import {
    isAppError,
    ErrorCode,
    ErrorContext,
    createError,
    extractErrorMessage,
} from '@/utils/error'

interface Props {
    children: ReactNode
    fallback?: (error: AppError, retry: () => void) => ReactNode
    context?: ErrorContext // 允許設定錯誤情境
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

        // 使用 isAppError 類型守衛而不是 instanceof
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

            // 預設的錯誤 UI - 統一風格
            return (
                <div className="min-h-screen bg-[#EEF2F9] flex items-center justify-center p-8">
                    {/* 主容器 */}
                    <div className="relative w-full max-w-[789px]">
                        {/* 錯誤卡片 - 統一風格 */}
                        <div className="relative bg-[#EEF2F9] border border-[#0F2844]/10 rounded-2xl shadow-lg p-10">
                            
                            {/* 內容 */}
                            <div className="space-y-6">
                                {/* 圖標與標題 - 統一風格 */}
                                <div className="flex items-center gap-3">
                                    <Image
                                        src="/alert/exclamation_icon@2x.png"
                                        alt="error"
                                        width={24}
                                        height={24}
                                    />
                                    <h1 className="text-[#0F2844] text-[24px] font-bold tracking-[2px] leading-[36px]">
                                        系統發生錯誤
                                    </h1>
                                </div>

                                {/* 錯誤訊息 - 統一風格 */}
                                <div className="space-y-4">
                                    <p className="text-[#0F2844] text-[18px] leading-[32px] tracking-[1.2px]">
                                        {this.state.error.userMessage}
                                    </p>
                                    
                                    {this.state.error.action && (
                                        <p className="text-[#0F2844]/70 text-[16px] leading-[28px] tracking-[1px]">
                                            建議動作：{this.state.error.action}
                                        </p>
                                    )}
                                </div>

                                {/* 開發者資訊 - 統一風格 */}
                                {process.env.NODE_ENV === 'development' && (
                                    <details className="mt-4">
                                        <summary className="text-[14px] text-[#0F2844]/60 cursor-pointer hover:text-[#0F2844] tracking-[0.8px]">
                                            開發者資訊 ▼
                                        </summary>
                                        <div className="mt-3 p-4 bg-[#0F2844]/5 rounded-xl text-[12px] font-mono text-[#0F2844]/80 space-y-1">
                                            <div><strong>錯誤代碼:</strong> {this.state.error.code}</div>
                                            <div><strong>上下文:</strong> {this.state.error.context}</div>
                                            <div><strong>嚴重程度:</strong> {this.state.error.severity}</div>
                                            <div><strong>可重試:</strong> {this.state.error.canRetry ? '是' : '否'}</div>
                                            <div><strong>追蹤碼:</strong> {this.state.error.correlationId}</div>
                                            {this.state.error.details && (
                                                <div className="mt-2">
                                                    <strong>詳細資訊:</strong>
                                                    <pre className="mt-1 overflow-x-auto">
                                                        {JSON.stringify(this.state.error.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}

                                {/* 操作按鈕 - 統一風格 */}
                                <div className="flex justify-end gap-4 mt-10">
                                    {/* 只在可重試時顯示重試按鈕 */}
                                    {this.state.error.canRetry && (
                                        <ActionButton2
                                            text="重試"
                                            onClick={this.handleRetry}
                                            className="min-w-[100px] whitespace-nowrap cursor-pointer"
                                        />
                                    )}

                                    <ActionButton
                                        text="回首頁"
                                        onClick={this.handleGoHome}
                                        className="min-w-[120px] whitespace-nowrap cursor-pointer"
                                    />
                                </div>

                                {/* 錯誤追蹤碼 - 統一風格 */}
                                {this.state.error.correlationId && (
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
                                                    {this.state.error.correlationId.split('-')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
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