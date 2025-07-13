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

    // 表頭
    tableRows.push(
      new TableRow({
        children: exportCols.map((col) => {
          const isGroupCol = col !== "Variable" && col !== "P";
          const text =
            col === "Variable"
              ? "" // ✅ 不顯示 Variable 字樣
              : col === "P"
              ? "p value"
              : `${col} (n = ${groupCounts[col] || "?"})`;

          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    size: 21,
                    font: "Arial",
                  }),
                ],
                spacing: { line: 360 }, // ✅ 1.5 倍行距
              }),
            ],
          });
        }),
      })
    );

    // 資料列
    resultTable
      .filter((row: any) => row.Variable?.replace(/\*/g, "") !== groupVar)
      .forEach((row: any) => {
        const isMainVariable = row.Variable?.startsWith("**");

        tableRows.push(
          new TableRow({
            children: exportCols.map((col) => {
              const raw = row[col];
              const cleanText =
                raw === "nan" || raw == null ? "" : String(raw);
              const displayText =
                col === "Variable"
                  ? cleanText.replace(/\*/g, "")
                  : cleanText;

              return new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: displayText,
                        bold: col === "Variable" && isMainVariable,
                        size: 21,
                        font: "Arial",
                      }),
                    ],
                    spacing: { line: 360 }, // ✅ 1.5 倍行距
                  }),
                ],
              });
            }),
          })
        );
      });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // 表格標題
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Table 1. Baseline Characteristics of the Study Population",
                  bold: true,
                  size: 24,
                  font: "Arial",
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
            }),

            // 表格本體
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

            // 註記
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    "Note. Data are presented as mean ± standard deviation or number (%), as appropriate.",
                  italics: true,
                  size: 20,
                  font: "Arial",
                }),
              ],
              spacing: { before: 200 },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=table-summary.docx",
      },
    });
  } catch (err) {
    console.error("Error generating Word:", err);
    return NextResponse.json(
      { error: "Failed to generate Word document." },
      { status: 500 }
    );
  }
}
