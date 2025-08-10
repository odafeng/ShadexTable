/**
 * 情境化錯誤顯示組件
 */

'use client'

import { AppError, ErrorCode } from '@/types/errors'
import { ErrorContext, CONTEXTUAL_ERROR_CONFIGS, ContextualErrorConfig } from '@/types/contextualErrors'
import { t } from '@/lib/i18n'

interface Props {
  error: AppError
  context: ErrorContext
  onAction?: () => void
  onDismiss?: () => void
  className?: string
}

export function ContextualErrorDisplay({ error, context, onAction, onDismiss, className = '' }: Props) {
  // 獲取情境化配置
  const contextConfig = CONTEXTUAL_ERROR_CONFIGS[context]?.[error.code]
  
  // 降級到通用錯誤訊息
  const config: ContextualErrorConfig = contextConfig || {
    title: '出現了一些問題',
    message: t(error.messageUser),
    actionText: '重試',
    actionType: 'retry',
    icon: 'error'
  }

  const getIconComponent = () => {
    const iconClass = "w-6 h-6"
    
    switch (config.icon) {
      case 'warning':
        return (
          <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'network':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        )
      case 'auth':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      default:
        return (
          <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const handleAction = () => {
    switch (config.actionType) {
      case 'refresh':
        window.location.reload()
        break
      case 'navigate':
        if (config.actionUrl) {
          window.location.href = config.actionUrl
        }
        break
      case 'login':
        window.location.href = '/login'
        break
      case 'contact':
        window.location.href = '/contact'
        break
      case 'retry':
      default:
        onAction?.()
        break
    }
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getIconComponent()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {config.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {config.message}
          </p>
          
          {/* 操作按鈕 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAction}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {config.actionText}
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                暫時跳過
              </button>
            )}
          </div>
          
          {/* 錯誤詳細資訊（可選顯示） */}
          {config.showDetails && error.correlationId && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">
                技術細節
              </summary>
              <div className="mt-2 text-xs text-gray-400 font-mono">
                錯誤代碼: {error.correlationId}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}