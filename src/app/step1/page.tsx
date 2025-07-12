"use client";

import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileUp } from "lucide-react";
import * as XLSX from "xlsx";
import { useAnalysis } from "@/context/AnalysisContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/ui/layout/DashboardLayout";

export default function Step1Page() {
  return (
    <>
      <SignedIn>
        <Step1Inner />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

function Step1Inner() {
  const router = useRouter();
  const { getToken } = useAuth();
  const {
    parsedData,
    setFile: setCtxFile,
    setParsedData,
    setGroupVar: setCtxGroupVar,
    setCatVars: setCtxCatVars,
    setContVars: setCtxContVars,
    fillNA,
    setFillNA,
    setResultTable,
  } = useAnalysis();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [columnsPreview, setColumnsPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      if (token) localStorage.setItem("__session", token);
    });
  }, [getToken]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files?.[0] || null;
  if (
    selected &&
    ![
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ].includes(selected.type)
  ) {
    setError("請上傳 CSV 或 Excel 檔案。");
    setFile(null);
    return;
  }

  setError("");
  setFile(selected);

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);


    // ✅ 修正：補齊所有欄位，避免表格錯位
    const allKeys = Array.from(
      new Set(json.flatMap((row) => Object.keys(row)))
    );
    const normalizedData = json.map((row) => {
      const completeRow: any = {};
      allKeys.forEach((key) => {
        completeRow[key] = key in row ? row[key] : "";
      });
      return completeRow;
    });

    setParsedData(normalizedData);
    fetchColumnProfile(normalizedData);
  };

  if (selected) {
    reader.readAsArrayBuffer(selected);
  }
};


  const fetchColumnProfile = async (data: any[]) => {
    try {
      const token = localStorage.getItem("__session") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/columns-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });

      const json = await res.json();
      setColumnsPreview(json.columns || []);
      setShowPreview(true);
    } catch (err) {
      console.error("❌ 欄位解析失敗", err);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("請先選擇檔案後再上傳。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadProgress(25);
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      setUploadProgress(50);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);


      const allKeys = Array.from(
        new Set(json.flatMap((row) => Object.keys(row)))
      );
      const normalizedData = json.map((row) => {
        const completeRow: any = {};
        allKeys.forEach((key) => {
         completeRow[key] = key in row ? row[key] : "";
        });
        return completeRow;
      });

      setUploadProgress(80);

      setCtxFile(file);
      setParsedData(normalizedData);

      setTimeout(() => {
        setUploadProgress(100);
        router.push("/step2");
      }, 300);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-4 sm:px-6 md:px-8"
      >
        <Card className="w-full max-w-2xl mx-auto rounded-2xl shadow-xl border border-muted bg-white">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-primary flex items-center gap-2">
              <UploadCloud className="w-5 h-5" /> Step 1：上傳資料檔案
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              className="rounded-md px-4 py-3 border-l-4 bg-yellow-50 border-yellow-400 text-yellow-900 text-sm leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <strong>請注意：</strong> 請務必移除所有個資欄位（如姓名、病歷號等），避免違反資料安全規範！
            </motion.div>

            <div className="rounded-xl border-2 border-dashed border-accent bg-accent/10 px-4 sm:px-6 py-6 sm:py-8 text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleFileChange}
                      className="mx-auto w-full max-w-xs sm:max-w-sm cursor-pointer text-sm"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>支援 Excel（.xlsx）與 CSV（.csv）格式</p>
                    <p>建議僅保留一張工作表</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm text-muted-foreground mt-2">
                拖曳檔案至此或點擊選取
              </p>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-2 w-full" />
            )}

            {file && (
              <p className="text-sm text-muted-foreground">
                ✅ 已選擇：{file.name}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}

            {showPreview && columnsPreview.length > 0 && (
              <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm space-y-2">
                <p className="text-sm font-medium text-primary">📊 自動欄位解析結果：</p>
                <div className="overflow-auto max-h-64">
                  <table className="min-w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 border-b text-left">欄位</th>
                        <th className="px-3 py-2 border-b text-left">型別</th>
                        <th className="px-3 py-2 border-b text-left">遺漏值</th>
                        <th className="px-3 py-2 border-b text-left">Unique 值</th>
                        <th className="px-3 py-2 border-b text-left">範例</th>
                        <th className="px-3 py-2 border-b text-left">系統建議型別</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnsPreview.map((col, i) => {
                        const isNumeric = col.dtype?.includes("int") || col.dtype?.includes("float");
                        const uniqueCount = col.unique_count ?? 0;

                        let suggestion = "不明";
                        if (isNumeric && uniqueCount <= 10) suggestion = "類別變項";
                        else if (isNumeric && uniqueCount > 10) suggestion = "連續變項";
                        else if (!isNumeric && uniqueCount <= 10) suggestion = "類別變項";

                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border-b">{col.column}</td>
                            <td className="px-3 py-2 border-b">{col.dtype}</td>
                            <td className="px-3 py-2 border-b">{col.missing_pct}</td>
                            <td className="px-3 py-2 border-b">{col.unique_count}</td>
                            <td className="px-3 py-2 border-b">{col.example?.join(", ") || "—"}</td>
                            <td className="px-3 py-2 border-b text-blue-600 font-medium">{suggestion}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  📌 根據型別與 Unique 值，系統會預測欄位應為類別或連續變項。
                  若顯示有誤，請返回 Excel 修正欄位格式（如把數值類型改成文字），再重新上傳。
                </p>
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ✅ 已上傳檔案，以下為預覽資料（最多顯示前五列）：
                </p>
                <div className="overflow-auto border rounded-lg text-sm max-h-64">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        {Object.keys(parsedData[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 border-b font-medium text-gray-700 whitespace-nowrap"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {Object.values(row).map((val, j) => (
                            <td
                              key={j}
                              className="px-3 py-2 border-b whitespace-nowrap"
                            >
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleUpload}
                disabled={!file}
                className="bg-primary text-white hover:bg-primary/90 rounded-lg px-5 sm:px-6 py-2 gap-2 w-full sm:w-auto"
              >
                <FileUp className="w-4 h-4" /> 上傳並分析
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
