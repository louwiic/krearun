import { PDFDocument, PageSizes, PrintScaling, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { AddressLabel, AddressLabelIssue } from "./address-labels";

const mm = (value: number) => (value * 72) / 25.4;
export const ADDRESS_LABEL_LAYOUT = {
  columns: 2,
  rows: 4,
  perPage: 8,
  width: mm(92.5),
  height: mm(60),
  margin: mm(10),
  top: mm(22),
  gap: mm(5),
  padding: mm(5),
};

// Normalize typographic dashes without dropping or transliterating names/addresses.
const printable = (text: string) => text.replace(/[\u2010-\u2015\u2212]/g, "-");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of printable(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const character of word) {
      if (font.widthOfTextAtSize(line + character, size) > width && line) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type LabelLine = { text: string; size: number; font: PDFFont; advance: number };
function fitLabel(label: AddressLabel, regular: PDFFont, bold: PDFFont): LabelLine[] | null {
  const layout = ADDRESS_LABEL_LAYOUT;
  const width = layout.width - 2 * layout.padding;
  const height = layout.height - 2 * layout.padding - 14;
  for (const size of [12, 11, 10]) {
    const name = wrap(label.name, bold, size + 1, width).map((text) => ({
      text, size: size + 1, font: bold, advance: (size + 1) * 1.3,
    }));
    if (name.length) name[name.length - 1].advance += 4;
    const address = label.lines.flatMap((text) => wrap(text, regular, size, width))
      .map((text) => ({ text, size, font: regular, advance: size * 1.3 }));
    const lines = [...name, ...address];
    if (lines.reduce((sum, line) => sum + line.advance, 0) <= height) return lines;
  }
  return null;
}

export async function generateAddressLabelsPdf(labels: AddressLabel[]) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Krearun - Planche adresses - Commandes prêtes");
  pdf.setAuthor("Krearun");
  pdf.setLanguage("fr-FR");
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const issues: AddressLabelIssue[] = [];
  const fitted: { label: AddressLabel; lines: LabelLine[] }[] = [];
  for (const label of labels) {
    let lines: LabelLine[] | null;
    try {
      lines = fitLabel(label, regular, bold);
    } catch {
      issues.push({ ...label, reason: "Caractère non pris en charge dans le nom ou l’adresse : vérifier avant impression." });
      continue;
    }
    if (!lines) {
      issues.push({ ...label, reason: "Adresse trop longue pour une étiquette : raccourcir les compléments avant impression." });
      continue;
    }
    fitted.push({ label, lines });
  }
  if (!fitted.length) return { bytes: null, count: 0, pages: 0, issues };

  const layout = ADDRESS_LABEL_LAYOUT;
  const pageCount = Math.ceil(fitted.length / layout.perPage);
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = pdf.addPage(PageSizes.A4);
    const height = page.getHeight();
    page.drawText("KREARUN / PLANCHE ADRESSES", {
      x: layout.margin, y: height - mm(12), font: bold, size: 10,
    });
    page.drawText("Commandes prêtes - A4 portrait - Taille réelle 100 % - Découper sur les pointillés", {
      x: layout.margin, y: height - mm(17), font: regular, size: 8,
    });
    for (const [index, { label, lines }] of fitted
      .slice(pageIndex * layout.perPage, (pageIndex + 1) * layout.perPage).entries()) {
      const x = layout.margin + (index % layout.columns) * (layout.width + layout.gap);
      const top = height - layout.top - Math.floor(index / layout.columns) * (layout.height + layout.gap);
      page.drawRectangle({
        x, y: top - layout.height, width: layout.width, height: layout.height,
        borderColor: rgb(0.55, 0.55, 0.55), borderWidth: 0.5, borderDashArray: [3, 3],
      });
      page.drawText(`Commande #${label.number}`, {
        x: x + layout.padding, y: top - layout.padding - 7,
        size: 7, font: regular, color: rgb(0.4, 0.4, 0.4),
      });
      let cursor = top - layout.padding - 14;
      for (const line of lines) {
        page.drawText(line.text, {
          x: x + layout.padding, y: cursor - line.size,
          font: line.font, size: line.size, color: rgb(0, 0, 0),
        });
        cursor -= line.advance;
      }
    }
    page.drawText(`${fitted.length} étiquette(s) - Page ${pageIndex + 1} / ${pageCount}`, {
      x: layout.margin, y: mm(10), size: 8, font: regular, color: rgb(0.4, 0.4, 0.4),
    });
  }
  return { bytes: await pdf.save(), count: fitted.length, pages: pageCount, issues };
}
