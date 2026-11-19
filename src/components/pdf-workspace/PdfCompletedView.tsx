// Completed PDF output studio preview, download/print actions, and follow-up workflow cards.
import { ArrowRight, Download, Check, RefreshCw, Lock, Eye, Scissors, Maximize2, Copy, Split, Printer, ExternalLink, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PdfPreviewViewer } from "@/components/PdfPreviewViewer";

interface UploadedPdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  pageCount?: number | undefined;
  thumbnailUrl?: string | undefined;
  isLoadingThumb?: boolean | undefined;
}

// Helper: Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}


export function PdfCompletedView(props: any) {
  const {
    hasProcessed,
    setHasProcessed,
    setResultBlob,
    resultBuffer,
    setResultBuffer,
    resultFileName,
    resultSize,
    originalTotalSize,
    resultPageCount,
    copiedLink,
    setPreviewModalItem,
    isCompressTool,
    isPdfInvoiceToEInvoiceTool,
    resultXmlText,
    handleDownload,
    handlePrint,
    handleOpenInNewTab,
    copyShareLink
  } = props;

  return (
    <>
      {hasProcessed && (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in-50 slide-in-from-bottom-6 duration-300">
          {/* Main 2-Column Responsive Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Live Expansive Document Studio Previewer */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    High-Resolution Document Studio Preview
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span className="hidden sm:inline">Use zoom &amp; thumbnail strip below</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (resultBuffer) {
                        setPreviewModalItem({
                          buffer: resultBuffer,
                          name: resultFileName,
                          size: resultSize,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-accent font-bold hover:underline cursor-pointer"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Fullscreen</span>
                  </button>
                </div>
              </div>

              {resultBuffer ? (
                <PdfPreviewViewer
                  buffer={resultBuffer}
                  fileName={resultFileName}
                  fileSize={resultSize}
                  compact={false}
                  className="w-full shadow-xl"
                />
              ) : resultXmlText ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 p-6 shadow-2xl space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                      <span className="ml-2 font-mono text-xs font-bold text-emerald-400">
                        {resultFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resultXmlText);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy XML</span>
                    </button>
                  </div>
                  <pre className="max-h-[540px] overflow-auto font-mono text-xs leading-relaxed text-emerald-300/95 custom-scrollbar">
                    {resultXmlText}
                  </pre>
                </div>
              ) : null}
            </div>

            {/* Right 4 Columns: Command Panel & Smart Next Actions */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-4">
              {/* Card 1: Action Center & Document Details */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-lg space-y-4">
                <div className="flex items-start gap-3.5 pb-4 border-b border-border/80">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/15">
                    <Check className="h-6 w-6 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Process Complete
                      </span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-extrabold text-foreground truncate" title={resultFileName}>
                      {resultFileName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
                      <span>
                        {resultPageCount} {resultPageCount === 1 ? "Page" : "Pages"}
                      </span>
                      <span>•</span>
                      {isCompressTool && originalTotalSize > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatBytes(resultSize)}
                          {originalTotalSize > resultSize && (
                            <span className="ml-1 text-[10px] rounded bg-emerald-500/15 px-1 py-0.2">
                              -{Math.max(0, Math.round(((originalTotalSize - resultSize) / originalTotalSize) * 100))}%
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="font-bold text-foreground">{formatBytes(resultSize)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {/* Primary Download */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full flex items-center justify-between rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3.5 font-black text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="h-4 w-4" />
                      <span>{isPdfInvoiceToEInvoiceTool ? "Download E-Invoice XML" : "Download PDF"}</span>
                    </div>
                    <span className="font-mono text-xs opacity-90">{formatBytes(resultSize)}</span>
                  </button>

                  {/* Print Document */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span>Print Document</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {/* Open in New Tab */}
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span>Open in Browser Tab</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>

                  {/* Share Link */}
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="w-full flex items-center justify-between rounded-2xl border border-border bg-secondary/50 hover:bg-secondary px-5 py-3 text-xs font-bold text-foreground transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                      <span>{copiedLink ? "Link Copied to Clipboard!" : "Share Tool Link"}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                <div className="pt-2 border-t border-border">
                  {/* Process Another File */}
                  <button
                    type="button"
                    onClick={() => {
                      setHasProcessed(false);
                      setResultBlob(null);
                      setResultBuffer(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card hover:bg-secondary/80 py-3 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Process Another Document</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Next Workflow Steps */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold text-foreground">
                    Continue With This File
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Suggested
                  </span>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/tools/$slug"
                    params={{ slug: "compress-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Scissors className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Compress PDF
                        </div>
                        <div className="text-[10px] text-muted-foreground">Reduce size by up to 90%</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/tools/$slug"
                    params={{ slug: "protect-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Protect PDF
                        </div>
                        <div className="text-[10px] text-muted-foreground">Add password &amp; encryption</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    to="/tools/$slug"
                    params={{ slug: "split-pdf" }}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                        <Split className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
                          Split &amp; Extract
                        </div>
                        <div className="text-[10px] text-muted-foreground">Extract specific pages</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Privacy Seal */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 flex items-start gap-3.5 text-left">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-foreground">
                      Enterprise-Grade Security &amp; Privacy
                    </h4>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      Professional &amp; Trust-Focused
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your files and data are handled with security-focused safeguards. We prioritize your privacy and take measures to protect your information throughout the processing workflow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
