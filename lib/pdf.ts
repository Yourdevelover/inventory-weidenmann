"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPdf(title: string, head: string[], body: (string | number)[][], filename: string) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Tanggal: ${now}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save(filename);
}
