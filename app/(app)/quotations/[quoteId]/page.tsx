"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Printer,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Phone,
  Mail,
  MapPin,
  Landmark,
  ShieldCheck,
  FileCheck,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetQuotationPrintQuery,
  useUpdateQuotationStatusMutation,
  useSendQuotationEmailMutation,
} from "@/lib/services/api";
import {
  QuotationStatusBadge,
  ConvertToInvoiceButton,
} from "@/components/quotations";

export default function QuotationViewPrintPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quoteId as string;

  const { data, isLoading, isError, refetch } =
    useGetQuotationPrintQuery(quoteId, {
      skip: !quoteId,
    });

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateQuotationStatusMutation();
  const [sendEmail, { isLoading: isSendingEmail }] =
    useSendQuotationEmailMutation();

  const quotation = data?.quotation;
  const firm = data?.firm;
  const amountInWords = data?.amountInWords;

  const client =
    typeof quotation?.clientId === "object" && quotation?.clientId
      ? (quotation.clientId as any)
      : null;

  const isConverted = quotation?.status === "Converted";

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!quotation) return;
    try {
      await sendEmail({ id: quotation._id }).unwrap();
      toast.success("Quotation sent via email to client!");
    } catch (err: any) {
      toast.error("Failed to send quotation email", {
        description: err?.data?.message || err?.message || "An error occurred",
      });
    }
  };

  const handleStatusChange = async (
    newStatus: "Draft" | "Sent" | "Accepted" | "Declined"
  ) => {
    if (!quotation) return;
    try {
      await updateStatus({ id: quotation._id, status: newStatus }).unwrap();
      toast.success(`Proposal marked as ${newStatus}`);
      refetch();
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.data?.message || err?.message || "An error occurred",
      });
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive w-14 h-14 mx-auto flex items-center justify-center">
          <XCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Quotation Not Found
        </h2>
        <p className="text-sm text-muted-foreground">
          The requested quotation could not be located or may have been deleted.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/quotations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Link>
        </Button>
      </div>
    );
  }

  const isInterState = (quotation.totals?.igstTotal || 0) > 0;

  return (
    <div className="pb-16 print:p-0">
      {/* ─── Top Action Bar (Hidden during Print) ───────────────────── */}
      <div className="no-print mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/quotations">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Quotations
            </Link>
          </Button>
          <span className="text-muted-foreground/40">•</span>
          <span className="font-mono font-bold text-foreground">
            {quotation.quotationNo}
          </span>
          <QuotationStatusBadge status={quotation.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Status Changer Dropdown */}
          {!isConverted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  Status: {quotation.status}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuLabel>Update Proposal Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange("Draft")}
                  disabled={quotation.status === "Draft"}
                  className="cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                  Mark as Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("Sent")}
                  disabled={quotation.status === "Sent"}
                  className="cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5 mr-2 text-blue-500" />
                  Mark as Sent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("Accepted")}
                  disabled={quotation.status === "Accepted"}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  Mark as Accepted
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("Declined")}
                  disabled={quotation.status === "Declined"}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <XCircle className="h-3.5 w-3.5 mr-2" />
                  Mark as Declined
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Send Email */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="h-9 gap-1.5 text-xs"
          >
            <Send className="h-3.5 w-3.5 text-muted-foreground" />
            Send Email
          </Button>

          {/* Print Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            Print / Save PDF
          </Button>

          {/* 1-Click Convert to Invoice Button (F-109) */}
          <ConvertToInvoiceButton quotation={quotation} size="sm" />
        </div>
      </div>

      {/* ─── Formal Printable Quotation Sheet ───────────────────────── */}
      <div className="printable-quotation-sheet max-w-4xl mx-auto bg-card border border-border/80 shadow-md rounded-2xl p-8 sm:p-10 space-y-8 text-foreground print:border-none print:shadow-none print:p-0 print:max-w-none print:rounded-none">
        {/* Header: Firm Branding & Quotation Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-border/80">
          {/* Firm Info */}
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {firm?.name || "Professional Services Firm"}
            </h2>
            {firm?.legalName && firm?.legalName !== firm?.name && (
              <p className="text-xs text-muted-foreground font-medium">
                {firm.legalName}
              </p>
            )}

            <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
              {firm?.address && (
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {[
                      firm.address.street,
                      firm.address.city,
                      firm.address.state,
                      firm.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
              {firm?.gstin && (
                <p>
                  <span className="font-semibold text-foreground">GSTIN:</span>{" "}
                  <span className="font-mono">{firm.gstin}</span>
                </p>
              )}
              {firm?.pan && (
                <p>
                  <span className="font-semibold text-foreground">PAN:</span>{" "}
                  <span className="font-mono">{firm.pan}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 pt-0.5">
                {firm?.phone && <span>Tel: {firm.phone}</span>}
                {firm?.email && <span>Email: {firm.email}</span>}
              </div>
            </div>
          </div>

          {/* Quotation Document Stamp */}
          <div className="sm:text-right space-y-2">
            <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
              Quotation / Proposal
            </div>
            <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">
              {quotation.quotationNo}
            </h3>

            <div className="text-xs text-muted-foreground space-y-1 pt-1 font-sans">
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="font-medium">Issue Date:</span>
                <span className="font-mono text-foreground">
                  {formatDate(quotation.date)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="font-medium">Valid Until:</span>
                <span className="font-mono text-foreground">
                  {formatDate(quotation.validUntil)}
                </span>
              </div>
              <div className="flex justify-between sm:justify-end gap-3">
                <span className="font-medium">Place of Supply:</span>
                <span className="text-foreground">
                  {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Details Section ("Proposal For") */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Proposal Prepared For:
          </span>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-0.5">
              <h4 className="text-base font-bold text-foreground">
                {client?.name || "Client Name"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {client?.fileNo && <span>File No: {client.fileNo} • </span>}
                {client?.pan && <span>PAN: {client.pan}</span>}
                {client?.gstin && <span> • GSTIN: {client.gstin}</span>}
              </p>
              {client?.address && (
                <p className="text-xs text-muted-foreground">
                  {[
                    client.address.street,
                    client.address.city,
                    client.address.state,
                    client.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground sm:text-right space-y-0.5">
              {client?.email && <p>Email: {client.email}</p>}
              {client?.mobile && <p>Mobile: {client.mobile}</p>}
              {client?.state && <p>State: {client.state}</p>}
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="space-y-2">
          <div className="rounded-xl border border-border/80 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50 text-xs">
                <TableRow>
                  <TableHead className="w-[5%] text-center">#</TableHead>
                  <TableHead className="w-[35%]">Description & SAC</TableHead>
                  <TableHead className="w-[10%] text-right">Rate (₹)</TableHead>
                  <TableHead className="w-[8%] text-right">Qty</TableHead>
                  <TableHead className="w-[10%] text-right">Disc (₹)</TableHead>
                  <TableHead className="w-[12%] text-right">Taxable (₹)</TableHead>
                  <TableHead className="w-[8%] text-right">GST %</TableHead>
                  <TableHead className="w-[12%] text-right">Total (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {quotation.items?.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-transparent">
                    <TableCell className="text-center font-mono text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {item.description}
                      </div>
                      {item.sacCode && (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          SAC: {item.sacCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {item.discount > 0 ? `-${formatCurrency(item.discount)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(item.taxableAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.gstPercentage}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Bottom Split: Bank/Terms & Summary Math */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-2">
          {/* Left: Amount In Words, Bank Details, Terms */}
          <div className="md:col-span-7 space-y-5">
            {/* Amount In Words */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/20 text-xs">
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                Total Amount in Words:
              </span>
              <span className="font-semibold text-foreground italic mt-0.5 block">
                {amountInWords || "—"}
              </span>
            </div>

            {/* Bank Details */}
            {firm?.bankDetails && firm.bankDetails.bankName && (
              <div className="rounded-lg border border-border/80 p-3.5 space-y-1.5 text-xs bg-card">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-primary" />
                  Bank Remittance Details:
                </span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground pt-1">
                  <div>
                    Bank:{" "}
                    <span className="font-medium text-foreground">
                      {firm.bankDetails.bankName}
                    </span>
                  </div>
                  <div>
                    A/c No:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {firm.bankDetails.accountNumber}
                    </span>
                  </div>
                  <div>
                    IFSC:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {firm.bankDetails.ifscCode}
                    </span>
                  </div>
                  {firm.bankDetails.branchName && (
                    <div>Branch: {firm.bankDetails.branchName}</div>
                  )}
                  {firm.bankDetails.upiId && (
                    <div className="col-span-2">
                      UPI ID:{" "}
                      <span className="font-mono text-primary font-medium">
                        {firm.bankDetails.upiId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {quotation.termsAndConditions && (
              <div className="space-y-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Terms & Conditions:
                </span>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {quotation.termsAndConditions}
                </p>
              </div>
            )}

            {/* Notes */}
            {quotation.notes && (
              <div className="space-y-1 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                  Special Notes:
                </span>
                <p className="whitespace-pre-line text-muted-foreground">
                  {quotation.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right: Itemized Summary Totals Box */}
          <div className="md:col-span-5 space-y-3">
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">
                  {formatCurrency(quotation.totals?.subtotal || 0)}
                </span>
              </div>

              {(quotation.totals?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Total Discount:</span>
                  <span className="font-mono">
                    -{formatCurrency(quotation.totals.discountTotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/60">
                <span>Taxable Amount:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(quotation.totals?.taxableTotal || 0)}
                </span>
              </div>

              {isInterState ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST (Integrated Tax):</span>
                  <span className="font-mono text-foreground">
                    {formatCurrency(quotation.totals?.igstTotal || 0)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST (Central Tax):</span>
                    <span className="font-mono text-foreground">
                      {formatCurrency(quotation.totals?.cgstTotal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST (State Tax):</span>
                    <span className="font-mono text-foreground">
                      {formatCurrency(quotation.totals?.sgstTotal || 0)}
                    </span>
                  </div>
                </>
              )}

              {(quotation.totals?.roundOff || 0) !== 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Round-off:</span>
                  <span className="font-mono text-foreground">
                    {quotation.totals.roundOff > 0 ? "+" : ""}
                    {quotation.totals.roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2.5 border-t border-border/80">
                <span className="text-sm font-bold text-foreground">
                  Grand Total:
                </span>
                <span className="text-xl font-bold font-mono text-primary">
                  {formatCurrency(quotation.totals?.grandTotal || 0)}
                </span>
              </div>
            </div>

            {/* Converted Invoice Notice */}
            {isConverted && (
              <div className="rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 p-3 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <FileCheck className="h-4 w-4 shrink-0" />
                  <span>Proposal converted to Invoice</span>
                </div>
                <ConvertToInvoiceButton quotation={quotation} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Signatures & Acceptance Footer */}
        <div className="pt-10 border-t border-border/80 grid grid-cols-2 gap-8 text-xs text-muted-foreground">
          <div className="space-y-12">
            <p className="font-medium text-foreground">
              Client Acceptance & Confirmation:
            </p>
            <div className="border-t border-dashed border-border/80 pt-2 space-y-0.5">
              <p>Authorized Signature & Stamp</p>
              <p className="text-[11px]">Date: ________________________</p>
            </div>
          </div>

          <div className="text-right space-y-12">
            <p className="font-medium text-foreground">
              For {firm?.name || "Professional Services Firm"}:
            </p>
            <div className="border-t border-dashed border-border/80 pt-2 space-y-0.5">
              <p>Authorized Signatory</p>
              <p className="text-[11px]">Chartered Accountant / Partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS Injected Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.2cm;
            size: A4 portrait;
          }
          body {
            background: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print,
          header,
          nav,
          aside,
          button,
          .dropdown-menu {
            display: none !important;
          }
          .printable-quotation-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
