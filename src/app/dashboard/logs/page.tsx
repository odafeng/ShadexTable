"use client";

import { useLogs } from "@/hooks/useLogs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AnalysisHistory() {
  const { logs, loading, error } = useLogs();
  const router = useRouter();

  if (loading)
    return <p className="text-sm text-muted-foreground">🔄 分析紀錄讀取中...</p>;
  if (error)
    return <p className="text-sm text-red-500">❌ 無法取得紀錄，請稍後再試</p>;
  if (!logs || logs.length === 0)
    return <p className="text-sm text-muted-foreground">尚無分析紀錄</p>;

  // ✅ 時間轉台灣當地時區
  const formatLocalTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">📊 分析歷程</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 text-left">
            <tr>
              <th className="px-3 py-2 border-b">時間</th>
              <th className="px-3 py-2 border-b text-center">分組</th>
              <th className="px-3 py-2 border-b text-center">AI</th>
              <th className="px-3 py-2 border-b text-center">點數</th>
              <th className="px-3 py-2 border-b">摘要</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b whitespace-nowrap">
                  {formatLocalTime(log.timestamp)}
                </td>
                <td className="px-3 py-2 border-b text-center">{log.group_count}</td>
                <td className="px-3 py-2 border-b text-center">
                  {log.ai_enabled ? "✅" : "—"}
                </td>
                <td className="px-3 py-2 border-b text-center">{log.points_spent}</td>
                <td className="px-3 py-2 border-b">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-4 text-right">
        <Button
          onClick={() => router.push("/dashboard/points")}
          className="bg-primary text-white hover:bg-primary/90"
        >
          回控制台
        </Button>
      </div>
    </div>
  );
}
