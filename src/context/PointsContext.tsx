"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

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
  const [version, setVersion] = useState(0); // ✅ 用來強制 re-render 的版本號

  const fetchedRef = useRef(false);
  const cacheTimeRef = useRef(0);
  const CACHE_DURATION_MS = 10 * 1000;

  const fetchPoints = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("尚未取得有效 token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me/points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("點數查詢失敗");
      const data = await res.json();

      setPoints(data.points ?? 0);
      setIsPro(data.is_pro ?? false);
      setAiTodayUsed(data.ai_today_used ?? 0);
      cacheTimeRef.current = Date.now();
    } catch (err: any) {
      console.error("❌ 無法取得點數", err);
      setError("無法取得點數資訊，請稍後再試");
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
  }, [isLoaded]);

  const contextValue: PointsContextType = {
    points,
    isPro,
    aiTodayUsed,
    loading,
    error,
    refetch: async () => {
      await fetchPoints();
      setVersion((v) => v + 1); // ✅ 重新 render 所有 consumer
    },
  };

  return (
    <PointsContext.Provider value={contextValue}>
      {children}
    </PointsContext.Provider>
  );
};
