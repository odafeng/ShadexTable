"use client";

import { useLogs } from "@/features/auth/hooks/useLogs";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function AnalysisHistory() {
  const { logs, loading, error } = useLogs();
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const formatLocalTime = (isoString: string) => {
    const utcDate = new Date(isoString);
    const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    return localDate.toLocaleString("zh-TW", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-32">
        <svg
          className="animate-spin h-6 w-6 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <span className="ml-3 text-sm text-muted-foreground">分析紀錄讀取中...</span>
      </div>
    );

  if (error)
    return (
      <p className="text-sm text-red-500">❌ 無法取得紀錄，請稍後再試</p>
    );

  if (!logs || logs.length === 0)
    return (
      <p className="text-sm text-muted-foreground">尚無分析紀錄</p>
    );

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ✅ Header + 控制台按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          📊 分析歷程
        </h2>
        <Link href="/dashboard/points">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            回控制台
          </Button>
        </Link>
      </div>

      {/* ✅ 表格 */}
      <div className="overflow-x-auto rounded-lg shadow ring-1 ring-gray-200 dark:ring-gray-700">
        <table className="min-w-full text-sm text-gray-700 dark:text-gray-200 border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 text-left">
            <tr>
              <th className="px-4 py-2 border-b">時間</th>
              <th className="px-4 py-2 border-b text-center">分組</th>
              <th className="px-4 py-2 border-b text-center">AI</th>
              <th className="px-4 py-2 border-b text-center">點數</th>
              <th className="px-4 py-2 border-b">摘要</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, i) => (
              <motion.tr
                key={i}
                className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
              >
                <td className="px-4 py-2 border-b whitespace-nowrap">
                {log.timestamp ? formatLocalTime(log.timestamp) : "—"}
                </td>
                <td className="px-4 py-2 border-b text-center">
                  {log.group_count}
                </td>
                <td className="px-4 py-2 border-b text-center">
                  {log.ai_enabled ? "✅" : "—"}
                </td>
                <td className="px-4 py-2 border-b text-center">
                  {log.points_spent}
                </td>
                <td className="px-4 py-2 border-b">{log.summary}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ 分頁控制器 */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          第 {page} / {totalPages} 頁
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            上一頁
          </Button>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            下一頁
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
