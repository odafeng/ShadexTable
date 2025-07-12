import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";

export type UsageLog = {
  timestamp: string;
  group_count: number;
  ai_enabled: boolean;
  points_spent: number;
  summary: string;
};

export function useLogs() {
  const { getToken, isLoaded } = useAuth();

  const fetcher = async (url: string) => {
    const token = await getToken();
    if (!token) throw new Error("未登入，無法取得紀錄");

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("讀取分析紀錄失敗");

    return res.json() as Promise<UsageLog[]>;
  };

  const { data, error, isLoading, mutate } = useSWR(
    isLoaded ? "/me/logs" : null, // ✅ 等 token 準備好再送出
    fetcher
  );

  return {
    logs: data || [],
    loading: isLoading,
    error,
    refetch: mutate, // ✅ 可手動重新拉資料
  };
}
