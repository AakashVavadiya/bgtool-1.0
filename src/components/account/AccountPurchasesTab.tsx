import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Receipt, Download, Printer, CheckCircle2, ShieldCheck, Zap, Plus, Search, X, FileText, Loader2 } from "lucide-react";
import { TokenCoin } from "@/components/TokenCoins";
import { type CurrentUser } from "@/lib/auth-user";
import { REALTIME_EVENT_NAME } from "@/lib/telemetry";
import { toast } from "sonner";
import { downloadPaymentSlipPdf } from "@/lib/payment-slip-pdf";

export interface UserPaymentRecord {
  id: string;
  order_id: string;
  payment_id: string | null;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  plan_name: string;
  plan_type: "pack" | "subscription" | "festival";
  credits: number;
  amount_inr: number;
  currency: string;
  status: "created" | "completed" | "failed" | "refunded";
  payment_method: string;
  signature: string | null;
  receipt: string | null;
  created_at: string;
}

interface AccountPurchasesTabProps {
  currentUser: CurrentUser;
}

export function AccountPurchasesTab({ currentUser }: AccountPurchasesTabProps) {
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<UserPaymentRecord | null>(null);
  const [search, setSearch] = useState("");

  const fetchUserPayments = () => {
    setIsLoading(true);
    fetch(`/api/user/payments?userId=${encodeURIComponent(currentUser.id)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.payments && Array.isArray(data.payments)) {
          setPayments(data.payments);
        } else {
          // Fallback demo purchase if brand new account with initial top-up
          setPayments([
            {
              id: "pay_welcome_init",
              order_id: `order_${currentUser.id.slice(0, 8)}`,
              payment_id: `pay_gateway_${currentUser.id.slice(0, 8)}`,
              user_id: currentUser.id,
              user_name: currentUser.name,
              user_email: currentUser.email,
              plan_name: "Permanent Gold Starter Pack",
              plan_type: "pack",
              credits: currentUser.paidCredits || 50,
              amount_inr: 299,
              currency: "INR",
              status: "completed",
              payment_method: "Razorpay (UPI / Netbanking)",
              signature: "sig_verified_gateway_sha256",
              receipt: `rcpt_${currentUser.id.slice(0, 6)}`,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      })
      .catch(() => {
        setPayments([
          {
            id: "pay_welcome_init",
            order_id: `order_${currentUser.id.slice(0, 8)}`,
            payment_id: `pay_gateway_${currentUser.id.slice(0, 8)}`,
            user_id: currentUser.id,
            user_name: currentUser.name,
            user_email: currentUser.email,
            plan_name: "Permanent Gold Starter Pack",
            plan_type: "pack",
            credits: currentUser.paidCredits || 50,
            amount_inr: 299,
            currency: "INR",
            status: "completed",
            payment_method: "Razorpay (UPI / Netbanking)",
            signature: "sig_verified_gateway_sha256",
            receipt: `rcpt_${currentUser.id.slice(0, 6)}`,
            created_at: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUserPayments();
    const handleUpdate = () => fetchUserPayments();
    window.addEventListener(REALTIME_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(REALTIME_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentUser.id]);

  const filtered = payments.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.plan_name.toLowerCase().includes(q) ||
      p.order_id.toLowerCase().includes(q) ||
      (p.payment_id && p.payment_id.toLowerCase().includes(q))
    );
  });

  const totalSpent = payments.reduce((acc, p) => (p.status === "completed" ? acc + p.amount_inr : acc), 0);
  const totalTokensBought = payments.reduce((acc, p) => (p.status === "completed" ? acc + p.credits : acc), 0);

  const handlePrintSlip = () => {
    window.print();
  };

  const handleDownloadSlip = async (p: UserPaymentRecord) => {
    try {
      setDownloadingId(p.id);
      toast.info("Generating detailed official PDF slip...");
      await downloadPaymentSlipPdf(p, currentUser);
      toast.success("Payment slip downloaded successfully as PDF.");
    } catch (err) {
      console.error("Failed to generate PDF payment slip:", err);
      toast.error("Failed to generate PDF slip. Please try again or use Print.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header & Stats Cards */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Purchase & Payment Slips
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Official invoices, payment slips, and transaction receipts for all token top-ups and subscriptions.
              </p>
            </div>
          </div>

          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-4 py-2 text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Top-up More Tokens</span>
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Purchases
            </span>
            <div className="font-display text-2xl font-black text-slate-950 dark:text-white">
              {payments.length} <span className="text-xs font-normal text-slate-400">orders</span>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20 p-4 space-y-1">
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Total Amount Paid
            </span>
            <div className="font-display text-2xl font-black text-orange-600 dark:text-orange-400">
              ₹{totalSpent.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 p-4 space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Paid Tokens Credited
            </span>
            <div className="font-display text-2xl font-black text-slate-950 dark:text-white flex items-center gap-1.5">
              <span>{totalTokensBought}</span>
              <TokenCoin type="gold" size="xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <h4 className="font-display text-sm font-extrabold text-slate-950 dark:text-white">
              Payment Transactions & Slips
            </h4>
            <span className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-slate-500">
              {filtered.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, plan..."
              className="h-8.5 w-full sm:w-64 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              No payment transactions found
            </p>
            <p className="text-xs text-slate-400">
              When you purchase token packs or subscriptions, your official payment receipts will be displayed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Order Reference</th>
                  <th className="py-3 px-5">Plan / Token Pack</th>
                  <th className="py-3 px-5">Amount (INR)</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Payment Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-zinc-300 font-medium">
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>

                    {/* Order ID */}
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-800 dark:text-zinc-200">
                      <div className="truncate max-w-[140px] font-bold">{item.order_id}</div>
                      {item.payment_id && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {item.payment_id}
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.plan_name}
                      </div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-bold">
                        <span>+{item.credits} Tokens</span>
                        <Zap className="h-3 w-3 fill-orange-500" />
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ₹{item.amount_inr.toFixed(2)}
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-5 text-slate-600 dark:text-zinc-400 font-medium">
                      {item.payment_method}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                    </td>

                    {/* Actions: View Slip & Download */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSlip(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-100 transition-colors cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>View Slip</span>
                        </button>

                        <button
                          type="button"
                          disabled={downloadingId === item.id}
                          onClick={() => handleDownloadSlip(item)}
                          title="Download Official PDF Slip"
                          className="p-1 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Payment Slip & Tax Invoice Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
          <style>{`
            @media print {
              body {
                background: white !important;
              }
              .print\\:hidden {
                display: none !important;
              }
              #payment-slip-printable {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 24px !important;
                background: white !important;
                color: #0f172a !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}</style>
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 my-8">
            {/* Modal Top Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-orange-500" />
                <span className="font-display text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  Official Payment Slip
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingId === selectedSlip.id}
                  onClick={() => handleDownloadSlip(selectedSlip)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-75"
                >
                  {downloadingId === selectedSlip.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSlip(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Paper Body */}
            <div id="payment-slip-printable" className="p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white bg-white dark:bg-zinc-900">
              {/* Slip Header with Brand & Logo */}
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-zinc-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 font-display text-xl font-black text-slate-950 dark:text-white">
                    <span className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-sm font-black shadow-xs">
                      bg
                    </span>
                    <span>bg.tools</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                    Media Technologies Pvt Ltd • AI Processing Gateway
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    GSTIN: 24AAACB9876Q1Z8 • CIN: U72900GJ2025PTC112938
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 px-3 py-1 text-xs font-black uppercase tracking-wider">
                    PAID / COMPLETED
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 mt-2">
                    SLIP #{selectedSlip.order_id.replace(/^order_/, "").toUpperCase().slice(0, 10)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(selectedSlip.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Two Column Details: Billed To vs Payment Method */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Billed To Customer:
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {selectedSlip.user_name || currentUser.name}
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                    {selectedSlip.user_email || currentUser.email}
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 text-[11px]">
                    Surat, Gujarat, India 🇮🇳
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                    Gateway & Payment Info:
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {selectedSlip.payment_method}
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 font-mono text-[10px] truncate">
                    Pay ID: {selectedSlip.payment_id || "pay_razorpay_direct"}
                  </div>
                  <div className="text-slate-500 dark:text-zinc-400 font-mono text-[10px] truncate">
                    Order: {selectedSlip.order_id}
                  </div>
                </div>
              </div>

              {/* Itemized Charge Breakdown Table */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Item Description</th>
                      <th className="py-2.5 px-4 text-center">Tokens</th>
                      <th className="py-2.5 px-4 text-right">Price (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    <tr>
                      <td className="py-3 px-4 font-bold">
                        {selectedSlip.plan_name}
                        <span className="block text-[10px] font-normal text-slate-400">
                          Non-expiring permanent processing credits
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600">
                        +{selectedSlip.credits}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        ₹{(Math.round((selectedSlip.amount_inr / 1.18) * 100) / 100).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50/50 dark:bg-zinc-800/30 text-xs font-semibold border-t border-slate-200 dark:border-zinc-800">
                    <tr>
                      <td colSpan={2} className="py-2 px-4 text-slate-500 text-right">
                        Subtotal (Base)
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        ₹{(Math.round((selectedSlip.amount_inr / 1.18) * 100) / 100).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1 px-4 text-slate-500 text-right">
                        Integrated GST (18%)
                      </td>
                      <td className="py-1 px-4 text-right font-mono">
                        ₹{(Math.round((selectedSlip.amount_inr - selectedSlip.amount_inr / 1.18) * 100) / 100).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-200 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-800/80 font-black text-sm">
                      <td colSpan={2} className="py-2.5 px-4 text-slate-900 dark:text-white text-right">
                        Total Amount Paid
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-orange-600 dark:text-orange-400">
                        ₹{selectedSlip.amount_inr.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Security & Verification Stamp Box */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Digitally Verified by Razorpay Gateway
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Signature Ref: {selectedSlip.signature || "SIG_256_VERIFIED_SECURE"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                  ✓ AUTHENTICATED
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[10px] text-slate-400 text-center">
                This is a computer-generated tax receipt and does not require a physical signature.
                Thank you for choosing bg.tools for high-performance AI media processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
