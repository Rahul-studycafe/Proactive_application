"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Receipt,
  Printer,
  Calendar,
  CreditCard,
  User,
  Hash,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ReceiptDetailsDialogProps {
  receipt: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(amount: number) {
  return `₹${(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | Date) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceiptDetailsDialog({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailsDialogProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const settlements = receipt.settlements || [];
  const client = receipt.clientId || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Payment Receipt Voucher
              </DialogTitle>
              <p className="text-xs font-mono text-muted-foreground">
                {receipt.receiptNo}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs mr-4"
          >
            <Printer className="h-3.5 w-3.5" /> Print Voucher
          </Button>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">
                Receipt Date
              </span>
              <p className="mt-0.5 text-xs font-medium">
                {formatDate(receipt.date)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">
                Payment Mode
              </span>
              <p className="mt-0.5 text-xs font-medium">
                {receipt.paymentMode}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] text-muted-foreground">
                Reference / UTR
              </span>
              <p className="mt-0.5 text-xs font-mono font-medium">
                {receipt.referenceNumber || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border bg-emerald-500/10 border-emerald-500/20 p-3">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Amount Received
              </span>
              <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(receipt.totalAmount)}
              </p>
            </div>
          </div>

          {/* Client Details */}
          <div className="rounded-xl border p-4 bg-card text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              Client Details
            </span>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {typeof client === "object" ? client.name : "Client"}
                </p>
                {typeof client === "object" && (client.clientNumber || client.fileNo) && (
                  <p className="text-muted-foreground font-mono">
                    Client No: {client.clientNumber || client.fileNo}
                  </p>
                )}
              </div>
              {typeof client === "object" && client._id && (
                <Link
                  href={`/clients/${client._id}?tab=ledger`}
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                >
                  View Client Ledger <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Deductions & Advance breakdown */}
          {(receipt.tdsAmount > 0 ||
            receipt.discountAmount > 0 ||
            receipt.unallocatedAmount > 0) && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground">TDS Deducted:</span>
                <p className="font-semibold font-mono">
                  {formatCurrency(receipt.tdsAmount)}
                </p>
              </div>
              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground">Discount Allowed:</span>
                <p className="font-semibold font-mono">
                  {formatCurrency(receipt.discountAmount)}
                </p>
              </div>
              <div className="rounded-lg border p-2.5">
                <span className="text-muted-foreground">
                  Advance (Unallocated):
                </span>
                <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(receipt.unallocatedAmount)}
                </p>
              </div>
            </div>
          )}

          {/* Settlements Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Invoices Settled by this Receipt
            </h4>
            {settlements.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No individual invoices settled. Full amount recorded as an
                Advance credit in the client ledger.
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Invoice #</TableHead>
                      <TableHead className="text-xs text-right">
                        Settled Amount (₹)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s: any, idx: number) => {
                      const invId =
                        typeof s.invoiceId === "object"
                          ? s.invoiceId._id
                          : s.invoiceId;
                      const invNo =
                        typeof s.invoiceId === "object"
                          ? s.invoiceId.invoiceNo
                          : `Invoice #${idx + 1}`;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">
                            {invId ? (
                              <Link
                                href={`/view-invoice/${invId}`}
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                {invNo} <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              invNo
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {formatCurrency(s.settledAmount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Notes */}
          {receipt.notes && (
            <div className="rounded-lg border bg-muted/10 p-3 text-xs">
              <span className="font-semibold text-muted-foreground">
                Notes:
              </span>
              <p className="mt-0.5 text-foreground">{receipt.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
