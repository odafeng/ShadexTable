// src/features/dashboard/pages/AnalysisHistoryPage.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Download, 
  Filter, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Home,
  ArrowLeft,
  Calendar,
  Clock,
  Database,
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Settings,
  Eye,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ActionButton from "@/components/ui/custom/ActionButton";
import ActionButton2 from "@/components/ui/custom/ActionButton2";
import { useAuth } from "@clerk/nextjs";
import { get } from "@/lib/apiClient";
import { format } from "date-fns";

// 定義歷史記錄類型
interface AnalysisRecord {
  id: number;
  user_id: string;
  auto_mode: boolean;
  timestamp: string;
  duration_ms: number;
  analysis_type: string;
  status: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  row_count: number;
  column_count: number;
  group_var: string | null;
  group_count: number;
  cat_vars: string[];
  cat_vars_count: number;
  cont_vars: string[];
  cont_vars_count: number;
  fill_na: boolean;
  ai_judgement_enable: boolean;
  ai_summary_enable: boolean;
  ai_model: string | null;
  ai_summary: string | null;
  analysis_details: any;
  error_code: string | null;
  error_message: string | null;
  correlation_id: string;
  download_url?: string; // 從 Supabase Storage 取得
}

// 排序選項
const SORT_OPTIONS = [
  { value: "timestamp_desc", label: "最新優先" },
  { value: "timestamp_asc", label: "最舊優先" },
  { value: "file_size_desc", label: "檔案大小 (大到小)" },
  { value: "file_size_asc", label: "檔案大小 (小到大)" },
  { value: "duration_desc", label: "處理時間 (長到短)" },
  { value: "duration_asc", label: "處理時間 (短到長)" },
  { value: "row_count_desc", label: "資料筆數 (多到少)" },
  { value: "row_count_asc", label: "資料筆數 (少到多)" },
];

// 篩選選項
const STATUS_OPTIONS = [
  { value: "all", label: "全部狀態" },
  { value: "completed", label: "完成" },
  { value: "failed", label: "失敗" },
  { value: "processing", label: "處理中" },
];

const MODE_OPTIONS = [
  { value: "all", label: "全部模式" },
  { value: "auto", label: "AI 全自動" },
  { value: "manual", label: "半自動" },
];

export default function AnalysisHistoryPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  
  // 狀態管理
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // 搜尋與篩選
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp_desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // 分頁
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 展開的記錄
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());

  // 載入資料
  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("請先登入");

      const response = await get<{ data: AnalysisRecord[] }>(
        "/api/account/user/me/logs",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setRecords(response.data);
      }
    } catch (err) {
      console.error("載入失敗:", err);
      setError(err instanceof Error ? err.message : "載入分析記錄失敗");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  // 初始載入
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // 篩選與排序邏輯
  useEffect(() => {
    let filtered = [...records];

    // 搜尋篩選
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.ai_summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.group_var?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 狀態篩選
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // 模式篩選
    if (modeFilter !== "all") {
      filtered = filtered.filter(record => 
        modeFilter === "auto" ? record.auto_mode : !record.auto_mode
      );
    }

    // 日期範圍篩選
    if (dateRange.start) {
      filtered = filtered.filter(record => 
        new Date(record.timestamp) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(record => 
        new Date(record.timestamp) <= new Date(dateRange.end)
      );
    }

    // 排序
    const [field, order] = sortBy.split("_");
    filtered.sort((a, b) => {
      let aVal: any = a[field as keyof AnalysisRecord];
      let bVal: any = b[field as keyof AnalysisRecord];
      
      if (field === "timestamp") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRecords(filtered);
    setCurrentPage(1); // 重置到第一頁
  }, [records, searchTerm, sortBy, statusFilter, modeFilter, dateRange]);

  // 分頁計算
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // 切換展開狀態
  const toggleExpanded = (id: number) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 格式化檔案大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 格式化持續時間
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)} 秒`;
    return `${(ms / 60000).toFixed(1)} 分鐘`;
  };

  // 狀態顏色
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">完成</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">失敗</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">處理中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 下載處理
  const handleDownload = async (record: AnalysisRecord) => {
    if (record.download_url) {
      window.open(record.download_url, "_blank");
    } else {
      alert("下載連結不可用");
    }
  };

  // 載入骨架
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 頁面標題與操作按鈕 */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0F2844] tracking-wider flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8" />
                分析歷程記錄
              </h1>
              <p className="text-gray-600 mt-2">
                查看您的所有分析記錄，包含 {records.length} 筆歷史資料
              </p>
            </div>
            
            <div className="flex gap-3">
              <ActionButton2
                text="返回上一頁"
                onClick={() => router.back()}
                icon={ArrowLeft}
                className="!h-[45px] !text-[16px]"
              />
              <ActionButton
                text="回首頁"
                onClick={() => router.push("/")}
                icon={Home}
                className="!h-[45px] !text-[16px]"
              />
            </div>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">總分析次數</p>
                  <p className="text-2xl font-bold text-[#0F2844]">{records.length}</p>
                </div>
                <Database className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI 分析</p>
                  <p className="text-2xl font-bold text-[#0F2844]">
                    {records.filter(r => r.auto_mode).length}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">成功率</p>
                  <p className="text-2xl font-bold text-green-600">
                    {records.length > 0 
                      ? `${Math.round((records.filter(r => r.status === "completed").length / records.length) * 100)}%`
                      : "0%"
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">總處理時間</p>
                  <p className="text-2xl font-bold text-[#0F2844]">
                    {formatDuration(records.reduce((sum, r) => sum + (r.duration_ms || 0), 0))}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜尋與篩選區 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* 搜尋框 */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="搜尋檔案名稱、分組變項或摘要..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* 狀態篩選 */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 模式篩選 */}
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇模式" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
              {/* 日期範圍 */}
              <div>
                <label className="text-xs text-gray-500">開始日期</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-500">結束日期</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
              
              {/* 排序選項 */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 重新整理按鈕 */}
              <Button
                variant="outline"
                onClick={() => fetchRecords(true)}
                disabled={refreshing}
                className="h-10"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">重新整理</span>
              </Button>
            </div>
            
            {/* 篩選結果提示 */}
            {(searchTerm || statusFilter !== "all" || modeFilter !== "all" || dateRange.start || dateRange.end) && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  找到 {filteredRecords.length} 筆符合條件的記錄
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setModeFilter("all");
                    setDateRange({ start: "", end: "" });
                  }}
                >
                  清除篩選
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 錯誤提示 */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 分析記錄列表 */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {paginatedRecords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">沒有找到符合條件的分析記錄</p>
                </CardContent>
              </Card>
            ) : (
              paginatedRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(record.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-[#0F2844]" />
                            <h3 className="font-semibold text-lg text-[#0F2844]">
                              {record.file_name || "未命名檔案"}
                            </h3>
                            {getStatusBadge(record.status)}
                            {record.auto_mode && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Brain className="w-3 h-3 mr-1" />
                                AI 全自動
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(record.timestamp), "yyyy/MM/dd HH:mm")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Database className="w-4 h-4" />
                              {record.row_count} 筆 × {record.column_count} 欄
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(record.duration_ms)}
                            </div>
                            <div className="flex items-center gap-1">
                              <FileSpreadsheet className="w-4 h-4" />
                              {formatFileSize(record.file_size)}
                            </div>
                          </div>
                          
                          {record.ai_summary && (
                            <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                              {record.ai_summary}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {record.status === "completed" && record.download_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(record);
                                    }}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>下載分析結果</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {expandedRecords.has(record.id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedRecords.has(record.id) && (
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* 基本資訊 */}
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-3">基本資訊</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">分析類型：</span>
                                  <span>{record.analysis_type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">檔案雜湊：</span>
                                  <span className="font-mono text-xs">{record.file_hash?.slice(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">關聯 ID：</span>
                                  <span className="font-mono text-xs">{record.correlation_id?.slice(0, 12)}...</span>
                                </div>
                                {record.error_code && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">錯誤代碼：</span>
                                    <span className="text-red-600">{record.error_code}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 分析設定 */}
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-3">分析設定</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">分組變項：</span>
                                  <span>{record.group_var || "無"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">分組數量：</span>
                                  <span>{record.group_count}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">類別變項：</span>
                                  <span>{record.cat_vars_count} 個</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">連續變項：</span>
                                  <span>{record.cont_vars_count} 個</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">填補缺值：</span>
                                  <span>{record.fill_na ? "是" : "否"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* AI 功能 */}
                          {(record.ai_judgement_enable || record.ai_summary_enable) && (
                            <div className="mt-6">
                              <h4 className="font-semibold text-sm text-gray-700 mb-3">AI 功能使用</h4>
                              <div className="flex gap-3">
                                {record.ai_judgement_enable && (
                                  <Badge variant="outline" className="bg-purple-50">
                                    AI 自動分類
                                  </Badge>
                                )}
                                {record.ai_summary_enable && (
                                  <Badge variant="outline" className="bg-purple-50">
                                    AI 結果摘要
                                  </Badge>
                                )}
                                {record.ai_model && (
                                  <Badge variant="outline" className="bg-gray-50">
                                    模型: {record.ai_model}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* 變項詳細 */}
                          {(record.cat_vars.length > 0 || record.cont_vars.length > 0) && (
                            <div className="mt-6">
                              <Accordion type="single" collapsible>
                                <AccordionItem value="variables">
                                  <AccordionTrigger className="text-sm">
                                    查看變項詳細
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-3">
                                      {record.cat_vars.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-2">
                                            類別變項 ({record.cat_vars.length})
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {record.cat_vars.map((v, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {v}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {record.cont_vars.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-2">
                                            連續變項 ({record.cont_vars.length})
                                          </p>
                                          <div className="flex flex-wrap gap-1">
                                            {record.cont_vars.map((v, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {v}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}
                          
                          {/* 錯誤訊息 */}
                          {record.error_message && (
                            <Alert className="mt-4 bg-red-50 border-red-200">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <AlertDescription className="text-red-700 text-sm">
                                {record.error_message}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* 分頁控制 */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              顯示 {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} 筆，
              共 {filteredRecords.length} 筆記錄
            </p>
            
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一頁
              </Button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}