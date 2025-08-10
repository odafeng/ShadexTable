"use client";

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { usePoints } from "@/hooks/general_usePoints";
import DashboardLayout from "@/components/ui/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Coins, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PointsPage() {
  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <PointsInner />
        </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function PointsInner() {
  const { points, isPro, aiTodayUsed, loading, error } = usePoints();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* 點數卡片 */}
      <Card className="border-green-600 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle className="text-lg">我的點數餘額</CardTitle>
              <CardDescription>分析資料時會自動扣點</CardDescription>
            </div>
          </div>
          <div className="text-right">
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : error ? (
              "⚠"
            ) : isPro ? (
              <div>
                <div className="text-lg font-bold text-green-600">Pro 用戶</div>
                <div className="text-xs text-muted-foreground">無限次分析</div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-green-600">{points} 點</div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground">
            每次分析依照條件消耗 1~4 點，點數不足時將無法繼續分析。你可以透過下方按鈕加值更多點數。
          </p>
          <div className="mt-2">
            {loading ? (
              <Skeleton className="h-5 w-48" />
            ) : isPro ? (
              <p className="text-sm text-green-700">
                👑 Pro 方案用戶｜AI 摘要已用 <span className="font-semibold">{aiTodayUsed}</span>/5 次
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                🚫 非 Pro 用戶｜<a href="/marketing/free_mode" className="text-blue-600 hover:underline">立即升級</a>
              </p>
            )}
          </div>

          {!isPro && (
            <div className="mt-4 flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                  加值點數  
              </Button>
            </div>
          )}
        </CardContent>

      </Card>

      {/* 點數說明區塊 */}
      <Card className="bg-[#F8FAFC] border border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex gap-2 items-center text-gray-800">
            <Sparkles className="w-5 h-5 text-primary" />
            點數使用說明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 leading-relaxed space-y-2">
          <ul className="list-disc list-inside">
            <li>📊 無分組分析：1 點</li>
            <li>🔍 兩組比較分析：2 點</li>
            <li>📊 多組比較分析（含匯出）：3 點</li>
            <li>🧠 加上 AI 結果摘要：+1 點</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            註：首次註冊會自動獲得 2 點試用點數。
          </p>
        </CardContent>
      </Card>
      <div className="flex justify-center pt-4">
        <Button variant="outline" asChild>
          <a href="/" className="text-sm">
            回首頁
          </a>
        </Button>
      </div>
    </div>
  );
}
