import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import {
  isDone,
  displayName,
  PROJECT_TYPES,
  TYPE_LABEL,
} from "@/lib/projects";

export const runtime = "nodejs";

type Row = {
  type: string;
  name: string;
  client: string;
  status: string;
  effort: string;
  period: string;
  assignees: string;
};

async function buildRows(): Promise<Row[]> {
  const projects = await prisma.project.findMany({
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
    include: { assignments: true },
  });
  return projects
    .filter((p) => !isDone(p))
    .sort(
      (a, b) =>
        PROJECT_TYPES.indexOf(a.type as never) -
        PROJECT_TYPES.indexOf(b.type as never)
    )
    .map((p) => ({
      type: TYPE_LABEL[p.type] ?? p.type,
      name: displayName(p),
      client: p.client,
      status: p.status,
      effort: p.effort ? `${p.effort} ${p.effortUnit}` : "-",
      period:
        (p.startDate ?? "") + (p.endDate ? ` ~ ${p.endDate}` : ""),
      assignees: p.assignments.map((a) => a.name).join(", "),
    }));
}

const HEADERS = [
  ["type", "구분", 10],
  ["name", "프로젝트", 34],
  ["client", "고객사", 14],
  ["status", "상태", 10],
  ["effort", "공수", 10],
  ["period", "기간", 24],
  ["assignees", "담당자", 24],
] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function makeXlsx(rows: Row[]): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("주간보고");
  ws.columns = HEADERS.map(([key, header, width]) => ({
    key,
    header,
    width,
  }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.alignment = { vertical: "middle", horizontal: "center" };
  head.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3730A3" },
    };
  });
  rows.forEach((r) => ws.addRow(r));
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    })
  );
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

async function makePptx(rows: Row[]): Promise<Uint8Array> {
  // pptxgenjs 는 CJS 기본 export
  const PptxModule = await import("pptxgenjs");
  const Pptx = (PptxModule.default ?? PptxModule) as unknown as new () => {
    defineLayout: (o: { name: string; width: number; height: number }) => void;
    layout: string;
    addSlide: () => {
      addText: (t: string, o: Record<string, unknown>) => void;
      addTable: (rows: unknown[][], o: Record<string, unknown>) => void;
    };
    write: (o: { outputType: string }) => Promise<unknown>;
  };
  const pptx = new Pptx();
  pptx.defineLayout({ name: "A4", width: 11.69, height: 8.27 });
  pptx.layout = "A4";

  // 표지
  const cover = pptx.addSlide();
  cover.addText("주간 업무 보고", {
    x: 0.6, y: 2.6, w: 10, h: 1, fontSize: 36, bold: true, color: "3730A3",
  });
  cover.addText(`작성일: ${today()}`, {
    x: 0.6, y: 3.7, w: 10, h: 0.5, fontSize: 16, color: "64748B",
  });
  cover.addText(`진행 중 프로젝트 ${rows.length}건`, {
    x: 0.6, y: 4.2, w: 10, h: 0.5, fontSize: 16, color: "64748B",
  });

  // 표
  const slide = pptx.addSlide();
  slide.addText("프로젝트 현황", {
    x: 0.4, y: 0.3, w: 10, h: 0.5, fontSize: 20, bold: true, color: "1E293B",
  });
  const header = HEADERS.map(([, label]) => ({
    text: label,
    options: { bold: true, color: "FFFFFF", fill: "3730A3", align: "center" },
  }));
  const body = rows.map((r) =>
    HEADERS.map(([key]) => ({
      text: String(r[key as keyof Row] ?? ""),
      options: { fontSize: 9, color: "334155" },
    }))
  );
  slide.addTable([header, ...body], {
    x: 0.4, y: 0.9, w: 10.9,
    border: { type: "solid", color: "E2E8F0", pt: 0.5 },
    colW: [1.0, 3.4, 1.5, 1.0, 1.0, 1.7, 1.3],
    fontSize: 9,
    valign: "middle",
  });

  const out = await pptx.write({ outputType: "nodebuffer" });
  return new Uint8Array(out as ArrayBuffer);
}

export async function GET(req: NextRequest) {
  const format = (new URL(req.url).searchParams.get("format") ?? "xlsx").toLowerCase();
  const rows = await buildRows();
  const stamp = today();

  if (format === "pptx") {
    const data = await makePptx(rows);
    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="weekly-report-${stamp}.pptx"`,
      },
    });
  }

  const data = await makeXlsx(rows);
  return new NextResponse(data as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="weekly-report-${stamp}.xlsx"`,
    },
  });
}
