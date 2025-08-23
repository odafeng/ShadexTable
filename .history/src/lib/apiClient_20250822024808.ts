import { AppError } from "@/types/errors";
import { isAppError, createError, ErrorCode, ErrorContext } from "@/utils/error";

export async function apiClient<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      // 使用 createError 以符合 AppError 介面（含 severity/timestamp/canRetry 等預設欄位）
      const text = await res.text().catch(() => "");
      throw createError(
        ErrorCode.SERVER_ERROR,
        ErrorContext.DATA_FETCH,
        undefined,
        {
          correlationId: crypto.randomUUID(),
          customMessage: text || `HTTP ${res.status}`,
        }
      );
    }

    if (res.status === 204) {
      // 無內容回應時，統一回傳 undefined as T（依你的呼叫端自行判斷）
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  } catch (error) {
    const appErr: AppError = isAppError(error)
      ? (error as AppError)
      : createError(
          ErrorCode.NETWORK_ERROR,
          ErrorContext.DATA_FETCH,
          "errors.network",
          {
            correlationId: crypto.randomUUID(),
            customMessage: (error as Error)?.message ?? "unknown",
          }
        );
    throw appErr;
  }
}

export type ExtendedRequestInit = RequestInit & {
  context?: ErrorContext;
  correlationId?: string;
  timeout?: number;
};

export async function post<TReq = unknown, TRes = unknown>(
  url: string,
  data?: TReq,
  options: ExtendedRequestInit = {}
): Promise<TRes> {
  const { headers, ...rest } = options;
  return apiClient<TRes>(url, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    ...rest,
  } as ExtendedRequestInit);
}

export async function get<TRes = unknown>(
  url: string,
  options: ExtendedRequestInit = {}
): Promise<TRes> {
  const { headers, ...rest } = options;
  
  // 組合完整 URL
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
    
  return apiClient<TRes>(fullUrl, {
    method: "GET",
    headers: {
      ...headers,
    },
    ...rest,
  } as ExtendedRequestInit);
}