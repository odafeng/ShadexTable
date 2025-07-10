import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export const usePoints = () => {
  const { getToken, isLoaded } = useAuth(); // ✅ 加上 isLoaded
  const [points, setPoints] = useState<number | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [aiTodayUsed, setAiTodayUsed] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = async () => {
    try {
      const token = await getToken();
      console.log("📦 token", token); // debug 用
      if (!token) throw new Error("尚未取得有效 token");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/points`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("點數查詢失敗");
      const data = await res.json();
      setPoints(data.points ?? 0);
      setIsPro(data.is_pro ?? false);
      setAiTodayUsed(data.ai_today_used ?? 0);
    } catch (err: any) {
      console.error("❌ 無法取得點數", err);
      setError("無法取得點數資訊，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchPoints();
    }
  }, [isLoaded]); // ✅ 等 Clerk 準備好再動作

  return {
    points,
    loading,
    isPro,
    aiTodayUsed,
    error,
    refetch: fetchPoints,
  };
};
