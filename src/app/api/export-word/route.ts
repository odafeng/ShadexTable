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
    const exportCols = ["Variable", ...groupKeys, "P", "Method"];

    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(
      new TableRow({
        children: exportCols.map((col) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      col === "Variable"
                        ? "Variable"
                        : col === "P"
                        ? "P"
                        : col === "Method"
                        ? "Method"
                        : `${col} (n=${groupCounts[col] || "?"})`,
                    bold: true,
                    size: 21, // 10.5pt
                  }),
                ],
                spacing: { after: 100 },
              }),
            ],
          })
        ),
      })
    );

    // Data rows
    resultTable
      .filter((row: any) => row.Variable?.replace(/\*/g, "") !== groupVar)
      .forEach((row: any) => {
        const isBoldRow = row.Variable?.startsWith("**");
        tableRows.push(
          new TableRow({
            children: exportCols.map((col) => {
              const raw = row[col];
              const text = raw === "nan" || raw == null ? "" : String(raw);
              return new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text,
                        bold: col === "Variable" && isBoldRow,
                        size: 21,
                      }),
                    ],
                    spacing: { after: 100 },
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
            new Paragraph({
              text: "Table 1 Summary",
              heading: "Heading1",
              alignment: AlignmentType.LEFT,
              spacing: { after: 200 },
            }),
            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: { style: "none", size: 0, color: "auto" },
                bottom: { style: "none", size: 0, color: "auto" },
                left: { style: "none", size: 0, color: "auto" },
                right: { style: "none", size: 0, color: "auto" },
                insideHorizontal: { style: "none", size: 0, color: "auto" },
                insideVertical: { style: "none", size: 0, color: "auto" },
              },
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
    return NextResponse.json({ error: "Failed to generate Word document." }, { status: 500 });
  }
}