"use client";

import { useLogs } from "@/hooks/useLogs";

export default function AnalysisHistory() {
  const { logs, loading, error } = useLogs();

  if (loading) return <p className="text-sm text-muted-foreground">🔄 分析紀錄讀取中...</p>;
  if (error) return <p className="text-sm text-red-500">❌ 無法取得紀錄，請稍後再試</p>;
  if (!logs || logs.length === 0) return <p className="text-sm text-muted-foreground">尚無分析紀錄</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">📊 分析歷程</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 text-left">
            <tr>
              <th className="px-3 py-2 border-b">時間</th>
              <th className="px-3 py-2 border-b">分組</th>
              <th className="px-3 py-2 border-b">AI</th>
              <th className="px-3 py-2 border-b">點數</th>
              <th className="px-3 py-2 border-b">摘要</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-3 py-2 border-b text-center">{log.group_count}</td>
                <td className="px-3 py-2 border-b text-center">{log.ai_enabled ? "✅" : "—"}</td>
                <td className="px-3 py-2 border-b text-center">{log.points_spent}</td>
                <td className="px-3 py-2 border-b">{log.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
