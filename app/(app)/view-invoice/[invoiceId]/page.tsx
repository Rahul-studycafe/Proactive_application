"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Printer,
  Pencil,
  FileText,
  FileMinus,
  Loader2,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  Share2,
} from "lucide-react";
import { IssueCreditNoteModal } from "@/components/credit-notes/IssueCreditNoteModal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetInvoiceByIdQuery } from "@/lib/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Status badge styling ───────────────────────────────────────
const statusStyle: Record<string, string> = {
  Paid: "border-success/30 bg-success/10 text-success",
  Unpaid: "border-warning/30 bg-warning/15 text-warning-foreground",
  "Partially Paid":
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Draft: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

// ─── Currency & Date Formatters ─────────────────────────────────
function formatCurrency(v: number) {
  return `₹${(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d?: string | Date) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Indian Rupee Number to Words ───────────────────────────────
function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
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
    if (n === 0) return "";
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

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = (params?.invoiceId as string) || "";
  const { user } = useAuth();

  const {
    data: invoice,
    isLoading,
    error,
  } = useGetInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId,
  });

  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Invoice link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading invoice details...
        </p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Invoices", href: "/invoices" },
            { label: "Invoice Not Found" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-destructive mb-3 opacity-60" />
          <h2 className="text-lg font-semibold">Invoice not found</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            The requested invoice could not be loaded or may have been deleted.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/invoices">Return to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

  const client = invoice.clientId || {};
  const totals = invoice.totals || {
    subtotal: 0,
    totalDiscount: 0,
    totalTaxable: 0,
    totalGst: 0,
    roundOff: 0,
    grandTotal: 0,
    amountPaid: 0,
    amountDue: 0,
  };
  const items = invoice.items || [];
  const firmName =
    user?.workspace || user?.tenant || "Proactive Advisory & Associates";

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Breadcrumbs (Hidden in Print) ────── */}
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { label: "Invoices", href: "/invoices" },
            { label: invoice.invoiceNo || "Invoice Details" },
          ]}
        />
      </div>

      {/* ─── Top Navigation & Controls (Hidden in Print) ────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {invoice.invoiceNo}
          </h1>
          <Badge
            variant="outline"
            className={statusStyle[invoice.status] ?? ""}
          >
            {invoice.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Share2 className="mr-1.5 h-4 w-4" /> Share
          </Button>
          {invoice.status !== "Draft" && invoice.status !== "Cancelled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreditNoteModalOpen(true)}
              className="gap-1.5 text-xs text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
            >
              <FileMinus className="h-4 w-4" /> Issue Credit Note
            </Button>
          )}
          {invoice.status === "Draft" && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/invoices/new?id=${invoice._id}`}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit Draft
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* ─── Printable Invoice Document Sheet ───────────────── */}
      <div
        id="invoice-print-area"
        className="invoice-sheet mx-auto max-w-4xl rounded-2xl border bg-card p-8 sm:p-12 shadow-sm text-foreground transition-colors print:border-none print:shadow-none print:p-0 print:max-w-none print:m-0"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4 print:flex-row print:pb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                P
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {firmName}
                </h2>
                <p className="text-xs text-muted-foreground font-medium">
                  Chartered Accountants & Financial Advisors
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 mt-3">
              <p>
                {user?.location ||
                  "101, Corporate Heights, C.G. Road, Ahmedabad - 380009"}
              </p>
              <p>
                Email: {user?.email || "billing@proactive.os"}{" "}
                {user?.phone ? `· Mobile: ${user.phone}` : ""}
              </p>
              <p className="font-mono pt-1 text-foreground/80">
                GSTIN: <span className="font-semibold">24AAACP1234F1Z8</span> ·
                PAN: <span className="font-semibold">AAACP1234F</span>
              </p>
            </div>
          </div>

          <div className="sm:text-right print:text-right">
            <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary font-bold text-sm tracking-wider uppercase mb-2">
              {invoice.status === "Draft" ? "DRAFT INVOICE" : "TAX INVOICE"}
            </div>
            <p className="font-mono text-lg font-bold tracking-tight">
              #{invoice.invoiceNo}
            </p>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>
                Invoice Date:{" "}
                <span className="font-medium text-foreground">
                  {formatDate(invoice.date)}
                </span>
              </p>
              {invoice.dueDate && (
                <p>
                  Due Date:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(invoice.dueDate)}
                  </span>
                </p>
              )}
              <p>
                Place of Supply:{" "}
                <span className="font-medium text-foreground">
                  {client.state ? `${client.state} (24)` : "Gujarat (24)"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Client & Billing Info */}
        <div className="py-4 border-b text-sm print:py-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billed To
            </p>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-foreground">
                {client.name || "Client Name"}
              </h3>
              {client.entityType && (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 font-normal"
                >
                  {client.entityType}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
              {client.contactPersonName && (
                <p>Attn: {client.contactPersonName}</p>
              )}
              {client.address && <p>{client.address}</p>}
              {(client.city || client.state || client.pincode) && (
                <p>
                  {[client.city, client.state, client.pincode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-0.5">
                {client.mobile && <span>Mobile: +91 {client.mobile}</span>}
                {client.email && <span>Email: {client.email}</span>}
              </div>
              <div className="pt-0.5 font-mono text-foreground/80 flex flex-wrap gap-x-4 gap-y-0.5">
                {client.gstin && (
                  <span>
                    GSTIN:{" "}
                    <span className="font-semibold text-foreground">
                      {client.gstin}
                    </span>
                  </span>
                )}
                {client.pan && (
                  <span>
                    PAN:{" "}
                    <span className="font-semibold text-foreground">
                      {client.pan}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="py-6 border-b overflow-x-auto print:overflow-visible">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-8 text-center font-bold">#</TableHead>
                <TableHead className="min-w-[200px] font-bold">
                  Description / Particulars
                </TableHead>
                <TableHead className="w-20 font-bold">SAC</TableHead>
                <TableHead className="w-12 text-right font-bold">Qty</TableHead>
                <TableHead className="w-24 text-right font-bold">
                  Rate
                </TableHead>
                <TableHead className="w-16 text-right font-bold">
                  Disc.
                </TableHead>
                <TableHead className="w-14 text-right font-bold">GST</TableHead>
                <TableHead className="w-24 text-right font-bold">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any, idx: number) => {
                const sub = item.quantity * item.rate;
                const taxable = sub - (item.discount || 0);
                const gst = (taxable * (item.gstPercentage || 18)) / 100;
                const total = taxable + gst;

                return (
                  <TableRow key={idx} className="hover:bg-transparent">
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">
                          {item.particulars}
                        </span>
                        {item.referenceType === "Task" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 shrink-0 print:hidden"
                          >
                            Task
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.sacCode || "998231"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-muted-foreground">
                      {item.discount > 0 ? formatCurrency(item.discount) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {item.gstPercentage || 18}%
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold font-mono">
                      {formatCurrency(item.total || total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Calculation & Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 print:grid-cols-2">
          {/* Words & Notes */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Amount in Words
              </p>
              <p className="text-sm font-semibold italic text-foreground bg-muted/30 p-2.5 rounded-lg border">
                {numberToWordsIndian(totals.grandTotal)}
              </p>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Terms & Conditions
              </p>
              <ol className="text-[11px] text-muted-foreground list-decimal pl-3.5 space-y-0.5">
                <li>Payment is due within the stipulated date.</li>
                <li>Please quote invoice number in all payment references.</li>
                <li>Subject to local jurisdiction.</li>
              </ol>
            </div>
          </div>

          {/* Totals Table */}
          <div className="space-y-2 rounded-xl bg-muted/20 border p-4 text-sm self-start">
            <div className="flex justify-between py-1 text-muted-foreground text-xs">
              <span>Subtotal:</span>
              <span className="font-mono">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.totalDiscount > 0 && (
              <div className="flex justify-between py-1 text-success text-xs">
                <span>Discount:</span>
                <span className="font-mono">
                  -{formatCurrency(totals.totalDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 text-muted-foreground text-xs">
              <span>Taxable Value:</span>
              <span className="font-mono">
                {formatCurrency(totals.totalTaxable)}
              </span>
            </div>

            {/* GST Breakdown (CGST 9% + SGST 9%) */}
            <div className="flex justify-between py-1 text-muted-foreground text-xs">
              <span>CGST (9%):</span>
              <span className="font-mono">
                {formatCurrency(totals.totalGst / 2)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground text-xs">
              <span>SGST (9%):</span>
              <span className="font-mono">
                {formatCurrency(totals.totalGst / 2)}
              </span>
            </div>

            {Math.abs(totals.roundOff || 0) > 0.005 && (
              <div className="flex justify-between py-1 text-muted-foreground text-xs">
                <span>Round Off:</span>
                <span className="font-mono">
                  {totals.roundOff > 0 ? "+" : ""}
                  {formatCurrency(totals.roundOff)}
                </span>
              </div>
            )}

            <div className="border-t pt-2 flex justify-between font-bold text-base text-foreground">
              <span>Total Invoice Amount:</span>
              <span className="font-mono text-primary">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>

            <div className="flex justify-between py-1 text-xs text-muted-foreground">
              <span>Amount Paid:</span>
              <span className="font-mono">
                {formatCurrency(totals.amountPaid || 0)}
              </span>
            </div>

            <div className="flex justify-between py-1 font-semibold text-sm border-t border-dashed pt-2">
              <span>Balance Due:</span>
              <span className="font-mono text-destructive">
                {formatCurrency(totals.amountDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Authorized Signatory Block */}
        <div className="mt-8 pt-4 border-t flex flex-col sm:flex-row justify-between items-end gap-4 text-xs text-muted-foreground print:flex-row print:mt-4 print:pt-2">
          <div>
            <p>Thank you for choosing {firmName}.</p>
            <p className="text-[10px] mt-0.5">
              This is a computer-generated tax invoice.
            </p>
          </div>

          <div className="text-center sm:text-right space-y-8 print:space-y-4 print:text-right">
            <p className="font-medium text-foreground">For {firmName}</p>
            <div className="border-t border-muted-foreground/40 pt-1.5 w-44 text-center ml-auto">
              <p className="font-medium text-foreground">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>

      <IssueCreditNoteModal
        open={isCreditNoteModalOpen}
        onOpenChange={setIsCreditNoteModalOpen}
        preselectedInvoiceId={invoiceId}
        onSuccess={(newCnId) => router.push(`/credit-notes/${newCnId}`)}
      />
    </div>
  );
}
