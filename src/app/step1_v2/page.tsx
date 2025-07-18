"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import * as XLSX from "xlsx";
import Image from "next/image";
import Header from "@/components/ui/layout/Header_ui2";
import Footer from "@/components/Footer";
import StepNavigator from "@/components/stepNavigator";
import { useAnalysis } from "@/context/AnalysisContext";
import { typeColorClass } from "@/lib/constants";
import { TableProperties } from "lucide-react";

const allowedExtensions = [".csv", ".xls", ".xlsx"];

export default function Step1Page() {
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
    setColumnTypes,
  } = useAnalysis();

  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [columnsPreview, setColumnsPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      if (token) localStorage.setItem("__session", token);
    });
  }, [getToken]);

  const validateFile = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return allowedExtensions.includes(ext);
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) {
      setError("請上傳 CSV 或 Excel 檔案。");
      setFile(null);
      return;
    }

    setError("");
    setFile(file);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      const allKeys = Array.from(new Set(json.flatMap((row) => Object.keys(row))));
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

    reader.readAsArrayBuffer(file);
  };

  const fetchColumnProfile = async (data: any[]) => {
    try {
      const token = localStorage.getItem("__session") || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze/columns-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });

      const json = await res.json();
      setColumnsPreview(json.columns || []);
      setColumnTypes(json.columns || []);
      setShowPreview(true);
    } catch (err) {
      console.error("❌ 欄位解析錯誤：", err);
      setShowPreview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleAnalyze = () => {
    if (!file) {
      setError("請先選擇檔案後再上傳。");
      return;
    }

    setLoading(true);
    setCtxFile(file);
    setTimeout(() => {
      setLoading(false);
      router.push("/step2_v2");
    }, 1000);
  };

  return (
    <div className="bg-white">
      <Header />
      <div className="container-custom pb-45">
        <StepNavigator />

        {/* 標題 */}
        <h2
          style={{
            fontSize: "30px",
            letterSpacing: "3px",
            lineHeight: "42px",
            fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
            color: "#0F2844",
          }}
          className="mt-4 mb-4"
        >
          Step1：上傳資料檔案
        </h2>

        {/* 提醒文字 */}
        <div className="flex items-start gap-2 mb-8">
          <Image
            src="/step1/alert_icon@2x.png"
            alt="alert"
            width={21.6}
            height={24}
          />
          <p
            style={{
              fontSize: "20px",
              letterSpacing: "2px",
              lineHeight: "32px",
              fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              color: "#0F2844",
            }}
          >
            請注意：請務必移除所有個資欄位(如姓名、病歷號等)，避免違反資料安全規範！
          </p>
        </div>

        {/* 上傳區 */}
        <div
          className={`w-full max-w-[1366px] h-[154px] border rounded-xl flex flex-col items-center justify-center space-y-4 ${
            dragOver ? "bg-[#dce3f1]" : "bg-[#EEF2F9]"
          }`}
          style={{
            borderColor: "#C4C8D0",
            borderWidth: "1px",
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* 檔案選擇框 + Tooltip */}
          <div className="w-[549px] h-[50px] flex items-center justify-between px-4 border border-[#C4C8D0] bg-white rounded-md relative group">
            <div className="relative group cursor-pointer">
              <label
                htmlFor="file-upload"
                className="text-[#0F2844]"
                style={{
                  fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                  fontSize: "20px",
                  letterSpacing: "2px",
                  lineHeight: "30px",
                }}
              >
                選擇檔案
              </label>

              {/* Tooltip */}
              <div className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded mt-2 z-10 left-0 whitespace-nowrap">
                僅限上傳 Excel 或 CSV
              </div>
            </div>

            <span
              className="truncate text-right"
              style={{
                fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
                fontSize: "18px",
                letterSpacing: "1.8px",
                lineHeight: "30px",
                color: "#9CA3AF",
                maxWidth: "320px",
              }}
            >
              {fileName || "未選擇任何檔案"}
            </span>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
            />
          </div>

          {/* 拖曳提示文字 */}
          <p
            style={{
              fontSize: "18px",
              fontFamily: '"Noto Sans TC", "思源黑體", sans-serif',
              color: "#5B6D81",
            }}
          >
            拖曳檔案至此或點擊選取
          </p>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                {parsedData.length > 0 && (
          <div className="mt-10 space-y-2">
            <div className="flex items-center gap-2">
            <Image
            src="/step1/checkbox_icon@2x.png"
            alt="checkbox"
            width={21.33}
            height={20}
          />
            <p className="text-xs text-[#0F2844]">
              已上傳檔案，以下為預覽資料（最多顯示前五列）：
            </p>
            </div>
            <div className="overflow-auto border rounded-lg text-sm max-h-64 text-[#0F2844]">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-[#EEF2F9] text-[#586D81] sticky top-0 z-10">
                  <tr>
                    {Object.keys(parsedData[0]).map((key) => (
                      <th key={key} className="px-3 py-2 border-b font-medium text-gray-700 whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.keys(parsedData[0]).map((col, j) => (
                        <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showPreview && columnsPreview.length > 0 && (
          <div className="mt-10 rounded-lg border border-gray-300 bg-white p-4 shadow-sm space-y-2 text-[#0F2844]">
            <div className="flex items-center gap-1 mb-4">
            <TableProperties size={20} className="text-[#0F2844]" />
            <p className="text-sm font-medium text-[#0F2844]">自動欄位解析結果：</p>
            </div>
            <div className="overflow-auto max-h-64">
              <table className="min-w-full text-sm border border-gray-200">
                <thead className="bg-[#EEF2F9] sticky top-0 text-[#586D81]">
                  <tr>
                    <th className="px-3 py-2 border-b text-left whitespace-nowrap">欄位</th>
                    <th className="px-3 py-2 border-b text-left whitespace-nowrap">遺漏值</th>
                    <th className="px-3 py-2 border-b text-left whitespace-nowrap">系統建議型別</th>
                  </tr>
                </thead>
                <tbody>
                      {columnsPreview.map((col, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border-b whitespace-nowrap">{col.column}</td>
                          <td className="px-3 py-2 border-b whitespace-nowrap">{col.missing_pct}</td>
                          <td
                            className={`px-3 py-2 border-b whitespace-nowrap font-medium ${
                              typeColorClass[col.suggested_type] || "text-gray-500"
                            }`}
                          >
                            {col.suggested_type ?? "不明"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
              </table>
            </div>
          </div>
        )}



        <div className="flex justify-center mt-10 mb-24">
          <button
            disabled={!file || loading}
            onClick={handleAnalyze}
            className={`w-[186px] h-[50px] rounded-full border flex items-center justify-center gap-2 text-[18px] tracking-[2px] transition-all ${
              file ? "bg-[#0F2844] text-white border-[#0F2844]" : "bg-transparent text-gray-400 border-gray-400"
            } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            ) : (
              <>
                <Image
                  src={file ? "/step1/upload_white.png" : "/step1/upload_gray.png"}
                  alt="upload"
                  width={20}
                  height={20}
                />
                上傳並分析
              </>
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
