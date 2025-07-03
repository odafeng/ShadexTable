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

export default function Step2VariableSelect() {
  const router = useRouter();
  const {
    parsedData,
    setGroupVar: setCtxGroupVar,
    setCatVars: setCtxCatVars,
    setContVars: setCtxContVars,
    fillNA,
    setFillNA,
    setResultTable,
  } = useAnalysis();

  const [groupVar, setGroupVar] = useState<string>("");
  const [catVars, setCatVars] = useState<string[]>([]);
  const [contVars, setContVars] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const allColumns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];
  const selectableCatVars = allColumns.filter((c) => !contVars.includes(c));
  const selectableContVars = allColumns.filter((c) => !catVars.includes(c));
  const isValid = catVars.length > 0 || contVars.length > 0;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleAnalyze = async () => {
    setCtxGroupVar(groupVar);
    setCtxCatVars(catVars);
    setCtxContVars(contVars);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: parsedData,
          groupVar,
          catVars,
          contVars,
          fillNA,
        }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result?.detail || "分析失敗，請稍後再試");
      if (!result.table || !Array.isArray(result.table)) throw new Error("後端回傳格式錯誤");

      setResultTable(result.table);
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
                options={selectableCatVars}
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
                options={selectableContVars}
                selected={contVars}
                onChange={setContVars}
                placeholder="選擇變項..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fillna"
                checked={fillNA}
                onCheckedChange={(val) => setFillNA(!!val)}
              />
              <Label htmlFor="fillna">填補缺值</Label>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                disabled={!isValid || loading}
                onClick={handleAnalyze}
                className="gap-2 w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "分析中..." : "開始分析"}
              </Button>
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
