"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

// 定義 API 回應類型
interface PointsApiResponse {
  points?: number;
  is_pro?: boolean;
  ai_today_used?: number;
}

interface PointsContextType {
  points: number | null;
  isPro: boolean;
  aiTodayUsed: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isLoaded } = useAuth();

  const [points, setPoints] = useState<number | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [aiTodayUsed, setAiTodayUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 移除未使用的 version state
  // const [version, setVersion] = useState(0);

  const fetchedRef = useRef(false);
  const cacheTimeRef = useRef(0);
  const CACHE_DURATION_MS = 10 * 1000;

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
      const data: PointsApiResponse = await res.json();

      setPoints(data.points ?? 0);
      setIsPro(data.is_pro ?? false);
      setAiTodayUsed(data.ai_today_used ?? 0);
      cacheTimeRef.current = Date.now();
    } catch (err: unknown) {
      console.error("❌ 無法取得點數", err);
      
      // 安全地取得錯誤訊息
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
    const shouldUseCache = points !== null && now - cacheTimeRef.current < CACHE_DURATION_MS;

    if (shouldUseCache) {
      setLoading(false);
    } else if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchPoints();
    }
  }, [isLoaded, points]); // 加入 points 到 dependencies

  const contextValue: PointsContextType = {
    points,
    isPro,
    aiTodayUsed,
    loading,
    error,
    refetch: async () => {
      // 重置狀態並重新獲取
      fetchedRef.current = false;
      cacheTimeRef.current = 0;
      await fetchPoints();
      // 如果需要強制更新，可以考慮其他方式
      // 例如：清除快取或使用其他狀態管理方式
    },
  };

  return (
    <PointsContext.Provider value={contextValue}>
      {children}
    </PointsContext.Provider>
  );
};

// 自定義 Hook 來使用 Context（如果你想要使用的話）
export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

// 需要在檔案頂部 import useContext
import { createContext, useContext, useEffect, useRef, useState } from "react";