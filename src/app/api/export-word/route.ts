import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import { AlignmentType, WidthType } from "docx";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resultTable, groupVar, groupCounts } = body;

    const baseCols = ["Variable", "P", "Method", "Missing", "Normal"];
    const allKeys = Object.keys(resultTable?.[0] || {});
    const groupKeys = allKeys.filter((k) => !baseCols.includes(k));
    const exportCols = ["Variable", ...groupKeys, "P"];

    const tableRows: TableRow[] = [];

    // 表頭列 - 添加下框線
    tableRows.push(
      new TableRow({
        children: exportCols.map((col) => {
          const label =
            col === "Variable"
              ? ""
              : col === "P"
              ? "p value"
              : `${col} (n = ${groupCounts[col] || "?"})`;

          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    font: "Arial",
                    size: 21,
                  }),
                ],
                spacing: { line: 360 },
              }),
            ],
            borders: {
              bottom: {
                style: "single",
                size: 4,
                color: "000000",
              },
            },
          });
        }),
      })
    );

    // 資料列
    const dataRows = resultTable.filter((row: any) => row.Variable?.replace(/\*/g, "") !== groupVar);
    
    
    dataRows.forEach((row: any, index: number) => {
      const isMainVariable = row.Variable?.startsWith("**");
      const isLastRow = index === dataRows.length - 1; // 檢查是否為最後一列
      
      

      const rowCells = exportCols.map((col) => {
        const raw = row[col];

        // ✅ 強制過濾空值符號
        const cleanRaw =
          raw === null || raw === "nan" || raw === "undefined" || raw === "—"
            ? ""
            : String(raw);

        // ✅ 主變項名稱處理與粗體邏輯
        const isVariableCol = col === "Variable";
        const displayText = isVariableCol
          ? cleanRaw.replace(/\*/g, "")
          : cleanRaw;

        const cellBorders = isLastRow ? {
          bottom: {
            style: "single" as const,
            size: 6, // 增加線條寬度
            color: "000000",
          },
        } : undefined;

        if (isLastRow) {
          
        }

        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: displayText,
                  bold: isVariableCol && isMainVariable,
                  font: "Arial",
                  size: 21,
                }),
              ],
              spacing: { line: 360 },
              indent: isVariableCol && !isMainVariable ? { left: 500 } : undefined, // ✅ 子變項縮排
            }),
          ],
          borders: cellBorders,
        });
      });

      tableRows.push(new TableRow({ children: rowCells }));
    });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Table 1. Baseline Characteristics of the Study Population",
                  bold: true,
                  font: "Arial",
                  size: 24,
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
            }),

            new Table({
              rows: tableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: "none", size: 0, color: "auto" },
                bottom: { style: "none", size: 0, color: "auto" },
                left: { style: "none", size: 0, color: "auto" },
                right: { style: "none", size: 0, color: "auto" },
                insideHorizontal: { style: "none", size: 0, color: "auto" },
                insideVertical: { style: "none", size: 0, color: "auto" },
              },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Note. Data are presented as mean ± standard deviation, median (range) or number (%), as appropriate.",
                  italics: true,
                  font: "Arial",
                  size: 20,
                }),
              ],
              spacing: { before: 200 },
            }),
          ],
        },
      ],
    });

    // 🔧 修復：將 Buffer 轉換為 Uint8Array
    const buffer = await Packer.toBuffer(doc);
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=table-summary.docx",
      },
    });
  } catch (err) {
    console.error("❌ Word 匯出錯誤：", err);
    return NextResponse.json(
      { error: "Failed to generate Word document." },
      { status: 500 }
    );
  }
}