import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export const usePoints = () => {
  const { getToken } = useAuth();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me/points`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("點數查詢失敗");
        const data = await res.json();
        setPoints(data.points ?? 0);
      } catch (err: any) {
        console.error("❌ 無法取得點數", err);
        setError("無法取得點數資訊，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [getToken]);

  return { points, loading, error };
};
