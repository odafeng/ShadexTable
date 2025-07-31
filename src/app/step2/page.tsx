"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/custom/multiselect";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Settings2, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/ui/layout/DashboardLayout";
import { useAuth } from "@clerk/nextjs";
import { typeColorClass } from "@/lib/constants"; 


export default function Step2VariableSelect() {
  const router = useRouter();
  const { getToken } = useAuth();
  const {
    parsedData,
    setGroupVar: setCtxGroupVar,
    setCatVars: setCtxCatVars,
    setContVars: setCtxContVars,
    setGroupCounts,
    fillNA,
    setFillNA,
    setResultTable,
    columnTypes: columnsPreview,
  } = useAnalysis();

  const [groupVar, setGroupVar] = useState<string>("");
  const [catVars, setCatVars] = useState<string[]>([]);
  const [contVars, setContVars] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [pointCost, setPointCost] = useState(1);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  const getTypeOf = (col: string) =>
  columnsPreview.find((c) => c.column === col)?.suggested_type ?? "不明"; // ✅【新增】

  

  const selectableCatVars = allColumns.filter((c) => !contVars.includes(c));
  const selectableContVars = allColumns.filter((c) => !catVars.includes(c));
  const catOptions = selectableCatVars.map((col) => ({
  label: col,
  value: col,
  type: getTypeOf(col),
  }));
  const contOptions = selectableContVars.map((col) => ({
  label: col,
  value: col,
  type: getTypeOf(col),
  }));
  const isValid = catVars.length > 0 || contVars.length > 0;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!groupVar) {
      setPointCost(1);
    } else {
      const groups = parsedData
        .map((row) => row[groupVar])
        .filter((v) => v !== undefined && v !== null && v !== "");
      const uniqueGroups = Array.from(new Set(groups));

      console.log("🪪 [Group 判斷 LOG]", {
        groupVar,
        rawValues: parsedData.map((row) => row[groupVar]),
        filteredGroups: groups,
        uniqueGroups,
        uniqueLength: uniqueGroups.length,
      });

      if (uniqueGroups.length === 0 || uniqueGroups.length === 1) {
        setPointCost(1); // 其實也可以視為無效分組，扣 1 點
      } else if (uniqueGroups.length === 2) {
        setPointCost(2);
      } else {
        setPointCost(3);
      }
    }
      }, [groupVar, parsedData]);

  useEffect(() => {
    const fetchPoints = async () => {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/table/api/table/user/me/points`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setUserPoints(json.points);
    };
    fetchPoints();
  }, []);

  const handleAnalyze = async () => {
    setCtxGroupVar(groupVar);
    setCtxCatVars(catVars);
    setCtxContVars(contVars);
    setLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg("⚠️ 無法取得登入憑證，請重新登入");
        setShowError(true);
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: parsedData,
          groupVar,
          catVars,
          contVars,
          fillNA,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          throw new Error("⚠️ 點數不足，請前往購買頁面補充點數");
        }
        throw new Error(result?.detail || "分析失敗，請稍後再試");
      }
      if (!result.table || !Array.isArray(result.table)) {
        throw new Error("後端回傳格式錯誤");
      }

      setResultTable(result.table);
      setGroupCounts(result.groupCounts);
      router.push("/step3");
    } catch (err: any) {
      console.error("❌ 分析失敗：", err);
      setErrorMsg(err.message || "未知錯誤");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parsedData.length === 0) router.push("/step1");
  }, [parsedData, router]);

  const isPointEnough = userPoints === null || userPoints >= pointCost;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-4 sm:px-6 md:px-8"
      >
        <Card className="w-full max-w-3xl mx-auto rounded-2xl shadow-lg border border-muted">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-primary flex gap-2 items-center">
              <Settings2 className="w-5 h-5" /> Step 2：選擇變項
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
             <Label>分組變項</Label>
             <Select onValueChange={(v) => setGroupVar(v === "__no_grouping__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="選擇變項..." />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="__no_grouping__">（不分組）</SelectItem>
                {allColumns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
             </Select>
               
              {parsedData.length > 0 && (
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-muted-foreground">
                  💡 本次分析將扣除 <span className="font-semibold text-primary">{pointCost} 點</span>，
                      目前剩餘 <span className="font-semibold">{userPoints ?? "?"} 點</span>
                  </p>
                  <p className="text-sm text-red-600 font-semibold">
                  ⚠️ 注意：目前系統不支援配對(paired)分析
                  </p>
                </div>
              )}
            </div>
          
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>類別變項</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-muted-foreground text-xs sm:text-sm cursor-help">
                      ⓘ
                    </TooltipTrigger>
                    <TooltipContent>
                      多選一或多個類別型欄位（如性別、分期等）
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <MultiSelect
                options={catOptions}
                selected={catVars}
                onChange={setCatVars}
                placeholder="選擇變項..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>連續變項</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-muted-foreground text-xs sm:text-sm cursor-help">
                      ⓘ
                    </TooltipTrigger>
                    <TooltipContent>
                      多選一或多個數值欄位（如年齡、BMI、檢驗值）
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <MultiSelect
                options={contOptions}
                selected={contVars}
                onChange={setContVars}
                placeholder="選擇變項..."
              />
            </div>

            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fillna"
                  checked={fillNA}
                  onCheckedChange={(val) => setFillNA(!!val)}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="fillna" className="cursor-help">
                      填補缺值
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    連續變項補平均數，類別變項補眾數
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div className="flex justify-end pt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled={!isValid || loading || !isPointEnough}
                        onClick={handleAnalyze}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Sparkles className="w-4 h-4" />
                        {loading ? "分析中..." : `開始分析（扣 ${pointCost} 點）`}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isPointEnough && (
                    <TooltipContent>
                      ⚠️ 點數不足，請先購買再進行分析
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {errorMsg && (
          <AlertDialog open={showError} onOpenChange={setShowError}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>分析失敗 ❌</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-wrap text-sm">
                  {errorMsg}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(errorMsg || "")}
                >
                  📋 複製錯誤訊息
                </Button>
                <Button variant="default" onClick={() => setShowError(false)}>
                  關閉
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </motion.div>
    </DashboardLayout>
  );
}