// Spreadsheet (.xlsx) canvas table renderer and batch image rotation helpers.
import { ROTATE_GRADIENT_PRESETS } from "./workspace-presets";
import { buildZip, extractTextFromZip } from "./pdf-and-word-renderer";

export const getColIndexFromCellRef = (cellRef: string): number => {
  const match = cellRef.match(/^([A-Z]+)/i);
  if (!match) return -1;
  const letters = match[1]!.toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, col - 1);
};

export interface ExcelMergeRange {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
}

export interface ExcelSheetMetadata {
  name: string;
  sheetId: number;
  target: string;
}

export const getExcelSheetsMetadata = async (
  buffer: ArrayBuffer
): Promise<{ sheets: ExcelSheetMetadata[] }> => {
  const result: ExcelSheetMetadata[] = [];
  try {
    const wbXml = await extractTextFromZip(buffer, "xl/workbook.xml");
    const relsXml = await extractTextFromZip(buffer, "xl/_rels/workbook.xml.rels");

    const relsMap = new Map<string, string>();
    if (relsXml) {
      const relsDom = new DOMParser().parseFromString(relsXml, "text/xml");
      Array.from(relsDom.querySelectorAll("Relationship")).forEach((rel) => {
        const id = rel.getAttribute("Id");
        const target = rel.getAttribute("Target");
        if (id && target) {
          const norm = target.startsWith("worksheets/")
            ? `xl/${target}`
            : target.startsWith("/")
              ? target.slice(1)
              : `xl/${target}`;
          relsMap.set(id, norm);
        }
      });
    }

    if (wbXml) {
      const wbDom = new DOMParser().parseFromString(wbXml, "text/xml");
      const sheetNodes = Array.from(wbDom.querySelectorAll("sheet"));
      sheetNodes.forEach((sNode, idx) => {
        const name = sNode.getAttribute("name") || `Sheet ${idx + 1}`;
        const sheetId = parseInt(sNode.getAttribute("sheetId") || `${idx + 1}`, 10);
        const rId = sNode.getAttribute("r:id") || sNode.getAttribute("id") || "";
        const target = relsMap.get(rId) || `xl/worksheets/sheet${idx + 1}.xml`;
        result.push({ name, sheetId, target });
      });
    }
  } catch (e) {
    console.warn("Excel sheets metadata parse error:", e);
  }

  if (result.length === 0) {
    result.push({ name: "Sheet 1", sheetId: 1, target: "xl/worksheets/sheet1.xml" });
  }

  return { sheets: result };
};

export const renderExcelSheetToImage = async (
  buffer: ArrayBuffer,
  fileName: string,
  theme: "modern-slate" | "clean-white" | "emerald" | "dark" = "clean-white",
  showGridLines: boolean = true,
  format: "PNG" | "JPG" = "PNG",
  showHeader: boolean = false,
  targetSheetPath: string = "xl/worksheets/sheet1.xml"
): Promise<{ dataUrl: string; width: number; height: number }> => {
  const grid: Map<number, Map<number, string>> = new Map();
  const mergeCells: ExcelMergeRange[] = [];
  const colWidthsMap = new Map<number, number>();
  const rowHeightsMap = new Map<number, number>();
  let maxColIndex = 0;
  let maxRowIndex = 0;
  let minRowIndex = 999999;

  try {
    const sharedStrings: string[] = [];
    const sstXml = await extractTextFromZip(buffer, "xl/sharedStrings.xml");
    if (sstXml) {
      const sstDom = new DOMParser().parseFromString(sstXml, "text/xml");
      const siNodes = Array.from(sstDom.querySelectorAll("si"));
      siNodes.forEach((si) => {
        // Collect all <t> nodes, preserving text
        const text = Array.from(si.querySelectorAll("t"))
          .map((t) => t.textContent || "")
          .join("");
        sharedStrings.push(text);
      });
    }

    let sheetXml = await extractTextFromZip(buffer, targetSheetPath);
    if (!sheetXml && targetSheetPath !== "xl/worksheets/sheet1.xml") {
      sheetXml = await extractTextFromZip(buffer, "xl/worksheets/sheet1.xml");
    }
    if (!sheetXml) {
      sheetXml = await extractTextFromZip(buffer, "xl/worksheets/sheet.xml");
    }

    if (sheetXml) {
      const dom = new DOMParser().parseFromString(sheetXml, "text/xml");

      // 1. Parse column custom widths
      const colNodes = Array.from(dom.querySelectorAll("cols > col, col"));
      colNodes.forEach((c) => {
        const minAttr = c.getAttribute("min");
        const maxAttr = c.getAttribute("max");
        const widthAttr = parseFloat(c.getAttribute("width") || "0");
        if (minAttr && maxAttr && widthAttr > 0) {
          const min = parseInt(minAttr, 10) - 1;
          const max = parseInt(maxAttr, 10) - 1;
          for (let ci = min; ci <= max; ci++) {
            colWidthsMap.set(ci, widthAttr);
          }
        }
      });

      // 2. Parse merged cells
      const mcNodes = Array.from(dom.querySelectorAll("mergeCells > mergeCell, mergeCell"));
      mcNodes.forEach((mc) => {
        const ref = mc.getAttribute("ref") || "";
        const parts = ref.split(":");
        if (parts.length === 2 && parts[0] && parts[1]) {
          const startCol = getColIndexFromCellRef(parts[0]);
          const startRow = parseInt(parts[0].replace(/^[A-Z]+/i, ""), 10) - 1;
          const endCol = getColIndexFromCellRef(parts[1]);
          const endRow = parseInt(parts[1].replace(/^[A-Z]+/i, ""), 10) - 1;
          if (startCol >= 0 && startRow >= 0 && endCol >= startCol && endRow >= startRow) {
            mergeCells.push({ startCol, endCol, startRow, endRow });
          }
        }
      });

      // 3. Parse rows and coordinate-aware cells
      const rowNodes = Array.from(dom.querySelectorAll("sheetData > row, row"));
      rowNodes.forEach((rNode, rFallbackIdx) => {
        const rAttr = rNode.getAttribute("r");
        const htAttr = rNode.getAttribute("ht");
        const rowIdx = rAttr ? parseInt(rAttr, 10) - 1 : rFallbackIdx;
        if (rowIdx < 0 || rowIdx > 300) return;

        if (htAttr) {
          const ht = parseFloat(htAttr);
          if (ht > 0) {
            // Excel pt to px (~1.33)
            rowHeightsMap.set(rowIdx, Math.max(24, Math.round(ht * 1.35)));
          }
        }

        let rowMap = grid.get(rowIdx);
        if (!rowMap) {
          rowMap = new Map();
          grid.set(rowIdx, rowMap);
        }

        const cNodes = Array.from(rNode.querySelectorAll("c"));
        let lastCol = -1;
        cNodes.forEach((c) => {
          const cellRef = c.getAttribute("r") || "";
          let colIdx = getColIndexFromCellRef(cellRef);
          if (colIdx < 0) {
            colIdx = lastCol + 1;
          }
          lastCol = colIdx;

          const cellType = c.getAttribute("t");
          let cellText = "";
          if (cellType === "s") {
            const vVal = c.querySelector("v")?.textContent || "";
            const strIdx = parseInt(vVal, 10);
            cellText = !isNaN(strIdx) && sharedStrings[strIdx] !== undefined ? sharedStrings[strIdx] : vVal;
          } else if (cellType === "inlineStr") {
            cellText = c.querySelector("is t, t")?.textContent || "";
          } else {
            const vVal = c.querySelector("v")?.textContent || "";
            if (vVal && !isNaN(Number(vVal)) && vVal.includes(".")) {
              const num = Number(vVal);
              const parts = vVal.split(".");
              if (parts[1] && parts[1].length > 4) {
                cellText = num.toFixed(2);
              } else {
                cellText = vVal;
              }
            } else {
              cellText = vVal;
            }
          }

          if (cellText.trim().length > 0) {
            rowMap!.set(colIdx, cellText);
            if (colIdx > maxColIndex) maxColIndex = colIdx;
            if (rowIdx > maxRowIndex) maxRowIndex = rowIdx;
            if (rowIdx < minRowIndex) minRowIndex = rowIdx;
          }
        });
      });
    }
  } catch (e) {
    console.warn("Excel parse fallback:", e);
  }

  // Fallback demo data if sheet has no content
  if (grid.size === 0) {
    minRowIndex = 0;
    maxRowIndex = 6;
    maxColIndex = 6;
    const fallbackRows = [
      ["Item / ID", "Description", "Category", "Quantity", "Unit Price ($)", "Total ($)", "Status"],
      ["1001", "Design Wireframes & UX Flow", "Design", "1", "1,200.00", "1,200.00", "Completed"],
      ["1002", "Interactive Web App Interface", "Development", "2", "850.00", "1,700.00", "In Progress"],
      ["1003", "Cloud Server Infrastructure", "DevOps", "1", "450.00", "450.00", "Active"],
      ["1004", "Security & Pen Testing Audit", "Security", "1", "950.00", "950.00", "Verified"],
      ["1005", "Analytics & Conversion Setup", "Marketing", "3", "200.00", "600.00", "Active"],
    ];
    fallbackRows.forEach((r, ri) => {
      const rowMap = new Map<number, string>();
      r.forEach((val, ci) => rowMap.set(ci, val));
      grid.set(ri, rowMap);
    });
  }

  if (minRowIndex > maxRowIndex) {
    minRowIndex = 0;
  }

  // Ensure merge cells expand max bounds
  mergeCells.forEach((m) => {
    if (m.endCol > maxColIndex && m.endCol < 50) maxColIndex = m.endCol;
    if (m.endRow > maxRowIndex && m.endRow < 300) maxRowIndex = m.endRow;
  });

  const totalCols = maxColIndex + 1;
  const startRow = minRowIndex;
  const endRow = maxRowIndex;

  // Header row detection
  const headerKeywords = ["sr no", "item id", "description", "hsn", "mrp", "gst rate", "units in box", "landing price", "total amt", "category", "unit price"];
  const isHeaderRow = (ri: number): boolean => {
    const rowMap = grid.get(ri);
    if (!rowMap) return false;
    let matchCount = 0;
    rowMap.forEach((text) => {
      const lower = text.toLowerCase().trim();
      if (headerKeywords.some((kw) => lower.includes(kw))) matchCount++;
    });
    return matchCount >= 2;
  };

  // Find table header row index to get column header labels for percentage & alignment detection
  let tableHeaderRowIdx = -1;
  for (let ri = startRow; ri <= endRow; ri++) {
    if (isHeaderRow(ri)) {
      tableHeaderRowIdx = ri;
      break;
    }
  }

  const getColHeaderLabel = (ci: number): string => {
    if (tableHeaderRowIdx >= 0) {
      return (grid.get(tableHeaderRowIdx)?.get(ci) || "").toLowerCase().trim();
    }
    return "";
  };

  // Helper: check if a cell is covered by any merge range
  const findMerge = (ri: number, ci: number) => {
    return mergeCells.find(
      (m) => m.startRow <= ri && ri <= m.endRow && m.startCol <= ci && ci <= m.endCol
    );
  };

  // Helper: get all merged text across the merge range (concatenating any cells within the range)
  const getMergedCellText = (m: ExcelMergeRange): string => {
    const lines: string[] = [];
    for (let r = m.startRow; r <= m.endRow; r++) {
      for (let c = m.startCol; c <= m.endCol; c++) {
        const val = grid.get(r)?.get(c);
        if (val && val.trim().length > 0) {
          lines.push(val.trim());
        }
      }
    }
    return lines.join("\n");
  };

  // Calculate dynamic proportional column widths
  const colPixelWidths: number[] = [];
  for (let ci = 0; ci < totalCols; ci++) {
    const colHeader = getColHeaderLabel(ci);
    if (colWidthsMap.has(ci)) {
      const rawW = colWidthsMap.get(ci)! * 9.5;
      colPixelWidths[ci] = Math.max(55, Math.min(450, Math.round(rawW)));
    } else {
      let maxCharLen = Math.max(5, colHeader.length);
      for (let ri = startRow; ri <= endRow; ri++) {
        const isMultiCol = mergeCells.some(
          (m) => m.startRow <= ri && ri <= m.endRow && m.startCol <= ci && ci <= m.endCol && m.endCol > m.startCol
        );
        if (!isMultiCol) {
          const text = grid.get(ri)?.get(ci) || "";
          const firstLine = text.split(/\r?\n/)[0] || "";
          if (firstLine.length > maxCharLen) {
            maxCharLen = Math.min(firstLine.length, 55);
          }
        }
      }

      // Specialized sizing based on column role
      if (colHeader.includes("description") || colHeader.includes("goods") || colHeader.includes("services")) {
        colPixelWidths[ci] = Math.max(360, Math.min(480, maxCharLen * 8.5 + 24));
      } else if (colHeader.includes("sr no") || colHeader === "sr." || colHeader === "#") {
        colPixelWidths[ci] = Math.max(50, Math.min(65, maxCharLen * 8.5 + 20));
      } else if (colHeader.includes("box") && !colHeader.includes("units")) {
        colPixelWidths[ci] = Math.max(50, Math.min(70, maxCharLen * 8.5 + 20));
      } else if (colHeader.includes("total amt") || colHeader.includes("landing")) {
        colPixelWidths[ci] = Math.max(90, Math.min(130, maxCharLen * 8.5 + 24));
      } else {
        colPixelWidths[ci] = Math.max(65, Math.min(180, maxCharLen * 8.5 + 24));
      }
    }
  }

  // Calculate individual row heights
  const rowPixelHeights: number[] = [];
  for (let ri = startRow; ri <= endRow; ri++) {
    if (rowHeightsMap.has(ri)) {
      rowPixelHeights[ri] = rowHeightsMap.get(ri)!;
    } else if (isHeaderRow(ri)) {
      rowPixelHeights[ri] = 34;
    } else {
      // Check if any non-merged or single-row cell has multiline text
      let maxLines = 1;
      const rowMap = grid.get(ri);
      if (rowMap) {
        rowMap.forEach((text, ci) => {
          const merge = findMerge(ri, ci);
          // Only factor multiline height if it is NOT spanning multiple rows
          if (!merge || merge.startRow === merge.endRow) {
            const lines = text.split(/\r?\n/).length;
            if (lines > maxLines) maxLines = lines;
          }
        });
      }

      const isTitleRow = Array.from(rowMap?.values() || []).some((v) => /tax\s*invoice/i.test(v));
      if (isTitleRow) {
        rowPixelHeights[ri] = 44;
      } else if (maxLines > 1) {
        rowPixelHeights[ri] = Math.max(26, maxLines * 17 + 12);
      } else {
        rowPixelHeights[ri] = 26;
      }
    }
  }

  // Compute table geometry
  const tableWidth = colPixelWidths.reduce((acc, w) => acc + w, 0);
  const canvasW = Math.max(1260, tableWidth + 50);
  const tableStartX = Math.max(25, Math.floor((canvasW - tableWidth) / 2));

  // Cumulative column X offsets
  const colXOffsets: number[] = [0];
  for (let ci = 0; ci < totalCols; ci++) {
    colXOffsets[ci + 1] = colXOffsets[ci]! + colPixelWidths[ci]!;
  }

  // Cumulative row Y offsets
  const rowYOffsets: number[] = [0];
  for (let ri = startRow; ri <= endRow; ri++) {
    const rIdx = ri - startRow;
    rowYOffsets[rIdx + 1] = rowYOffsets[rIdx]! + rowPixelHeights[ri]!;
  }

  const tableTotalH = rowYOffsets[endRow - startRow + 1]!;
  const headerH = showHeader ? 54 : 0;
  const tableStartY = showHeader ? headerH + 20 : 20;
  const canvasH = tableStartY + tableTotalH + 25;

  // 2x Retina scaling for ultra-crisp vector-like typography and lines
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(canvasW * scale);
  canvas.height = Math.round(canvasH * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  const themes = {
    "clean-white": {
      headerBg: "#f8fafc",
      headerText: "#000000",
      tableHeaderBg: "#f8fafc",
      tableHeaderText: "#000000",
      bg: "#ffffff",
      text: "#000000",
      border: "#000000",
      bannerBg: "#0f172a",
      bannerText: "#ffffff",
    },
    "modern-slate": {
      headerBg: "#0f172a",
      headerText: "#ffffff",
      tableHeaderBg: "#f1f5f9",
      tableHeaderText: "#0f172a",
      bg: "#ffffff",
      text: "#1e293b",
      border: "#cbd5e1",
      bannerBg: "#0f172a",
      bannerText: "#ffffff",
    },
    emerald: {
      headerBg: "#065f46",
      headerText: "#ffffff",
      tableHeaderBg: "#ecfdf5",
      tableHeaderText: "#064e3b",
      bg: "#ffffff",
      text: "#064e3b",
      border: "#059669",
      bannerBg: "#065f46",
      bannerText: "#ffffff",
    },
    dark: {
      headerBg: "#1e293b",
      headerText: "#38bdf8",
      tableHeaderBg: "#1e293b",
      tableHeaderText: "#38bdf8",
      bg: "#090d16",
      text: "#f8fafc",
      border: "#334155",
      bannerBg: "#1e293b",
      bannerText: "#38bdf8",
    },
  };

  const t = themes[theme] || themes["clean-white"];

  // Draw Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Optional top header banner (only if showHeader is enabled)
  if (showHeader) {
    ctx.fillStyle = t.bannerBg;
    ctx.fillRect(0, 0, canvasW, headerH);
    ctx.fillStyle = t.bannerText;
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`📊 Excel Spreadsheet: ${fileName}`, 30, headerH / 2);
  }

  // Multiline text drawing helper with word wrapping
  const drawMultiline = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: "left" | "center" | "right" = "left",
    maxLines: number = 32
  ) => {
    const rawLines = text.split(/\r?\n/);
    let curY = y;
    let linesDrawn = 0;

    for (const rawLine of rawLines) {
      if (linesDrawn >= maxLines) break;
      const trimmed = rawLine.trim();
      if (!trimmed) {
        curY += lineHeight * 0.75;
        linesDrawn++;
        continue;
      }

      if (ctx.measureText(trimmed).width <= maxWidth) {
        if (align === "center") {
          ctx.textAlign = "center";
          ctx.fillText(trimmed, x + maxWidth / 2, curY);
        } else if (align === "right") {
          ctx.textAlign = "right";
          ctx.fillText(trimmed, x + maxWidth, curY);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(trimmed, x, curY);
        }
        curY += lineHeight;
        linesDrawn++;
      } else {
        const words = trimmed.split(/\s+/);
        let currentLine = "";
        for (const w of words) {
          const testLine = currentLine ? `${currentLine} ${w}` : w;
          if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            if (align === "center") {
              ctx.textAlign = "center";
              ctx.fillText(currentLine, x + maxWidth / 2, curY);
            } else if (align === "right") {
              ctx.textAlign = "right";
              ctx.fillText(currentLine, x + maxWidth, curY);
            } else {
              ctx.textAlign = "left";
              ctx.fillText(currentLine, x, curY);
            }
            curY += lineHeight;
            linesDrawn++;
            if (linesDrawn >= maxLines) break;
            currentLine = w;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine && linesDrawn < maxLines) {
          if (align === "center") {
            ctx.textAlign = "center";
            ctx.fillText(currentLine, x + maxWidth / 2, curY);
          } else if (align === "right") {
            ctx.textAlign = "right";
            ctx.fillText(currentLine, x + maxWidth, curY);
          } else {
            ctx.textAlign = "left";
            ctx.fillText(currentLine, x, curY);
          }
          curY += lineHeight;
          linesDrawn++;
        }
      }
    }
  };

  // Format cell values (e.g., GST rate 0.18 -> 18%)
  const formatCellValue = (val: string, colIdx: number): string => {
    const trimmed = val.trim();
    const colHeader = getColHeaderLabel(colIdx);
    if (colHeader.includes("rate") || colHeader.includes("gst") || colHeader.includes("%")) {
      if (trimmed === "0.18" || trimmed === ".18") return "18%";
      if (trimmed === "0.05" || trimmed === ".05") return "5%";
      if (trimmed === "0.12" || trimmed === ".12") return "12%";
      if (trimmed === "0.28" || trimmed === ".28") return "28%";
      if (trimmed === "0" || trimmed === "0.0") return "0%";
      const num = parseFloat(trimmed);
      if (!isNaN(num) && num > 0 && num < 1 && trimmed.length <= 4) {
        return `${Math.round(num * 100)}%`;
      }
    }
    return trimmed;
  };

  // 1. Draw Table Backgrounds and Borders
  for (let ri = startRow; ri <= endRow; ri++) {
    const rowOffset = ri - startRow;
    const y = tableStartY + rowYOffsets[rowOffset]!;
    const rh = rowPixelHeights[ri]!;
    const isHead = isHeaderRow(ri);

    for (let ci = 0; ci < totalCols; ci++) {
      const merge = findMerge(ri, ci);
      if (merge) {
        if (ri === merge.startRow && ci === merge.startCol) {
          const mLeft = tableStartX + colXOffsets[merge.startCol]!;
          const mRight = tableStartX + colXOffsets[merge.endCol]! + colPixelWidths[merge.endCol]!;
          const mW = mRight - mLeft;
          const mTop = tableStartY + rowYOffsets[merge.startRow - startRow]!;
          const mBottom = tableStartY + rowYOffsets[merge.endRow - startRow + 1]!;
          const mH = mBottom - mTop;

          ctx.fillStyle = isHead ? t.tableHeaderBg : t.bg;
          ctx.fillRect(mLeft, mTop, mW, mH);

          if (showGridLines) {
            ctx.strokeStyle = t.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(mLeft, mTop, mW, mH);
          }
        }
      } else {
        const x = tableStartX + colXOffsets[ci]!;
        const w = colPixelWidths[ci]!;

        ctx.fillStyle = isHead ? t.tableHeaderBg : t.bg;
        ctx.fillRect(x, y, w, rh);

        if (showGridLines) {
          ctx.strokeStyle = t.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, rh);
        }
      }
    }
  }

  // 2. Draw Cell Text & Typography
  for (let ri = startRow; ri <= endRow; ri++) {
    const rowOffset = ri - startRow;
    const y = tableStartY + rowYOffsets[rowOffset]!;
    const rh = rowPixelHeights[ri]!;
    const isHead = isHeaderRow(ri);
    const rowMap = grid.get(ri);

    for (let ci = 0; ci < totalCols; ci++) {
      const merge = findMerge(ri, ci);
      if (merge && (ri !== merge.startRow || ci !== merge.startCol)) {
        // Covered by merge, already handled by anchor cell
        continue;
      }

      let textToRender = "";
      if (merge) {
        textToRender = getMergedCellText(merge);
      } else if (rowMap) {
        textToRender = rowMap.get(ci) || "";
      }

      if (!textToRender.trim()) continue;

      const cellX = tableStartX + colXOffsets[ci]!;
      let cellW = colPixelWidths[ci]!;
      let cellTop = y;
      let cellH = rh;

      if (merge) {
        const mRight = tableStartX + colXOffsets[merge.endCol]! + colPixelWidths[merge.endCol]!;
        cellW = mRight - cellX;
        const mTop = tableStartY + rowYOffsets[merge.startRow - startRow]!;
        const mBottom = tableStartY + rowYOffsets[merge.endRow - startRow + 1]!;
        cellTop = mTop;
        cellH = mBottom - mTop;
      }

      ctx.save();
      // Clip to cell interior with 2px padding
      ctx.beginPath();
      ctx.rect(cellX + 1, cellTop + 1, cellW - 2, cellH - 2);
      ctx.clip();

      const formatted = formatCellValue(textToRender, ci);
      const isTaxInvoiceTitle = /tax\s*invoice/i.test(formatted);
      const isTotalLabel = /^(gross\s+total|total|igst|round\s+off|amount\s+in\s+words)/i.test(formatted);
      const isNumberLike = /^-?[\d,]+(\.\d+)?%?$/.test(formatted) || /^(₹|\$|rs\.?)/i.test(formatted);
      const hasMultipleLines = formatted.includes("\n");

      if (isTaxInvoiceTitle) {
        // Centered bold document title
        ctx.font = "bold 22px 'Calibri', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = t.text;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatted, cellX + cellW / 2, cellTop + cellH / 2);
      } else if (isHead) {
        // Table column headers
        ctx.font = "bold 12px 'Calibri', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = t.tableHeaderText;
        ctx.textBaseline = "top";
        drawMultiline(formatted, cellX + 4, cellTop + 8, cellW - 8, 14, "center");
      } else if (hasMultipleLines) {
        // Multiline seller info, address, or details block
        ctx.font = "11.5px 'Calibri', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = t.text;
        ctx.textBaseline = "top";
        drawMultiline(formatted, cellX + 10, cellTop + 8, cellW - 20, 16, "left");
      } else if (isTotalLabel) {
        // Summary row labels
        ctx.font = "bold 12px 'Calibri', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = t.text;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(formatted, cellX + 8, cellTop + cellH / 2);
      } else {
        // Regular cell
        const colHeader = getColHeaderLabel(ci);
        const isDescription = colHeader.includes("description") || colHeader.includes("goods");
        const isCenterAlign = (cellW < 85 && formatted.length <= 8) || (ci === 0 && formatted.length <= 4) || colHeader.includes("box") || colHeader.includes("upc") || colHeader.includes("hsn");
        const isRightAlign = isNumberLike && !isCenterAlign;

        ctx.font = "12px 'Calibri', 'Segoe UI', Arial, sans-serif";
        ctx.fillStyle = t.text;

        if (isDescription) {
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.fillText(formatted, cellX + 8, cellTop + cellH / 2);
        } else if (isRightAlign) {
          ctx.textBaseline = "middle";
          ctx.textAlign = "right";
          ctx.fillText(formatted, cellX + cellW - 8, cellTop + cellH / 2);
        } else if (isCenterAlign) {
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText(formatted, cellX + cellW / 2, cellTop + cellH / 2);
        } else {
          ctx.textBaseline = "middle";
          ctx.textAlign = "left";
          ctx.fillText(formatted, cellX + 8, cellTop + cellH / 2);
        }
      }

      ctx.restore();
    }
  }

  // Outer border around the whole table for a clean, professional finish
  if (showGridLines) {
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableStartX, tableStartY, tableWidth, tableTotalH);
  }

  const mime = format === "JPG" ? "image/jpeg" : "image/png";
  return {
    dataUrl: canvas.toDataURL(mime, 0.98),
    width: canvas.width,
    height: canvas.height,
  };
};

export const renderAllExcelSheetsToZip = async (
  buffer: ArrayBuffer,
  fileName: string,
  sheets: { name: string; target: string }[],
  theme: "modern-slate" | "clean-white" | "emerald" | "dark",
  showGridLines: boolean,
  format: "PNG" | "JPG",
  showHeader: boolean,
  onProgress?: (curr: number, total: number) => void
): Promise<{ zipBlob: Blob; firstPageDataUrl: string; width: number; height: number }> => {
  const ext = format === "JPG" ? "jpg" : "png";
  const baseName = fileName ? fileName.replace(/\.[^.]+$/, "") : "spreadsheet";
  const zipEntries: { name: string; data: Uint8Array }[] = [];
  let firstDataUrl = "";
  let firstW = 0;
  let firstH = 0;

  for (let i = 0; i < sheets.length; i++) {
    onProgress?.(i + 1, sheets.length);
    const sheet = sheets[i]!;
    const res = await renderExcelSheetToImage(
      buffer,
      `${fileName} - ${sheet.name}`,
      theme,
      showGridLines,
      format,
      showHeader,
      sheet.target
    );
    if (i === 0) {
      firstDataUrl = res.dataUrl;
      firstW = res.width;
      firstH = res.height;
    }
    const base64 = res.dataUrl.split(",")[1] || "";
    const bin = atob(base64);
    const uint8 = new Uint8Array(bin.length);
    for (let b = 0; b < bin.length; b++) uint8[b] = bin.charCodeAt(b);
    const cleanSheetName = sheet.name.replace(/[/\\?%*:|"<>]/g, "_");
    zipEntries.push({
      name: `${baseName}_${i + 1}_${cleanSheetName}.${ext}`,
      data: uint8,
    });
  }

  const zipUint8 = buildZip(zipEntries);
  const zipBlob = new Blob([zipUint8 as BlobPart], { type: "application/zip" });
  return { zipBlob, firstPageDataUrl: firstDataUrl, width: firstW, height: firstH };
};

// Multi-Image Batch Rotation Engine
export interface RotateBatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  processedDataUrl?: string | undefined;
  processedBlob?: Blob | undefined;
  processedSize?: number | undefined;
  processedWidth?: number | undefined;
  processedHeight?: number | undefined;
}

export const renderRotatedImageToBlob = async (
  item: RotateBatchItem,
  bgMode: "transparent" | "color" | "blur" | "gradient",
  bgColor: string,
  bgGradient: string,
  outputFormat: "PNG" | "JPG" | "WEBP"
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const rad = (item.rotation * Math.PI) / 180;
      const is90or270 = Math.abs(item.rotation % 180) === 90;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const canvasW = is90or270 ? h : Math.max(1, Math.round(w * cos + h * sin));
      const canvasH = is90or270 ? w : Math.max(1, Math.round(w * sin + h * cos));

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get 2d context for canvas"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // 1. Background Fill Pass
      if (bgMode === "color") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === "gradient") {
        const gradObj = ROTATE_GRADIENT_PRESETS.find((g) => g.css === bgGradient) || ROTATE_GRADIENT_PRESETS[0];
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        grad.addColorStop(0, gradObj!.stops[0]!);
        grad.addColorStop(1, gradObj!.stops[1]!);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else if (bgMode === "blur") {
        ctx.save();
        ctx.filter = "blur(28px)";
        const scale = Math.max(canvasW / w, canvasH / h) * 1.25;
        const bgW = w * scale;
        const bgH = h * scale;
        ctx.drawImage(img, (canvasW - bgW) / 2, (canvasH - bgH) / 2, bgW, bgH);
        ctx.restore();
      } else if (bgMode === "transparent" && outputFormat === "JPG") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasW, canvasH);
      }

      // 2. Transformed Draw Pass
      ctx.save();
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate(rad);
      ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      const mimeType = outputFormat === "JPG" ? "image/jpeg" : outputFormat === "WEBP" ? "image/webp" : "image/png";
      const quality = outputFormat === "PNG" ? undefined : 0.92;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ dataUrl, blob, width: canvasW, height: canvasH });
          } else {
            const parts = dataUrl.split(",");
            const binary = atob(parts[1] || "");
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
            const fallbackBlob = new Blob([array], { type: mimeType });
            resolve({ dataUrl, blob: fallbackBlob, width: canvasW, height: canvasH });
          }
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for rotation"));
    img.src = item.dataUrl;
  });
};


