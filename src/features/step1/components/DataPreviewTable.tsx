// src/features/step1/components/DataPreviewTable.tsx

import React from 'react';
import Image from 'next/image';
import { FileProcessor } from '@/utils/fileProcessor';
import type { DataRow, DataValue } from '@/stores/analysisStore';

interface DataPreviewTableProps {
    parsedData: DataRow[];
    maxRows?: number;
}

export default function DataPreviewTable({ 
    parsedData, 
    maxRows = 5 
}: DataPreviewTableProps) {
    if (parsedData.length === 0) return null;

    // 取得第一列的欄位名稱
    const columns = Object.keys(parsedData[0]);

    // 格式化顯示值的輔助函數
    const formatCellValue = (value: DataValue): string => {
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    };

    return (
        <div className="mt-10 lg:mt-16 space-y-2">
            <div className="flex items-center gap-2">
                <Image
                    src="/step1/checkbox_icon@2x.png"
                    alt="checkbox"
                    width={21.33}
                    height={20}
                    className="-mt-10 -mr-2 lg:-mt-6 lg-mr-0"
                />
                <p className="text-xs text-[#0F2844] -mt-4 mb-2">
                    以下為預覽資料（最多顯示前{maxRows}列）：
                </p>
            </div>
            <div className="overflow-auto border rounded-lg text-sm max-h-64 text-[#0F2844]">
                <table className="min-w-full border-collapse text-left">
                    <thead className="bg-[#EEF2F9] text-[#586D81] sticky top-0 z-10">
                        <tr>
                            {columns.map((key) => (
                                <th key={key} className="px-3 py-2 border-b whitespace-nowrap">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {parsedData.slice(0, maxRows).map((row: DataRow, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                                {columns.map((col: string, j: number) => {
                                    const value: DataValue = row[col];
                                    const displayValue = formatCellValue(value);

                                    return (
                                        <td key={j} className="px-3 py-2 border-b whitespace-nowrap">
                                            {displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}