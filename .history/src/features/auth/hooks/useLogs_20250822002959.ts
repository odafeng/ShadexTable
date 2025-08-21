// src/features/auth/hooks/useLogs.ts
import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import { LogsResponseSchema, type LogsResponse, type UsageLog } from "@/schemas/logs";
import { createError, ErrorCode, ErrorContext, isAppError } from "@/utils/error";
import { reportError } from "@/lib/reportError";
import { Json } from "@/schemas/primitives";

interface UseLogsOptions {
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

interface UseLogsReturn {
  logs: UsageLog[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: ReturnType<typeof createError> | undefined;
  refetch: () => Promise<LogsResponse | undefined>;
  isError: boolean;
  hasMore: boolean;
}

export function useLogs(options: UseLogsOptions = {}): UseLogsReturn {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { page = 1, pageSize = 10, enabled = true } = options;

  const fetcher = async (url: string): Promise<LogsResponse> => {
    try {
      // 檢查認證狀態
      if (!isSignedIn) {
        throw createError(
          ErrorCode.AUTH_ERROR,
          ErrorContext.AUTHENTICATION,
          "auth.unauthorized",
          { customMessage: "請先登入以查看分析紀錄" }
        );
      }

      const token = await getToken();
      if (!token) {
        throw createError(
          ErrorCode.AUTH_TOKEN_MISSING,
          ErrorContext.AUTHENTICATION,
          "auth.token_missing"
        );
      }

      // 使用 apiClient 發送請求
      const response = await get<unknown>(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        context: ErrorContext.DATA_FETCH,
      });

      // Zod 驗證
      const parsed = LogsResponseSchema.safeParse(response);
      if (!parsed.success) {
        throw createError(
          ErrorCode.VALIDATION_ERROR,
          ErrorContext.DATA_VALIDATION,
          undefined,
          {
            customMessage: "分析紀錄格式錯誤",
            details: { 
              zodError: parsed.error.flatten(),
              rawResponse: response as Json,
            },
          }
        );
      }

      // 檢查 backend StandardResponse
      if (!parsed.data.success) {
        throw createError(
          ErrorCode.SERVER_ERROR,
          ErrorContext.DATA_FETCH,
          undefined,
          {
            customMessage: parsed.data.message || "獲取分析紀錄失敗",
          }
        );
      }

      return parsed.data;
    } catch (error) {
      // 統一錯誤處理
      const appError = isAppError(error)
        ? error
        : createError(
            ErrorCode.UNKNOWN_ERROR,
            ErrorContext.DATA_FETCH,
            undefined,
            { 
              cause: error as Error,
              customMessage: "無法載入分析紀錄",
            }
          );
      
      // 上報錯誤（非阻塞）
      void reportError(appError, { 
        feature: "logs",
        page,
        pageSize,
      });
      
      throw appError;
    }
  };

  // SWR 配置
  const shouldFetch = enabled && isLoaded && isSignedIn;
  const queryKey = shouldFetch 
    ? `/api/account/user/me/logs?page=${page}&pageSize=${pageSize}` 
    : null;

  const { data, error, isLoading, mutate } = useSWR<LogsResponse>(
    queryKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 2,
      errorRetryInterval: 3000,
      onError: (err) => {
        // SWR 錯誤回調（可選）
        console.error("[useLogs] SWR error:", err);
      },
    }
  );

  const logsData = data?.data;
  const hasMore = logsData ? logsData.total > (logsData.page * logsData.pageSize) : false;

  return {
    logs: logsData?.logs || [],
    total: logsData?.total || 0,
    page: logsData?.page || page,
    pageSize: logsData?.pageSize || pageSize,
    loading: isLoading,
    error: error as ReturnType<typeof createError> | undefined,
    refetch: mutate,
    isError: !!error,
    hasMore,
  };
}