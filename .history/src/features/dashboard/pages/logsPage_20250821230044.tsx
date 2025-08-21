// src/features/dashboard/pages/logsPage.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogs } from "@/features/auth/hooks/useLogs";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw,
  FileText,
  Brain,
  Clock,
  Coins,
} from "lucide-react";
import type { UsageLog } from "@/schemas/logs";

export default function AnalysisHistory() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { 
    logs, 
    total, 
    loading, 
    error, 
    refetch, 
    hasMore 
  } = useLogs({
    page,
    pageSize,
  });

  // 使用 Intl.DateTimeFormat 處理時區
  const formatLocalTime = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // 使用用戶時區
    });
    
    return (isoString: string) => {
      try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "—";
        return formatter.format(date);
      } catch {
        return "—";
      }
    };
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  // 處理分頁
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error.userMessage || "無法載入分析紀錄"}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void refetch()}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
        {error.canRetry && (
          <p className="text-sm text-muted-foreground mt-2">
            {error.action}
          </p>
        )}
      </div>
    );
  }

  // Empty state
  if (!logs || logs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">尚無分析紀錄</p>
            <Link href="/step1">
              <Button>開始第一次分析</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          分析歷程
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/dashboard/points">
            <Button variant="outline" size="sm">
              回控制台
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">總分析次數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {logs.reduce((acc, log) => acc + log.points_spent, 0)}
            </div>
            <div className="text-sm text-muted-foreground">本頁點數消耗</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">分析紀錄</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-y">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    <Clock className="inline h-3 w-3 mr-1" />
                    時間
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">分組</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    <Brain className="inline h-3 w-3 mr-1" />
                    AI
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    <Coins className="inline h-3 w-3 mr-1" />
                    點數
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">摘要</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <AnimatePresence mode="wait">
                  {logs.map((log: UsageLog, i: number) => (
                    <motion.tr
                      key={log.id || `log-${i}`}
                      className="hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <td className="px-4 py-3 text-sm">
                        {formatLocalTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <Badge variant="outline">{log.group_count}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {log.ai_enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            啟用
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <Badge variant="secondary">{log.points_spent}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="line-clamp-2">{log.summary}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-sm text-muted-foreground">
          共 {total} 筆紀錄，第 {page}/{totalPages || 1} 頁
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            上一頁
          </Button>
          
          {/* 頁碼按鈕 */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            }).filter(Boolean)}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => handlePageChange(page + 1)}
          >
            下一頁
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}