import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { type UserPaymentRecord } from "@/components/account/AccountPurchasesTab";
import { type CurrentUser } from "@/lib/auth-user";

/**
 * Converts numbers to words in standard Indian Rupees nomenclature.
 */
function numberToWords(num: number): string {
  const rounded = Math.floor(num);
  if (rounded === 0) return "Zero Rupees";

  const units = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return units[n] || "";
    const unitPart = n % 10;
    const tenPart = tens[Math.floor(n / 10)] || "";
    return unitPart ? `${tenPart}-${units[unitPart] || ""}` : tenPart;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = "";
    if (hundred > 0) {
      str += `${units[hundred] || ""} Hundred`;
      if (rest > 0) str += " ";
    }
    if (rest > 0) {
      str += convertTwoDigits(rest);
    }
    return str;
  }

  const crores = Math.floor(rounded / 10000000);
  const lakhs = Math.floor((rounded % 10000000) / 100000);
  const thousands = Math.floor((rounded % 100000) / 1000);
  const hundreds = rounded % 1000;

  const parts: string[] = [];

  if (crores > 0) {
    parts.push(`${convertTwoDigits(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} Thousand`);
  }
  if (hundreds > 0) {
    parts.push(convertThreeDigits(hundreds));
  }

  const words = parts.join(" ").trim();
  return words ? `${words} Rupees` : "Zero Rupees";
}

/**
 * Clean text to ensure safe WinAnsi encoding for standard PDF fonts.
 */
function cleanText(text: string | null | undefined, fallback: string = ""): string {
  if (!text) return fallback;
  return text
    .replace(/₹/g, "INR ")
    .replace(/•/g, "|")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || fallback;
}

/**
 * Generate a high-resolution, detailed, official vector PDF payment slip & tax invoice.
 */
export async function generatePaymentSlipPdf(
  payment: UserPaymentRecord,
  currentUser: CurrentUser
): Promise<{ blob: Blob; filename: string }> {
  const doc = await PDFDocument.create();

  // Document metadata
  const slipCode = payment.order_id.replace(/^order_/, "").toUpperCase().slice(0, 10);
  const slipNumber = `SLIP-${payment.order_id.replace(/^order_/, "").toUpperCase()}`;
  doc.setTitle(`Official Payment Slip & Tax Invoice - ${slipNumber}`);
  doc.setAuthor("bg.tools Media Technologies Pvt Ltd");
  doc.setSubject(`Official Tax Invoice / Payment Slip for ${payment.plan_name}`);
  doc.setProducer("bg.tools PDF Billing Engine v2.0");
  doc.setCreationDate(new Date());

  // A4 Page Setup (595.28 x 841.89 points)
  const page = doc.addPage([595.28, 841.89]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2; // 515.28 pt

  // Calculations
  const basePrice = Math.round((payment.amount_inr / 1.18) * 100) / 100;
  const taxAmount = Math.round((payment.amount_inr - basePrice) * 100) / 100;
  const amountWords = `${numberToWords(payment.amount_inr)} Only`;
  const paymentDate = new Date(payment.created_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const customerName = cleanText(payment.user_name || currentUser.name, "Customer");
  const customerEmail = cleanText(payment.user_email || currentUser.email, "customer@bg.tools");
  const customerId = cleanText(currentUser.id, "USR-001");
  const gatewayMethod = cleanText(payment.payment_method, "Razorpay Online PG");
  const paymentId = cleanText(payment.payment_id, "pay_razorpay_direct");
  const orderId = cleanText(payment.order_id, "order_bg_tools");
  const signatureHash = cleanText(payment.signature, "1a5f3147adf7f91ee5665ba460495dd1cc31a1cd3607dfad6b3a20dd0d07aafd");

  // 1. Top Orange Header Accent Strip
  page.drawRectangle({
    x: 0,
    y: height - 6,
    width,
    height: 6,
    color: rgb(0.976, 0.451, 0.086), // bg orange
  });

  // 2. Company Brand & Slip Header
  // Brand Badge
  const badgeY = height - 65;
  page.drawRectangle({
    x: margin,
    y: badgeY,
    width: 32,
    height: 32,
    color: rgb(0.976, 0.451, 0.086),
  });
  page.drawText("bg", {
    x: margin + 7,
    y: badgeY + 9,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Brand Name
  page.drawText("bg.tools", {
    x: margin + 42,
    y: badgeY + 13,
    size: 20,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  // Company Sub-title & GSTIN
  page.drawText("Media Technologies Pvt Ltd  |  AI Processing Gateway", {
    x: margin + 42,
    y: badgeY + 1,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.35, 0.40, 0.48),
  });

  page.drawText("GSTIN: 24AAACB9876Q1Z8   CIN: U72900GJ2025PTC112938   Place of Supply: Gujarat (24)", {
    x: margin + 42,
    y: badgeY - 11,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.50, 0.55, 0.62),
  });

  // Right Header: Status Badge & Slip Info
  const statusBadgeWidth = 120;
  const statusBadgeX = width - margin - statusBadgeWidth;
  page.drawRectangle({
    x: statusBadgeX,
    y: badgeY + 10,
    width: statusBadgeWidth,
    height: 22,
    color: rgb(0.925, 0.984, 0.941),
    borderColor: rgb(0.133, 0.773, 0.369),
    borderWidth: 1,
  });
  page.drawText("PAID / COMPLETED", {
    x: statusBadgeX + 13,
    y: badgeY + 17,
    size: 8.5,
    font: fontBold,
    color: rgb(0.02, 0.55, 0.32),
  });

  const slipLabel = `SLIP #${slipCode}`;
  const slipLabelWidth = fontBold.widthOfTextAtSize(slipLabel, 10);
  page.drawText(slipLabel, {
    x: width - margin - slipLabelWidth,
    y: badgeY - 2,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.20, 0.28),
  });

  const dateLabel = paymentDate;
  const dateLabelWidth = fontRegular.widthOfTextAtSize(dateLabel, 8);
  page.drawText(dateLabel, {
    x: width - margin - dateLabelWidth,
    y: badgeY - 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.45, 0.50, 0.58),
  });

  // 3. Document Title Bar
  const titleBarY = height - 95;
  page.drawRectangle({
    x: margin,
    y: titleBarY - 18,
    width: contentWidth,
    height: 24,
    color: rgb(0.965, 0.973, 0.984),
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  });

  page.drawText("OFFICIAL PAYMENT SLIP & TAX INVOICE", {
    x: margin + 12,
    y: titleBarY - 10,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.20, 0.30),
  });

  page.drawText("TAX INVOICE UNDER SECTION 31 OF CGST ACT, 2017", {
    x: width - margin - 235,
    y: titleBarY - 10,
    size: 7.5,
    font: fontBold,
    color: rgb(0.40, 0.45, 0.55),
  });

  // 4. Two Info Cards: Billed to Customer vs Payment Gateway
  const cardsY = titleBarY - 118;
  const cardWidth = (contentWidth - 14) / 2;
  const cardHeight = 88;

  // Left Card: Billed to
  page.drawRectangle({
    x: margin,
    y: cardsY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(0.99, 0.995, 1.0),
    borderColor: rgb(0.88, 0.90, 0.94),
    borderWidth: 1,
  });

  page.drawText("BILLED TO CUSTOMER:", {
    x: margin + 12,
    y: cardsY + cardHeight - 16,
    size: 8,
    font: fontBold,
    color: rgb(0.50, 0.55, 0.62),
  });

  page.drawText(customerName, {
    x: margin + 12,
    y: cardsY + cardHeight - 32,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText(customerEmail, {
    x: margin + 12,
    y: cardsY + cardHeight - 46,
    size: 9,
    font: fontRegular,
    color: rgb(0.30, 0.35, 0.42),
  });

  page.drawText("Surat, Gujarat, India (State Code: 24)", {
    x: margin + 12,
    y: cardsY + cardHeight - 60,
    size: 8,
    font: fontRegular,
    color: rgb(0.40, 0.45, 0.52),
  });

  page.drawText(`Customer Account ID: ${customerId.slice(0, 22)}`, {
    x: margin + 12,
    y: cardsY + cardHeight - 73,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.55, 0.60, 0.68),
  });

  // Right Card: Payment & Gateway
  const rightCardX = margin + cardWidth + 14;
  page.drawRectangle({
    x: rightCardX,
    y: cardsY,
    width: cardWidth,
    height: cardHeight,
    color: rgb(0.99, 0.995, 1.0),
    borderColor: rgb(0.88, 0.90, 0.94),
    borderWidth: 1,
  });

  page.drawText("GATEWAY & PAYMENT INFO:", {
    x: rightCardX + 12,
    y: cardsY + cardHeight - 16,
    size: 8,
    font: fontBold,
    color: rgb(0.50, 0.55, 0.62),
  });

  page.drawText(gatewayMethod, {
    x: rightCardX + 12,
    y: cardsY + cardHeight - 32,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText(`Pay ID: ${paymentId}`, {
    x: rightCardX + 12,
    y: cardsY + cardHeight - 46,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.30, 0.35, 0.42),
  });

  page.drawText(`Order: ${orderId}`, {
    x: rightCardX + 12,
    y: cardsY + cardHeight - 60,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.30, 0.35, 0.42),
  });

  page.drawText("Verification: Authenticated & Captured Instant", {
    x: rightCardX + 12,
    y: cardsY + cardHeight - 73,
    size: 7.5,
    font: fontBold,
    color: rgb(0.05, 0.60, 0.35),
  });

  // 5. Itemized Table
  const tableHeaderY = cardsY - 30;
  const tableHeaderHeight = 22;

  // Header row fill
  page.drawRectangle({
    x: margin,
    y: tableHeaderY,
    width: contentWidth,
    height: tableHeaderHeight,
    color: rgb(0.945, 0.955, 0.97),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  // Header column texts
  page.drawText("ITEM DESCRIPTION", {
    x: margin + 12,
    y: tableHeaderY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.30, 0.35, 0.45),
  });

  page.drawText("SAC", {
    x: margin + 250,
    y: tableHeaderY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.30, 0.35, 0.45),
  });

  page.drawText("TOKENS", {
    x: margin + 305,
    y: tableHeaderY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.30, 0.35, 0.45),
  });

  page.drawText("TAXABLE (INR)", {
    x: margin + 375,
    y: tableHeaderY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.30, 0.35, 0.45),
  });

  page.drawText("TOTAL (INR)", {
    x: width - margin - 65,
    y: tableHeaderY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.30, 0.35, 0.45),
  });

  // Item Row
  const itemRowHeight = 44;
  const itemRowY = tableHeaderY - itemRowHeight;

  page.drawRectangle({
    x: margin,
    y: itemRowY,
    width: contentWidth,
    height: itemRowHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.90, 0.94),
    borderWidth: 1,
  });

  const planName = cleanText(payment.plan_name, "Gold Tokens Pack");
  page.drawText(planName, {
    x: margin + 12,
    y: itemRowY + 25,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  page.drawText("Non-expiring permanent AI processing credits", {
    x: margin + 12,
    y: itemRowY + 12,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.50, 0.55, 0.62),
  });

  page.drawText("998314", {
    x: margin + 250,
    y: itemRowY + 20,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.35, 0.40, 0.48),
  });

  page.drawText(`+${payment.credits}`, {
    x: margin + 312,
    y: itemRowY + 20,
    size: 9.5,
    font: fontBold,
    color: rgb(0.976, 0.451, 0.086),
  });

  const basePriceText = basePrice.toFixed(2);
  const basePriceWidth = fontRegular.widthOfTextAtSize(basePriceText, 9);
  page.drawText(basePriceText, {
    x: margin + 435 - basePriceWidth,
    y: itemRowY + 20,
    size: 9,
    font: fontRegular,
    color: rgb(0.15, 0.20, 0.28),
  });

  const totalItemText = payment.amount_inr.toFixed(2);
  const totalItemWidth = fontBold.widthOfTextAtSize(totalItemText, 9.5);
  page.drawText(totalItemText, {
    x: width - margin - 12 - totalItemWidth,
    y: itemRowY + 20,
    size: 9.5,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });

  // 6. Subtotal & GST Calculation Box
  const summaryBoxWidth = 260;
  const summaryBoxX = width - margin - summaryBoxWidth;
  const summaryBoxY = itemRowY - 82;
  const summaryBoxHeight = 82;

  page.drawRectangle({
    x: summaryBoxX,
    y: summaryBoxY,
    width: summaryBoxWidth,
    height: summaryBoxHeight,
    color: rgb(0.99, 0.995, 1.0),
    borderColor: rgb(0.88, 0.90, 0.94),
    borderWidth: 1,
  });

  // Subtotal line
  page.drawText("Subtotal (Base Amount):", {
    x: summaryBoxX + 14,
    y: summaryBoxY + summaryBoxHeight - 20,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.40, 0.45, 0.52),
  });
  const subtotalStr = `INR ${basePrice.toFixed(2)}`;
  const subtotalStrWidth = fontRegular.widthOfTextAtSize(subtotalStr, 8.5);
  page.drawText(subtotalStr, {
    x: summaryBoxX + summaryBoxWidth - 14 - subtotalStrWidth,
    y: summaryBoxY + summaryBoxHeight - 20,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.15, 0.20, 0.28),
  });

  // GST line
  page.drawText("Integrated GST (IGST 18%):", {
    x: summaryBoxX + 14,
    y: summaryBoxY + summaryBoxHeight - 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.40, 0.45, 0.52),
  });
  const taxStr = `INR ${taxAmount.toFixed(2)}`;
  const taxStrWidth = fontRegular.widthOfTextAtSize(taxStr, 8.5);
  page.drawText(taxStr, {
    x: summaryBoxX + summaryBoxWidth - 14 - taxStrWidth,
    y: summaryBoxY + summaryBoxHeight - 36,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.15, 0.20, 0.28),
  });

  // Total Highlight Bar inside Summary
  page.drawRectangle({
    x: summaryBoxX + 1,
    y: summaryBoxY + 1,
    width: summaryBoxWidth - 2,
    height: 32,
    color: rgb(0.99, 0.95, 0.92),
  });

  page.drawText("Total Amount Paid:", {
    x: summaryBoxX + 14,
    y: summaryBoxY + 12,
    size: 9.5,
    font: fontBold,
    color: rgb(0.10, 0.15, 0.22),
  });

  const finalPaidStr = `INR ${payment.amount_inr.toFixed(2)}`;
  const finalPaidStrWidth = fontBold.widthOfTextAtSize(finalPaidStr, 12);
  page.drawText(finalPaidStr, {
    x: summaryBoxX + summaryBoxWidth - 14 - finalPaidStrWidth,
    y: summaryBoxY + 11,
    size: 12,
    font: fontBold,
    color: rgb(0.976, 0.451, 0.086),
  });

  // 7. Amount in Words Strip
  const wordsBarY = summaryBoxY - 26;
  page.drawRectangle({
    x: margin,
    y: wordsBarY,
    width: contentWidth,
    height: 20,
    color: rgb(0.965, 0.975, 0.985),
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  });

  page.drawText(`Amount in Words: INR ${amountWords}`, {
    x: margin + 12,
    y: wordsBarY + 6,
    size: 8,
    font: fontBold,
    color: rgb(0.20, 0.25, 0.35),
  });

  // 8. Digital Security & Verification Box
  const securityBoxY = wordsBarY - 65;
  const securityBoxHeight = 52;
  page.drawRectangle({
    x: margin,
    y: securityBoxY,
    width: contentWidth,
    height: securityBoxHeight,
    color: rgb(0.935, 0.985, 0.95),
    borderColor: rgb(0.55, 0.85, 0.65),
    borderWidth: 1,
  });

  page.drawText("[AUTHENTICATED] Digitally Verified by Razorpay Secure Gateway", {
    x: margin + 14,
    y: securityBoxY + securityBoxHeight - 16,
    size: 9,
    font: fontBold,
    color: rgb(0.02, 0.55, 0.30),
  });

  page.drawText(`Signature Ref: ${signatureHash}`, {
    x: margin + 14,
    y: securityBoxY + securityBoxHeight - 30,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.35, 0.45, 0.40),
  });

  page.drawText("Status: Settled & Verified  |  Tokens Credited to Account Immediately  |  Zero Storage Guarantee", {
    x: margin + 14,
    y: securityBoxY + securityBoxHeight - 42,
    size: 7,
    font: fontRegular,
    color: rgb(0.25, 0.50, 0.35),
  });

  page.drawText("VERIFIED RECEIPT", {
    x: width - margin - 110,
    y: securityBoxY + securityBoxHeight - 22,
    size: 8,
    font: fontBold,
    color: rgb(0.02, 0.55, 0.30),
  });

  // 9. Compliance & Legal Notice Box
  const noticeBoxY = securityBoxY - 76;
  const noticeBoxHeight = 64;
  page.drawRectangle({
    x: margin,
    y: noticeBoxY,
    width: contentWidth,
    height: noticeBoxHeight,
    color: rgb(0.985, 0.99, 0.995),
    borderColor: rgb(0.90, 0.92, 0.95),
    borderWidth: 1,
  });

  page.drawText("TERMS & COMPLIANCE DECLARATION:", {
    x: margin + 12,
    y: noticeBoxY + noticeBoxHeight - 14,
    size: 7.5,
    font: fontBold,
    color: rgb(0.40, 0.45, 0.55),
  });

  page.drawText("1. This is a computer-generated official tax receipt and does not require a physical signature.", {
    x: margin + 12,
    y: noticeBoxY + noticeBoxHeight - 26,
    size: 7.2,
    font: fontRegular,
    color: rgb(0.45, 0.50, 0.58),
  });

  page.drawText("2. Permanent Gold Tokens have been credited to your account and never expire.", {
    x: margin + 12,
    y: noticeBoxY + noticeBoxHeight - 37,
    size: 7.2,
    font: fontRegular,
    color: rgb(0.45, 0.50, 0.58),
  });

  page.drawText("3. Service is governed by bg.tools Terms of Service. Invoicing inquiries: support@bg.tools", {
    x: margin + 12,
    y: noticeBoxY + noticeBoxHeight - 48,
    size: 7.2,
    font: fontRegular,
    color: rgb(0.45, 0.50, 0.58),
  });

  // 10. Footer
  const footerY = 32;
  page.drawLine({
    start: { x: margin, y: footerY + 18 },
    end: { x: width - margin, y: footerY + 18 },
    thickness: 0.75,
    color: rgb(0.88, 0.90, 0.93),
  });

  page.drawText("bg.tools - High-Performance AI Media Processing  |  https://bg.tools  |  support@bg.tools", {
    x: margin,
    y: footerY + 6,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.50, 0.55, 0.62),
  });

  const pageLabel = "Page 1 of 1";
  const pageLabelWidth = fontRegular.widthOfTextAtSize(pageLabel, 7.5);
  page.drawText(pageLabel, {
    x: width - margin - pageLabelWidth,
    y: footerY + 6,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.50, 0.55, 0.62),
  });

  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const filename = `${slipNumber}_bg_tools_tax_invoice.pdf`;

  return { blob, filename };
}

/**
 * Triggers browser download of the generated PDF.
 */
export async function downloadPaymentSlipPdf(
  payment: UserPaymentRecord,
  currentUser: CurrentUser
): Promise<void> {
  const { blob, filename } = await generatePaymentSlipPdf(payment, currentUser);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
