import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

// 定義 API 回應類型
interface PointsResponse {
  points?: number;
  is_pro?: boolean;
  ai_today_used?: number;
}

// Module-level 快取（僅存在於 memory）
let cachedPoints: number | null = null;
let cachedIsPro = false;
let cachedAiUsed = 0;
let cacheTime = 0;
const CACHE_DURATION_MS = 10 * 1000; // 快取 10 秒

export const usePoints = () => {
  const { getToken, isLoaded } = useAuth();
  const [points, setPoints] = useState<number | null>(cachedPoints);
  const [isPro, setIsPro] = useState<boolean>(cachedIsPro);
  const [aiTodayUsed, setAiTodayUsed] = useState<number>(cachedAiUsed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchPoints = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("尚未取得有效 token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/account/user/me/points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("點數查詢失敗");
      const data: PointsResponse = await res.json();

      // 存入 state
      setPoints(data.points ?? 0);
      setIsPro(data.is_pro ?? false);
      setAiTodayUsed(data.ai_today_used ?? 0);

      // 存入快取
      cachedPoints = data.points ?? 0;
      cachedIsPro = data.is_pro ?? false;
      cachedAiUsed = data.ai_today_used ?? 0;
      cacheTime = Date.now();

    } catch (err: unknown) {
      // 處理錯誤 - 使用 unknown 而不是 any
      console.error("❌ 無法取得點數", err);
      
      // 取得錯誤訊息
      let errorMessage = "無法取得點數資訊，請稍後再試";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    const now = Date.now();
    const shouldUseCache = cachedPoints !== null && now - cacheTime < CACHE_DURATION_MS;

    if (shouldUseCache) {
      // 直接從快取讀取，不發 API
      setPoints(cachedPoints);
      setIsPro(cachedIsPro);
      setAiTodayUsed(cachedAiUsed);
      setLoading(false);
    } else if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchPoints();
    }
  }, [isLoaded, fetchPoints]); // 加入 fetchPoints 到 dependencies

  return {
    points,
    isPro,
    aiTodayUsed,
    loading,
    error,
    refetch: fetchPoints,
  };
};