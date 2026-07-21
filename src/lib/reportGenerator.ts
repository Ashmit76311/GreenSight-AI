import { jsPDF } from "jspdf";

type Result = {
  cropPct: number;
  weedPct: number;
  soilPct: number;
  density: number;
  dose: number;
  saved: number;
  grid: boolean[];
  onCount: number;
  segmentedUrl: string;
};

async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function riskLevel(density: number): { label: string; color: [number, number, number] } {
  if (density < 5) return { label: "LOW", color: [67, 160, 71] };
  if (density < 15) return { label: "MEDIUM", color: [251, 140, 0] };
  return { label: "HIGH", color: [229, 57, 53] };
}

export async function generateReport(
  result: Result,
  originalUrl: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210;
  const margin = 14;
  const contentW = W - margin * 2;
  let y = 0;

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, W, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Green-Scanner", margin, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("AI for Precision Agriculture", margin, 17);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Precision Agriculture Analysis Report", W / 2, 11, { align: "center" });

  const now = new Date();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${now.toLocaleString()}`, W - margin, 17, { align: "right" });

  y = 34;

  // ── IMAGES ───────────────────────────────────────────────────────────────
  const imgH = 48;
  const imgW = (contentW - 4) / 2;

  try {
    const origB64 = await toBase64(originalUrl);
    doc.addImage(origB64, "JPEG", margin, y, imgW, imgH, undefined, "FAST");
  } catch {
    doc.setFillColor(230, 226, 214);
    doc.rect(margin, y, imgW, imgH, "F");
    doc.setTextColor(90, 107, 112);
    doc.setFontSize(9);
    doc.text("Original image", margin + imgW / 2, y + imgH / 2, { align: "center" });
  }

  try {
    const segB64 = await toBase64(result.segmentedUrl);
    doc.addImage(segB64, "JPEG", margin + imgW + 4, y, imgW, imgH, undefined, "FAST");
  } catch {
    doc.setFillColor(230, 226, 214);
    doc.rect(margin + imgW + 4, y, imgW, imgH, "F");
    doc.setTextColor(90, 107, 112);
    doc.setFontSize(9);
    doc.text("Segmented output", margin + imgW + 4 + imgW / 2, y + imgH / 2, { align: "center" });
  }

  // image captions
  doc.setTextColor(90, 107, 112);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("Original aerial image", margin + imgW / 2, y + imgH + 4, { align: "center" });
  doc.text("AI segmented output", margin + imgW + 4 + imgW / 2, y + imgH + 4, { align: "center" });

  y += imgH + 10;

  // ── METRICS ──────────────────────────────────────────────────────────────
  const metrics = [
    { label: "Crop Coverage", value: `${result.cropPct.toFixed(1)}%`, color: [67, 160, 71] as [number, number, number] },
    { label: "Weed Density", value: `${result.weedPct.toFixed(1)}%`, color: [229, 57, 53] as [number, number, number] },
    { label: "Soil Coverage", value: `${result.soilPct.toFixed(1)}%`, color: [141, 110, 99] as [number, number, number] },
    { label: "Herbicide Dose", value: `${result.dose} L/ac`, color: [79, 195, 247] as [number, number, number] },
    { label: "Chemical Saved", value: `${result.saved} L/ac`, color: [251, 140, 0] as [number, number, number] },
  ];

  const cardW = contentW / 5 - 1.5;
  metrics.forEach((m, i) => {
    const x = margin + i * (cardW + 1.9);
    doc.setDrawColor(230, 226, 214);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, 20, 2, 2, "FD");

    // color accent strip at top
    doc.setFillColor(...m.color);
    doc.roundedRect(x, y, cardW, 3, 2, 2, "F");
    doc.setFillColor(...m.color);
    doc.rect(x, y + 1.5, cardW, 1.5, "F");

    doc.setTextColor(...m.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(m.value, x + cardW / 2, y + 12, { align: "center" });

    doc.setTextColor(90, 107, 112);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(m.label, x + cardW / 2, y + 17.5, { align: "center" });
  });

  y += 26;

  // ── SPRAY GRID ───────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(38, 50, 56);
  doc.text("Precision Spray Grid (8×8)", margin, y);
  y += 5;

  const cellSize = 7;
  const gridW = 8 * cellSize;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const idx = row * 8 + col;
      const on = result.grid[idx];
      doc.setFillColor(on ? 229 : 245, on ? 57 : 241, on ? 53 : 232);
      doc.setDrawColor(255, 255, 255);
      doc.rect(margin + col * cellSize, y + row * cellSize, cellSize, cellSize, "FD");

      doc.setTextColor(on ? 255 : 160, on ? 255 : 160, on ? 255 : 160);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(4.5);
      doc.text(on ? "ON" : "OFF", margin + col * cellSize + cellSize / 2, y + row * cellSize + cellSize / 2 + 1, { align: "center" });
    }
  }

  // grid stats on the right
  const statsX = margin + gridW + 8;
  const statsW = contentW - gridW - 8;
  const coverageSaved = Math.round(((64 - result.onCount) / 64) * 100);
  const risk = riskLevel(result.density);

  const stats = [
    { label: "ON cells (spray)", value: `${result.onCount} / 64`, color: [229, 57, 53] as [number, number, number] },
    { label: "Coverage saved", value: `${coverageSaved}%`, color: [67, 160, 71] as [number, number, number] },
    { label: "Weed density", value: `${result.density.toFixed(1)}%`, color: [251, 140, 0] as [number, number, number] },
    { label: "Dose / ha", value: `${result.dose} L`, color: [79, 195, 247] as [number, number, number] },
    { label: "Saved / ha", value: `${result.saved} L`, color: [67, 160, 71] as [number, number, number] },
    { label: "Est. Rs. saved/ha", value: `Rs. ${(result.saved * 800).toFixed(0)}`, color: [67, 160, 71] as [number, number, number] },
  ];

  let sy = y;
  stats.forEach((s) => {
    doc.setFillColor(245, 241, 232);
    doc.roundedRect(statsX, sy, statsW, 8, 1, 1, "F");
    doc.setTextColor(...s.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(s.value, statsX + statsW - 2, sy + 5.5, { align: "right" });
    doc.setTextColor(90, 107, 112);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(s.label, statsX + 2, sy + 5.5);
    sy += 10;
  });

  y += 8 * cellSize + 6;

  // ── AI FIELD SUMMARY ─────────────────────────────────────────────────────
  doc.setFillColor(245, 241, 232);
  doc.roundedRect(margin, y, contentW, 50, 3, 3, "F");
  doc.setDrawColor(230, 226, 214);
  doc.roundedRect(margin, y, contentW, 50, 3, 3, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(38, 50, 56);
  doc.text("AI Field Summary", margin + 4, y + 7);

  // risk badge
  doc.setFillColor(...risk.color);
  doc.roundedRect(margin + 4, y + 10, 28, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${risk.label} RISK`, margin + 18, y + 15, { align: "center" });

  // narrative
  const narrative =
    `Based on a measured weed density of ${result.density.toFixed(1)}% within vegetation, ` +
    `this field shows ${risk.label.toLowerCase()} weed infestation. ` +
    `Green-Scanner recommends targeted spraying on ${result.onCount} of 64 grid cells, ` +
    `saving approximately ${coverageSaved}% of herbicide coverage compared to blanket spraying.`;

  doc.setTextColor(38, 50, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const lines = doc.splitTextToSize(narrative, contentW - 8);
  doc.text(lines, margin + 4, y + 22);

  // recommendations
  const recs = [
    "Target only ON cells in the spray grid for herbicide application.",
    risk.label === "HIGH"
      ? "High infestation detected — consider follow-up scan after treatment."
      : "Maintain monitoring schedule to track weed suppression over time.",
    `Estimated herbicide savings: ${result.saved} L/acre (~$${(result.saved * 50).toFixed(0)}/acre).`,
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(27, 94, 32);
  doc.text("Recommendations:", margin + 4, y + 38);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(38, 50, 56);
  recs.forEach((rec, i) => {
    doc.text(`• ${rec}`, margin + 4, y + 43 + i * 4.5, { maxWidth: contentW - 8 });
  });

  y += 56;

  // ── FOOTER ───────────────────────────────────────────────────────────────
  doc.setFillColor(27, 94, 32);
  doc.rect(0, 285, W, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Generated by Green-Scanner | AI for Precision Agriculture", margin, 292);
  doc.text(`${now.toLocaleString()} · Page 1`, W - margin, 292, { align: "right" });

  // download
  const filename = `GreenScanner_Report_${now.toISOString().slice(0, 19).replace(/[T:]/g, "-")}.pdf`;
  doc.save(filename);
}
