import { NextResponse } from "next/server";
import {
  buildPdfSummaryContent,
  buildPdfTarfContent,
  getDefaultTarfForm,
  type TarfTermSheetForm
} from "@/lib/content/client-summary";

export const runtime = "nodejs";

const pageWidth = 612;
const pageHeight = 792;
const margin = 42;

type SummaryPdfContent = ReturnType<typeof buildPdfSummaryContent>;
type TarfPdfContent = ReturnType<typeof buildPdfTarfContent>;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number) {
  if (!text.trim()) return [""];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function fillRect(x: number, y: number, width: number, height: number, color: [number, number, number]) {
  return `${color[0]} ${color[1]} ${color[2]} rg\n${x} ${y} ${width} ${height} re f`;
}

function strokeRect(x: number, y: number, width: number, height: number, color: [number, number, number], lineWidth = 1) {
  return `${lineWidth} w\n${color[0]} ${color[1]} ${color[2]} RG\n${x} ${y} ${width} ${height} re S`;
}

function line(x1: number, y1: number, x2: number, y2: number, color: [number, number, number], lineWidth = 1) {
  return `${lineWidth} w\n${color[0]} ${color[1]} ${color[2]} RG\n${x1} ${y1} m\n${x2} ${y2} l S`;
}

function textBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  leading: number,
  color: [number, number, number],
  font: "F1" | "F2"
) {
  const commands = ["BT", `/${font} ${size} Tf`, `${color[0]} ${color[1]} ${color[2]} rg`, `1 0 0 1 ${x} ${y} Tm`, `${leading} TL`];

  lines.forEach((lineValue, index) => {
    const escaped = escapePdfText(lineValue);
    commands.push(index === 0 ? `(${escaped}) Tj` : `T* (${escaped}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
}

function buildPdfDocument(pageStreams: string[]) {
  const fontRegularObjectNumber = 3 + pageStreams.length * 2;
  const fontBoldObjectNumber = fontRegularObjectNumber + 1;
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Count ${pageStreams.length} /Kids [${pageStreams
      .map((_, index) => `${4 + index * 2} 0 R`)
      .join(" ")}] >>`
  ];

  pageStreams.forEach((stream, index) => {
    const contentObjectNumber = 3 + index * 2;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularObjectNumber} 0 R /F2 ${fontBoldObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(chunks.join("").length);
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefPosition = chunks.join("").length;
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");

  for (let i = 1; i <= objects.length; i += 1) {
    chunks.push(`${offsets[i].toString().padStart(10, "0")} 00000 n \n`);
  }

  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`);
  return Buffer.from(chunks.join(""), "utf-8");
}

function createPdfTheme() {
  return {
    backgroundColor: [0.04, 0.07, 0.12] as [number, number, number],
    panelColor: [0.08, 0.14, 0.22] as [number, number, number],
    softPanelColor: [0.05, 0.09, 0.14] as [number, number, number],
    borderColor: [0.73, 0.6, 0.31] as [number, number, number],
    rowBorderColor: [0.17, 0.25, 0.37] as [number, number, number],
    white: [1, 1, 1] as [number, number, number],
    muted: [0.78, 0.84, 0.9] as [number, number, number],
    cyan: [0.27, 0.77, 0.93] as [number, number, number]
  };
}

function createBasePage(theme: ReturnType<typeof createPdfTheme>) {
  return [
    fillRect(0, 0, pageWidth, pageHeight, theme.backgroundColor),
    line(margin, 28, pageWidth - margin, 28, theme.borderColor, 1.1),
    textBlock(["FX Structure LAB"], margin, 20, 10, 12, theme.muted, "F1")
  ];
}

function decorateCover(
  page: string[],
  content: SummaryPdfContent | TarfPdfContent,
  theme: ReturnType<typeof createPdfTheme>
) {
  page.push(fillRect(24, 654, pageWidth - 48, 122, [0.03, 0.05, 0.08]));
  page.push(strokeRect(24, 654, pageWidth - 48, 122, theme.borderColor, 1));
  page.push(textBlock([content.title], 46, 730, 24, 28, theme.white, "F2"));

  page.push(fillRect(46, 686, 172, 24, [0.07, 0.12, 0.18]));
  page.push(strokeRect(46, 686, 172, 24, theme.rowBorderColor, 0.8));
  page.push(textBlock([content.subtitle.toUpperCase()], 58, 694, 8.5, 10, theme.muted, "F1"));

  page.push(fillRect(258, 686, 128, 24, [0.07, 0.12, 0.18]));
  page.push(strokeRect(258, 686, 128, 24, theme.cyan, 0.8));
  page.push(textBlock([`Pair: ${content.pair}`], 270, 694, 8.5, 10, theme.white, "F1"));

  page.push(fillRect(413, 676, 154, 58, [0.06, 0.11, 0.17]));
  page.push(strokeRect(413, 676, 154, 58, theme.cyan, 0.8));
  page.push(line(430, 696, 468, 720, theme.cyan, 1.6));
  page.push(line(468, 720, 503, 712, theme.cyan, 1.6));
  page.push(line(503, 712, 537, 730, theme.borderColor, 1.6));
  page.push(line(537, 730, 553, 724, theme.white, 1.6));

  const highlightLayouts = [
    { x: 42, width: 184, wrap: 24 },
    { x: 238, width: 142, wrap: 18 },
    { x: 392, width: 178, wrap: 20 }
  ];

  content.highlights.forEach((highlight, index) => {
    const layout = highlightLayouts[index] ?? { x: margin + index * 176, width: 160, wrap: 20 };
    page.push(fillRect(layout.x, 584, layout.width, 68, theme.panelColor));
    page.push(strokeRect(layout.x, 584, layout.width, 68, theme.rowBorderColor, 0.9));
    page.push(textBlock([highlight.label.toUpperCase()], layout.x + 14, 628, 8.5, 10, theme.borderColor, "F1"));
    page.push(textBlock(wrapText(highlight.value, layout.wrap), layout.x + 14, 606, 11.5, 13, theme.white, "F2"));
  });
}

function buildSummaryPdf(locale: string) {
  const summary = buildPdfSummaryContent(locale);
  const theme = createPdfTheme();
  const pageStreams: string[] = [];
  let currentPage = createBasePage(theme);
  decorateCover(currentPage, summary, theme);
  let currentY = 556;

  function pushNewPage() {
    pageStreams.push(currentPage.join("\n"));
    currentPage = createBasePage(theme);
    currentPage.push(textBlock([summary.subtitle.toUpperCase()], margin, 742, 11, 14, theme.borderColor, "F1"));
    currentY = 704;
  }

  for (const section of summary.sections) {
    const bodyLines = wrapText(section.body, 86);
    const boxHeight = 40 + bodyLines.length * 14;

    if (currentY - boxHeight < 72) {
      pushNewPage();
    }

    const bottom = currentY - boxHeight;
    currentPage.push(fillRect(margin, bottom, pageWidth - margin * 2, boxHeight, theme.panelColor));
    currentPage.push(strokeRect(margin, bottom, pageWidth - margin * 2, boxHeight, theme.rowBorderColor, 0.9));
    currentPage.push(textBlock([section.title.toUpperCase()], margin + 16, currentY - 22, 9, 11, theme.borderColor, "F1"));
    currentPage.push(textBlock(bodyLines, margin + 16, currentY - 42, 10.5, 14, theme.white, "F1"));

    currentY = bottom - 16;
  }

  const disclaimerLines = wrapText(summary.disclaimer, 86);
  const disclaimerHeight = 28 + disclaimerLines.length * 12;

  if (currentY - disclaimerHeight - 16 < 72) {
    pushNewPage();
  }

  currentPage.push(fillRect(margin, currentY - disclaimerHeight, pageWidth - margin * 2, disclaimerHeight, theme.softPanelColor));
  currentPage.push(strokeRect(margin, currentY - disclaimerHeight, pageWidth - margin * 2, disclaimerHeight, theme.borderColor, 0.9));
  currentPage.push(textBlock(["DISCLAIMER"], margin + 16, currentY - 18, 8.5, 10, theme.borderColor, "F1"));
  currentPage.push(textBlock(disclaimerLines, margin + 16, currentY - 36, 9.5, 12, theme.muted, "F1"));

  pageStreams.push(currentPage.join("\n"));
  return buildPdfDocument(pageStreams);
}

function buildTarfPdf(form: TarfTermSheetForm) {
  const content = buildPdfTarfContent(form);
  const theme = createPdfTheme();
  const pageStreams: string[] = [];
  let currentPage = createBasePage(theme);
  decorateCover(currentPage, content, theme);
  let currentY = 556;

  function pushNewPage() {
    pageStreams.push(currentPage.join("\n"));
    currentPage = createBasePage(theme);
    currentPage.push(textBlock([content.subtitle.toUpperCase()], margin, 742, 11, 14, theme.borderColor, "F1"));
    currentY = 704;
  }

  for (const section of content.sections) {
    const rowHeights = section.rows.map((row) => {
      const valueLines = wrapText(row.value, 52);
      return Math.max(26, 16 + valueLines.length * 12);
    });
    const sectionHeight = 34 + rowHeights.reduce((sum, height) => sum + height, 0);

    if (currentY - sectionHeight < 84) {
      pushNewPage();
    }

    const sectionBottom = currentY - sectionHeight;
    currentPage.push(fillRect(margin, sectionBottom, pageWidth - margin * 2, sectionHeight, theme.panelColor));
    currentPage.push(strokeRect(margin, sectionBottom, pageWidth - margin * 2, sectionHeight, theme.rowBorderColor, 0.9));
    currentPage.push(fillRect(margin, currentY - 34, pageWidth - margin * 2, 34, theme.softPanelColor));
    currentPage.push(textBlock([section.title.toUpperCase()], margin + 16, currentY - 20, 9, 11, theme.borderColor, "F1"));

    let rowTop = currentY - 34;
    section.rows.forEach((row, index) => {
      const rowHeight = rowHeights[index];
      const rowBottom = rowTop - rowHeight;
      const valueLines = wrapText(row.value, 52);
      currentPage.push(fillRect(margin, rowBottom, 172, rowHeight, [0.07, 0.12, 0.18]));
      currentPage.push(strokeRect(margin, rowBottom, pageWidth - margin * 2, rowHeight, theme.rowBorderColor, 0.5));
      currentPage.push(textBlock(wrapText(row.label.toUpperCase(), 20), margin + 12, rowTop - 15, 8.5, 10, theme.muted, "F1"));
      currentPage.push(textBlock(valueLines, margin + 188, rowTop - 15, 9.7, 12, theme.white, "F1"));
      rowTop = rowBottom;
    });

    currentY = sectionBottom - 18;
  }

  const warningLines = wrapText(content.riskWarning, 88);
  const warningHeight = 34 + warningLines.length * 12;

  if (currentY - warningHeight - 58 < 72) {
    pushNewPage();
  }

  currentPage.push(fillRect(margin, currentY - warningHeight, pageWidth - margin * 2, warningHeight, [0.16, 0.1, 0.05]));
  currentPage.push(strokeRect(margin, currentY - warningHeight, pageWidth - margin * 2, warningHeight, theme.borderColor, 0.9));
  currentPage.push(textBlock(["RISK WARNING"], margin + 16, currentY - 18, 8.5, 10, theme.borderColor, "F1"));
  currentPage.push(textBlock(warningLines, margin + 16, currentY - 34, 9.5, 12, theme.white, "F1"));
  currentY -= warningHeight + 16;

  const disclaimerLines = wrapText(content.disclaimer, 86);
  const disclaimerHeight = 28 + disclaimerLines.length * 12;
  currentPage.push(fillRect(margin, currentY - disclaimerHeight, pageWidth - margin * 2, disclaimerHeight, theme.softPanelColor));
  currentPage.push(strokeRect(margin, currentY - disclaimerHeight, pageWidth - margin * 2, disclaimerHeight, theme.borderColor, 0.9));
  currentPage.push(textBlock(["DISCLAIMER"], margin + 16, currentY - 18, 8.5, 10, theme.borderColor, "F1"));
  currentPage.push(textBlock(disclaimerLines, margin + 16, currentY - 36, 9.2, 12, theme.muted, "F1"));

  pageStreams.push(currentPage.join("\n"));
  return buildPdfDocument(pageStreams);
}

type PdfRequestBody =
  | {
      mode?: "summary";
      locale?: string;
    }
  | {
      mode: "tarf";
      locale?: string;
      form?: Partial<TarfTermSheetForm>;
    };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? "en";
  const pdf = buildSummaryPdf(locale);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fx-summary-${locale}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as PdfRequestBody;
  const locale = body.locale ?? "en";

  if (body.mode === "tarf") {
    const form = { ...getDefaultTarfForm(), ...body.form };
    const pdf = buildTarfPdf(form);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="tarf-termsheet-${locale}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const pdf = buildSummaryPdf(locale);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="fx-summary-${locale}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
