"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileMinus,
  Printer,
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  IndianRupee,
  Share2,
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BackButton } from "@/components/shared/BackButton";
import { useGetCreditNoteByIdQuery } from "@/lib/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { CreditNoteStatus } from "@/lib/types/credit-note";
import { ApplyCreditModal } from "@/components/credit-notes/ApplyCreditModal";
import { RefundCreditModal } from "@/components/credit-notes/RefundCreditModal";

function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const rounded = Math.round(num);
  return `Rupees ${inWords(rounded).trim()} Only`;
}

export default function ViewCreditNotePage() {
  const params = useParams();
  const cnId = (params?.cnId as string) || "";
  const { user } = useAuth();

  const {
    data: creditNote,
    isLoading,
    refetch,
  } = useGetCreditNoteByIdQuery(cnId, {
    skip: !cnId,
  });

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-sm text-muted-foreground">Loading credit note...</p>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h2 className="text-lg font-semibold">Credit Note not found</h2>
        <Button asChild variant="outline">
          <Link href="/credit-notes">Return to Credit Notes</Link>
        </Button>
      </div>
    );
  }

  const client =
    typeof creditNote.clientId === "object" ? creditNote.clientId : ({} as any);
  const invoice =
    typeof creditNote.invoiceId === "object"
      ? creditNote.invoiceId
      : ({} as any);
  const items = creditNote.items || [];
  const totals = creditNote.totals || ({} as any);

  const firmName =
    user?.workspace || user?.tenant || "Proactive Advisory & Associates";

  const getStatusBadge = (status: CreditNoteStatus) => {
    switch (status) {
      case "Issued":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-500/30 dark:text-purple-400">
            <Clock className="mr-1 h-3 w-3" /> Issued
          </Badge>
        );
      case "Applied":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Applied
          </Badge>
        );
      case "Refunded":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/30 dark:text-blue-400">
            <Banknote className="mr-1 h-3 w-3" /> Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Breadcrumbs */}
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: "Credit Notes", href: "/credit-notes" },
            { label: creditNote.creditNoteNo },
          ]}
        />
      </div>

      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <BackButton href="/credit-notes" label="Back to Credit Notes" />
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {creditNote.creditNoteNo}
            </h1>
            {getStatusBadge(creditNote.status)}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {creditNote.unallocatedCredit > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApplyModalOpen(true)}
                className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" /> Apply Credit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRefundModalOpen(true)}
                className="gap-1.5 text-xs text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <Banknote className="h-3.5 w-3.5" /> Record Refund
              </Button>
            </>
          )}

          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print Credit Note
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="credit-note-print-area"
        className="credit-note-sheet mx-auto max-w-4xl rounded-2xl border bg-card p-8 sm:p-12 shadow-sm text-foreground transition-colors print:border-none print:shadow-none print:p-0 print:max-w-none print:m-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 print:flex-row">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold text-xl">
                CN
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {firmName}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Chartered Accountants & Compliance Advisors
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Corporate Office: Mumbai / New Delhi • India
            </p>
          </div>

          <div className="sm:text-right">
            <div className="inline-block rounded-md bg-purple-500/10 px-3 py-1 text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Tax Credit Note
            </div>
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              <p>
                Credit Note No:{" "}
                <strong className="text-foreground font-mono">
                  {creditNote.creditNoteNo}
                </strong>
              </p>
              <p>
                Date:{" "}
                <strong className="text-foreground">
                  {new Date(creditNote.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Reference & Bill To */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b text-xs">
          {/* Bill To */}
          <div>
            <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] mb-1.5">
              Credited To:
            </p>
            <h3 className="text-sm font-bold text-foreground">
              {client.name}
            </h3>
            {client.entityType && (
              <p className="text-muted-foreground">{client.entityType}</p>
            )}
            {client.address && (
              <p className="text-muted-foreground mt-1">
                {client.address}
                {client.city ? `, ${client.city}` : ""}
                {client.state ? `, ${client.state}` : ""}
                {client.pincode ? ` - ${client.pincode}` : ""}
              </p>
            )}
            <div className="mt-2 space-y-0.5">
              {client.gstin && (
                <p>
                  <span className="text-muted-foreground">GSTIN: </span>
                  <span className="font-mono font-medium">{client.gstin}</span>
                </p>
              )}
              {client.pan && (
                <p>
                  <span className="text-muted-foreground">PAN: </span>
                  <span className="font-mono font-medium">{client.pan}</span>
                </p>
              )}
            </div>
          </div>

          {/* Original Invoice Reference & Reason */}
          <div className="sm:text-right space-y-2">
            <div>
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] mb-1">
                Original Invoice Reference:
              </p>
              <p className="text-sm font-bold font-mono text-foreground">
                {invoice.invoiceNo || "N/A"}
              </p>
              {invoice.date && (
                <p className="text-muted-foreground">
                  Invoice Date:{" "}
                  {new Date(invoice.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="pt-2">
              <p className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px] mb-1">
                Reason for Credit Adjustment:
              </p>
              <Badge variant="outline" className="text-xs font-medium">
                {creditNote.reason}
              </Badge>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-2.5 px-3 font-semibold text-muted-foreground w-10">
                  #
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground">
                  Service / Item Description
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground w-20">
                  SAC
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-center w-16">
                  Qty
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-24">
                  Rate (₹)
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-center w-16">
                  GST %
                </th>
                <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right w-28">
                  Total Credited (₹)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((it: any, index: number) => (
                <tr key={index}>
                  <td className="py-3 px-3 text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground">
                    {it.description}
                  </td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">
                    {it.sacCode || "998231"}
                  </td>
                  <td className="py-3 px-3 text-center">{it.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{it.rate?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">{it.gstPercentage}%</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    ₹{it.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t text-xs">
          <div>
            <p className="font-semibold text-muted-foreground uppercase text-[11px]">
              Amount Credited (in words):
            </p>
            <p className="text-sm font-semibold text-foreground italic mt-0.5">
              {numberToWords(totals.grandTotal || 0)}
            </p>

            {creditNote.notes && (
              <div className="mt-4 p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-foreground/80">Audit Remarks: </span>
                <span className="text-muted-foreground">{creditNote.notes}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:text-right">
            <div className="flex justify-between sm:justify-end gap-8 py-0.5">
              <span className="text-muted-foreground">Taxable Subtotal:</span>
              <span className="font-mono font-medium">
                ₹{totals.subtotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </span>
            </div>
            {totals.cgstTotal > 0 && (
              <div className="flex justify-between sm:justify-end gap-8 py-0.5">
                <span className="text-muted-foreground">CGST Total:</span>
                <span className="font-mono font-medium">
                  ₹{totals.cgstTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {totals.sgstTotal > 0 && (
              <div className="flex justify-between sm:justify-end gap-8 py-0.5">
                <span className="text-muted-foreground">SGST Total:</span>
                <span className="font-mono font-medium">
                  ₹{totals.sgstTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {totals.igstTotal > 0 && (
              <div className="flex justify-between sm:justify-end gap-8 py-0.5">
                <span className="text-muted-foreground">IGST Total:</span>
                <span className="font-mono font-medium">
                  ₹{totals.igstTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex justify-between sm:justify-end gap-8 py-2 border-t border-b text-sm font-bold text-foreground">
              <span>Grand Total Credited:</span>
              <span className="text-purple-600 dark:text-purple-400 font-mono">
                ₹{totals.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between sm:justify-end gap-8 py-0.5 text-muted-foreground">
              <span>Unallocated Credit Balance:</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                ₹{creditNote.unallocatedCredit?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 pt-8 border-t flex justify-between items-end text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Client Acknowledgment</p>
            <p className="text-[11px]">Sign & Company Seal</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-foreground">For {firmName}</p>
            <div className="h-12"></div>
            <p className="text-[11px] font-semibold text-foreground">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApplyCreditModal
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        creditNote={creditNote}
        onSuccess={() => refetch()}
      />

      <RefundCreditModal
        open={isRefundModalOpen}
        onOpenChange={setIsRefundModalOpen}
        creditNote={creditNote}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
