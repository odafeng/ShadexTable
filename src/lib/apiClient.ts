// lib/apiClient.ts
import {
  ErrorCode,
  ErrorContext,
  isAppError,
  createError,
  createErrorFromHttp
} from '@/utils/error'

import { AppError, Json } from '@/types/errors'

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

/**
 * API 客戶端類別
 * 提供統一的 HTTP 請求介面與錯誤處理
 */
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

  /**
   * GET 請求（支援重試）
   * @template TResponse - 響應資料型別
   * @param url - 請求 URL
   * @param options - 請求選項
   * @returns Promise<TResponse>
   */
  async get<TResponse = unknown>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { retries = this.config.retries, timeout, correlationId, context, ...restOptions } = options

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request<TResponse>(url, {
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

  /**
   * POST 請求
   * @template TRequest - 請求資料型別
   * @template TResponse - 響應資料型別
   * @param url - 請求 URL
   * @param data - 請求資料
   * @param options - 請求選項
   * @returns Promise<TResponse>
   */
  async post<TRequest = unknown, TResponse = unknown>(
    url: string, 
    data?: TRequest, 
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<TResponse>(url, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  /**
   * PUT 請求
   * @template TRequest - 請求資料型別
   * @template TResponse - 響應資料型別
   * @param url - 請求 URL
   * @param data - 請求資料
   * @param options - 請求選項
   * @returns Promise<TResponse>
   */
  async put<TRequest = unknown, TResponse = unknown>(
    url: string, 
    data?: TRequest, 
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<TResponse>(url, {
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  /**
   * PATCH 請求
   * @template TRequest - 請求資料型別
   * @template TResponse - 響應資料型別
   * @param url - 請求 URL
   * @param data - 請求資料
   * @param options - 請求選項
   * @returns Promise<TResponse>
   */
  async patch<TRequest = unknown, TResponse = unknown>(
    url: string, 
    data?: TRequest, 
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<TResponse>(url, {
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  /**
   * DELETE 請求
   * @template TResponse - 響應資料型別
   * @param url - 請求 URL
   * @param options - 請求選項
   * @returns Promise<TResponse>
   */
  async delete<TResponse = unknown>(
    url: string, 
    options: RequestOptions = {}
  ): Promise<TResponse> {
    const { timeout, correlationId, context, ...restOptions } = options

    return this.request<TResponse>(url, {
      method: 'DELETE',
      timeout,
      correlationId,
      context,
      ...restOptions
    })
  }

  /**
   * 核心請求方法
   * @template T - 響應資料型別
   * @param url - 請求 URL
   * @param options - 請求選項
   * @returns Promise<T>
   */
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
        let responseData: Json | null = null
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
          responseData ?? undefined
        )
      }

      return await this.parseResponseBody(response) as T

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

  /**
   * 建構完整 URL
   * @param url - 相對或絕對 URL
   * @returns 完整 URL
   */
  private buildURL(url: string): string {
    if (url.startsWith('http')) return url
    return `${this.config.baseURL}${url}`
  }

  /**
   * 解析回應內容
   * @param response - Fetch Response 物件
   * @returns 解析後的資料
   */
  private async parseResponseBody(response: Response): Promise<Json> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      return response.json() as Promise<Json>
    }

    const text = await response.text()
    return text || null
  }

  /**
   * 判斷是否為可重試錯誤
   * @param error - 錯誤物件
   * @returns 是否可重試
   */
  private isRetryableError(error: unknown): boolean {
    if (!isAppError(error)) return false

    // 網路錯誤或 5xx 伺服器錯誤可重試
    return error.code === ErrorCode.NETWORK_ERROR ||
      error.code === ErrorCode.SERVER_ERROR ||
      (typeof error.details?.status === 'number' && error.details.status >= 500)
  }

  /**
   * 類型守衛：檢查是否為 Error
   * @param error - 未知錯誤
   * @returns 是否為 Error 實例
   */
  private isError(error: unknown): error is Error {
    return error instanceof Error
  }

  /**
   * 睡眠函式
   * @param ms - 毫秒數
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 預設實例
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
})

/**
 * 錯誤報告資料結構
 */
interface ErrorReportData {
  code: ErrorCode
  context?: ErrorContext
  message: string
  userMessage: string
  action: string
  correlationId: string
  severity: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  details?: Json
  [key: string]: Json
}

/**
 * 錯誤回報函式
 * @param error - AppError 物件
 * @param extra - 額外資訊
 */
export async function reportError(
  error: AppError,
  extra?: Record<string, Json>
): Promise<void> {
  const errorReport: ErrorReportData = {
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
    details: error.details as Json | undefined,
    ...(extra || {})
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

// 匯出型別定義供外部使用
export type { ApiClientConfig, RequestOptions }