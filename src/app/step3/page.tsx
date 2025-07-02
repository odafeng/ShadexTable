"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/ui/layout/DashboardLayout";
import { BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Step3Summary() {
  const { resultTable, groupVar } = useAnalysis();
  const router = useRouter();
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resultTable || resultTable.length === 0) {
      router.push("/step2");
    }
  }, [resultTable, router]);

  if (!resultTable || resultTable.length === 0) return null;

  const baseCols = ["Variable", "P", "Method", "Missing", "Normal"];
  const exportCols = ["Variable", "P", "Method"];
  const groupKeys = Object.keys(resultTable[0] || {}).filter(
    (k) => !baseCols.includes(k)
  );
  const columns = ["Variable", ...groupKeys, "Normal", "P", "Method", "Missing"];
  const exportColumns = ["Variable", ...groupKeys, "P", "Method"];

  const groupCounts: Record<string, number> = {};
  resultTable.forEach((row) => {
    const variableName = row["Variable"]?.replace(/\*/g, "");
    if (variableName !== groupVar) return;
    for (const [key, val] of Object.entries(row)) {
      if (!baseCols.includes(key) && typeof val === "string") {
        const match = val.match(/^\s*(\d+)/);
        if (match) {
          groupCounts[key] = parseInt(match[1]);
        }
      }
    }
  });

  const renderCell = (val: any) => {
    if (
      val === undefined ||
      val === null ||
      val === "nan" ||
      val === "undefined" ||
      val?.toString().trim() === "—"
    ) {
      return <span className="text-gray-400 italic">&mdash;</span>;
    }
    return val;
  };

  const exportToExcel = () => {
    const data = resultTable
      .filter((row) => row.Variable?.replace(/\*/g, "") !== groupVar)
      .map((row) => {
        const filtered: any = {};
        exportColumns.forEach((col) => {
          const isGroupCol = !["Variable", "P", "Method"].includes(col);
          const label = isGroupCol ? `${col} (n=${groupCounts[col] ?? "?"})` : col;
          filtered[label] = row[col] !== "nan" ? row[col] : "";
        });
        return filtered;
      });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "table-summary.xlsx");
  };

  const exportToWord = async () => {
    const res = await fetch("/api/export-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultTable, groupVar, groupCounts }),
    });

    if (!res.ok) {
      alert("❌ 匯出失敗！");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-summary.docx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleGenerateAIResult = async () => {
    setLoading(true);
    setSummaryText(null);

    const coreData = resultTable
      .filter((row) => row.Variable?.replace(/\*/g, "") !== groupVar)
      .map((row) => {
        const summary = exportColumns
          .map((col) => `${col}: ${row[col] ?? "—"}`)
          .join(" | ");
        return summary;
      })
      .join("\n");

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: coreData }),
      });

      const json = await res.json();
      setSummaryText(json.summary || "❌ 無法產生摘要");
    } catch (err) {
      console.error("❌ OpenAI Error:", err);
      setSummaryText("❌ 發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (summaryText) navigator.clipboard.writeText(summaryText);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="rounded-2xl shadow-lg border border-muted">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-primary flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Step 3：統計摘要
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">📊 統計表</TabsTrigger>
                <TabsTrigger value="summary">🧠 AI 摘要</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <ScrollArea className="h-[480px] rounded-md border p-2">
                  <table className="min-w-full text-sm border border-gray-300 table-auto rounded-md">
                    <thead className="bg-gray-100">
                      <tr>
                        {columns.map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap text-left"
                          >
                            {key === "Variable" ? (
                              <HoverCard>
                                <HoverCardTrigger>變項</HoverCardTrigger>
                                <HoverCardContent className="text-sm">
                                  本列為各項變數名稱與描述統計
                                </HoverCardContent>
                              </HoverCard>
                            ) : key === "Normal"
                            ? "Normality"
                            : key === "P"
                            ? "P"
                            : key === "Method"
                            ? "Method"
                            : key === "Missing"
                            ? "Missing"
                            : `${key} (n = ${groupCounts[key] || "?"})`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultTable.map((row, idx) => {
                        const varName = row["Variable"]?.replace(/\*/g, "");
                        if (varName === groupVar) return null;
                        return (
                          <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                            {columns.map((key, i) => (
                              <td
                                key={key}
                                className={`px-4 py-3 border border-gray-100 text-sm text-gray-800 whitespace-nowrap ${i === 0 ? "font-medium text-left" : "text-right"}`}
                              >
                                {i === 0 && typeof row[key] === "string" && row[key].startsWith("**") ? (
                                  <strong>{row[key].replace(/\*\*/g, "")}</strong>
                                ) : (
                                  renderCell(row[key])
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>

                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={exportToExcel}>
                    導出 Excel
                  </Button>
                  <Button variant="outline" onClick={exportToWord}>
                    導出 Word
                  </Button>
                  <Button onClick={handleGenerateAIResult} disabled={loading} className="gap-2">
                    <Sparkles className="w-4 h-4" /> {loading ? "產生中..." : "AI 產生結果摘要"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="summary">
                {summaryText ? (
                  <div className="border rounded-lg p-4 bg-gray-50 text-sm text-gray-800 whitespace-pre-wrap relative">
                    <strong className="block text-primary mb-2">🧠 AI 產出摘要：</strong>
                    <div>{summaryText}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 text-xs"
                      onClick={handleCopySummary}
                    >
                      📋 複製
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    尚未產生摘要，請點擊上方按鈕。
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}