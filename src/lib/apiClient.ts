// lib/apiClient.ts
import {
  ErrorCode,
  ErrorContext,
  isAppError,
  createError,
  createErrorFromHttp
} from '@/utils/error'

import { AppError } from '@/types/errors'

// API 客戶端配置
interface ApiClientConfig {
  baseURL?: string
  timeout?: number // 毫秒
  retries?: number // 重試次數（僅 GET）
  retryDelay?: number // 重試延遲基數（毫秒）
}

// 請求選項（排除與自訂選項衝突的 RequestInit 屬性）
interface RequestOptions extends Omit<RequestInit, 'method'> {
  timeout?: number
  retries?: number
  correlationId?: string
  context?: ErrorContext
}

class ApiClient {
  private config: Required<ApiClientConfig>

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 20000, // 預設 20 秒
      retries: 2, // 預設重試 2 次
      retryDelay: 1000, // 預設 1 秒基數
      ...config
    }
  }

  // GET 請求（支援重試）
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { retries = this.config.retries, timeout, correlationId, context, ...restOptions } = options

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request<T>(url, {
          method: 'GET',
          timeout,
          correlationId,
          context,
          ...restOptions
        })
      } catch (error) {
        // 最後一次嘗試或非網路錯誤直接拋出
        if (attempt === retries || !this.isRetryableError(error)) {
          throw error
        }

        // 指數退避 + 抖動
        const delay = this.config.retryDelay * Math.pow(2, attempt) + Math.random() * 1000
        await this.sleep(delay)
      }
    }

    throw createError(ErrorCode.UNKNOWN_ERROR, context)
  }

  // POST 請求
  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  // PUT 請求
  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  // DELETE 請求
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<T>(url, {
      method: 'DELETE',
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  // 核心請求方法
  private async request<T>(
    url: string,
    options: RequestOptions & { method: string } = { method: 'GET' }
  ): Promise<T> {
    const correlationId = options.correlationId || crypto.randomUUID()
    const timeout = options.timeout || this.config.timeout
    const context = options.context || ErrorContext.NETWORK

    // 建立 AbortController 處理逾時
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 處理外部 signal
    const externalSignal = options.signal
    if (externalSignal) {
      if (externalSignal.aborted) {
        throw new DOMException('Request was aborted', 'AbortError')
      }
      externalSignal.addEventListener('abort', () => controller.abort())
    }

    try {
      const fullUrl = this.buildURL(url)

      // 準備 fetch 選項，排除自訂屬性
      const { timeout: _, correlationId: __, context: ___, ...fetchOptions } = options

      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': correlationId,
          ...options.headers
        }
      })

      clearTimeout(timeoutId)

      // 處理非 2xx 回應
      if (!response.ok) {
        let responseData: any = null
        try {
          responseData = await this.parseResponseBody(response)
        } catch (parseError) {
          console.warn('Failed to parse error response body:', parseError)
        }

        // 使用 createErrorFromHttp 創建適當的錯誤
        throw createErrorFromHttp(
          response.status,
          context,
          correlationId,
          responseData
        )
      }

      return await this.parseResponseBody(response)

    } catch (error) {
      clearTimeout(timeoutId)

      // 如果已經是 AppError，直接拋出
      if (isAppError(error)) {
        throw error
      }

      // AbortError (逾時或外部取消)
      if (this.isError(error) && error.name === 'AbortError') {
        const isTimeout = !externalSignal?.aborted
        throw createError(
          ErrorCode.NETWORK_ERROR,
          context,
          undefined,
          {
            customMessage: isTimeout
              ? `請求逾時（${timeout}ms），請檢查網路連線`
              : '請求已被取消',
            correlationId,
            cause: error
          }
        )
      }

      // TypeError (網路錯誤)
      if (error instanceof TypeError) {
        throw createError(
          ErrorCode.NETWORK_ERROR,
          context,
          undefined,
          {
            customMessage: '網路連線失敗，請檢查網路狀態',
            correlationId,
            cause: error
          }
        )
      }

      // 其他未知錯誤
      const errorMessage = this.isError(error) ? error.message : String(error)
      const errorCause = this.isError(error) ? error : undefined

      throw createError(
        ErrorCode.UNKNOWN_ERROR,
        context,
        undefined,
        {
          customMessage: `API 請求發生未知錯誤：${errorMessage}`,
          correlationId,
          cause: errorCause
        }
      )
    }
  }

  // 建構完整 URL
  private buildURL(url: string): string {
    if (url.startsWith('http')) return url
    return `${this.config.baseURL}${url}`
  }

  // 解析回應內容
  private async parseResponseBody(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json()
    }

    const text = await response.text()
    return text || null
  }

  // 判斷是否為可重試錯誤
  private isRetryableError(error: unknown): boolean {
    if (!isAppError(error)) return false

    // 網路錯誤或 5xx 伺服器錯誤可重試
    return error.code === ErrorCode.NETWORK_ERROR ||
      error.code === ErrorCode.SERVER_ERROR ||
      (error.details?.status && error.details.status >= 500)
  }

  // 類型守衛：檢查是否為 Error
  private isError(error: unknown): error is Error {
    return error instanceof Error
  }

  // 睡眠函式
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 預設實例
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
})

// 錯誤回報函式
export async function reportError(
  error: AppError,
  extra?: Record<string, any>
): Promise<void> {
  const errorReport = {
    code: error.code,
    context: error.context,
    message: error.message,
    userMessage: error.userMessage,
    action: error.action,
    correlationId: error.correlationId,
    severity: error.severity,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    details: error.details,
    ...extra
  }

  // 開發環境：console 輸出
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Client Error Report:', errorReport)
    return
  }

  // 生產環境：上報到後端
  try {
    await fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    })
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
  }
}