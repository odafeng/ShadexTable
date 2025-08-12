// step1/components/ColumnAnalysisDisplay.tsx
import React from 'react';
import { ChevronDown, TableProperties } from 'lucide-react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent
} from "@/components/ui/accordion";
import { typeColorClass } from "@/lib/constants";
import { useAnalysisStore } from '@/stores/analysisStore';

export default function ColumnAnalysisDisplay() {
    // 使用 columnProfile，不需要任何類型轉換
    const columnProfile = useAnalysisStore(state => state.columnProfile);
    const showPreview = useAnalysisStore(state => state.showPreview);
    const columnAnalysisLoading = useAnalysisStore(state => state.columnAnalysisLoading);
    
    return (
        <div className="mt-8 lg:mt-10">
            {/* 載入狀態 */}
            {columnAnalysisLoading && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600">🔍 正在分析欄位特性...</p>
                    <p className="text-gray-500 text-sm mt-1">系統正在自動識別資料類型和統計特徵</p>
                </div>
            )}

            {/* 成功狀態 - 顯示表格 */}
            {!columnAnalysisLoading && showPreview && columnProfile && columnProfile.length > 0 && (
                <Accordion type="multiple" defaultValue={["column-preview"]} className="w-full">
                    <AccordionItem value="column-preview">
                        <AccordionTrigger
                            className="text-[#0F2844] text-[20px] font-medium tracking-[1.5px] flex items-center justify-between group"
                            style={{ fontFamily: '"Noto Sans TC", "思源黑體", sans-serif' }}
                        >
                            <div className="flex items-center gap-2">
                                <TableProperties className="text-[#0F2844]" size={20} />
                                <span className="cursor-pointer">
                                    自動欄位解析結果 ({columnProfile.length} 個欄位)
                                </span>
                                <ChevronDown className="h-5 w-5 text-[#0F2844] transition-transform duration-300 group-data-[state=open]:rotate-180 cursor-pointer" />
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="mt-2">
                            <div className="overflow-auto max-h-64 rounded-lg border">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[#EEF2F9] sticky top-0 text-[#586D81] border-b border-gray-300">
                                        <tr>
                                            <th className="px-3 py-2 text-left whitespace-nowrap">欄位名稱</th>
                                            <th className="px-3 py-2 text-left whitespace-nowrap">遺漏值比例</th>
                                            <th className="px-3 py-2 text-left whitespace-nowrap">唯一值數量</th>
                                            <th className="px-3 py-2 text-left whitespace-nowrap">資料類型</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {columnProfile.map((col, i) => (
                                            <tr key={i} className="hover:bg-gray-50 border-b border-gray-200">
                                                <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                    {col.column || `欄位 ${i + 1}`}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                    {col.missingPercentage !== undefined 
                                                        ? `${col.missingPercentage.toFixed(1)}%` 
                                                        : "0.0%"}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-[#0F2844]">
                                                    {col.uniqueValues ?? "–"}
                                                </td>
                                                <td
                                                    className={`px-3 py-2 whitespace-nowrap font-medium ${
                                                        typeColorClass[col.dataType] || "text-gray-500"
                                                    }`}
                                                >
                                                    {col.dataType ?? "不明"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </div>
    );
}