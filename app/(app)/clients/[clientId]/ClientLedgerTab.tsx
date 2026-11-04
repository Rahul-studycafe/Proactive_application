"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  CreditCard,
  FileMinus,
  Printer,
  RotateCcw,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetLedgerQuery } from "@/lib/services/api";

function formatCurrency(amount: number) {
  return `₹${Math.abs(amount).toLocaleString("en-IN", {
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

export function ClientLedgerTab({ clientId }: { clientId: string }) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data, isLoading, isFetching, refetch } = useGetLedgerQuery({
    clientId,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const handleResetFilter = () => {
    setFromDate("");
    setToDate("");
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card p-6 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ledger = data || {
    client: null,
    openingBalance: 0,
    entries: [],
    totalDebits: 0,
    totalCredits: 0,
    closingBalance: 0,
  };

  const isNetDue = ledger.closingBalance > 0;
  const isNetCredit = ledger.closingBalance < 0;

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions Bar */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Period:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-40 text-xs"
              placeholder="From Date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-40 text-xs"
              placeholder="To Date"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilter}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Statement
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">
              Opening Balance
            </span>
            <div className="mt-1 text-xl font-semibold tracking-tight">
              {formatCurrency(ledger.openingBalance)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {ledger.openingBalance > 0
                  ? "(Dr)"
                  : ledger.openingBalance < 0
                    ? "(Cr)"
                    : ""}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Balance before{" "}
              {fromDate ? formatDate(fromDate) : "all transactions"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Invoiced (Debits)
              </span>
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {formatCurrency(ledger.totalDebits)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Total fees billed during this period
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Received (Credits)
              </span>
              <ArrowDownRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(ledger.totalCredits)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Payments and receipts reconciled
            </p>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm border-l-4 ${
            isNetDue
              ? "border-l-destructive bg-destructive/5"
              : isNetCredit
                ? "border-l-emerald-500 bg-emerald-500/5"
                : "border-l-border"
          }`}
        >
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">
              Closing Balance (Net)
            </span>
            <div
              className={`mt-1 text-xl font-bold tracking-tight ${
                isNetDue
                  ? "text-destructive"
                  : isNetCredit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
              }`}
            >
              {formatCurrency(ledger.closingBalance)}
              <span className="ml-1 text-xs font-normal">
                {isNetDue
                  ? "Dr (Due)"
                  : isNetCredit
                    ? "Cr (Advance)"
                    : "Settled"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Current net statement balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Chronological Running Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Statement of Account
            </h3>
            <p className="text-xs text-muted-foreground">
              Complete chronological audit trail with server-side running
              balance
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {ledger.entries.length} Transaction
            {ledger.entries.length === 1 ? "" : "s"}
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead className="w-[130px]">Ref No</TableHead>
              <TableHead>Particulars</TableHead>
              <TableHead className="w-[120px] text-right">Debit (₹)</TableHead>
              <TableHead className="w-[120px] text-right">Credit (₹)</TableHead>
              <TableHead className="w-[140px] text-right">
                Running Balance (₹)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Opening Balance Row */}
            <TableRow className="bg-muted/10 font-medium text-xs">
              <TableCell className="text-muted-foreground">
                {fromDate ? formatDate(fromDate) : "Beginning"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-wide"
                >
                  Initial
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-muted-foreground">
                -
              </TableCell>
              <TableCell className="font-medium text-muted-foreground">
                Opening Balance Brought Forward
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                -
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                -
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(ledger.openingBalance)}
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {ledger.openingBalance > 0
                    ? "Dr"
                    : ledger.openingBalance < 0
                      ? "Cr"
                      : ""}
                </span>
              </TableCell>
            </TableRow>

            {ledger.entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No invoice or receipt activity recorded during this period.
                </TableCell>
              </TableRow>
            ) : (
              ledger.entries.map((entry: any, index: number) => {
                const isInvoice = entry.type === "Invoice";
                const isCreditNote = entry.type === "Credit Note";
                const isPositiveBal = (entry.balance || 0) > 0;
                const isNegativeBal = (entry.balance || 0) < 0;

                return (
                  <TableRow
                    key={`${entry.referenceNo}-${index}`}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="text-xs font-mono">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell>
                      {isInvoice ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 text-[11px]"
                        >
                          <FileText className="h-3 w-3" /> Invoice
                        </Badge>
                      ) : isCreditNote ? (
                        <Badge
                          variant="outline"
                          className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 text-[11px]"
                        >
                          <FileMinus className="h-3 w-3" /> Credit Note
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]"
                        >
                          <CreditCard className="h-3 w-3" /> Receipt
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-medium">
                      {isInvoice ? (
                        <Link
                          href={`/view-invoice/${entry.referenceId}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {entry.referenceNo}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      ) : isCreditNote ? (
                        <Link
                          href={`/credit-notes/${entry.referenceId}`}
                          className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {entry.referenceNo}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </Link>
                      ) : (
                        <span>{entry.referenceNo}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium text-foreground">
                        {entry.particulars}
                      </div>
                      {entry.referenceNumber && (
                        <div className="text-[11px] text-muted-foreground">
                          Ref: {entry.referenceNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {entry.debit > 0 ? (
                        <span className="font-semibold text-foreground">
                          {formatCurrency(entry.debit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {entry.credit > 0 ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(entry.credit)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right text-xs font-mono font-bold ${
                        isPositiveBal
                          ? "text-destructive"
                          : isNegativeBal
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(entry.balance || 0)}
                      <span className="ml-1 text-[10px] font-normal">
                        {isPositiveBal ? "Dr" : isNegativeBal ? "Cr" : ""}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Closing Balance Row */}
            <TableRow className="bg-muted/30 font-semibold text-xs border-t-2">
              <TableCell
                colSpan={4}
                className="text-right uppercase tracking-wider text-muted-foreground"
              >
                Period Totals & Closing Balance:
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatCurrency(ledger.totalDebits)}
              </TableCell>
              <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(ledger.totalCredits)}
              </TableCell>
              <TableCell
                className={`text-right font-mono font-bold ${
                  isNetDue
                    ? "text-destructive"
                    : isNetCredit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                }`}
              >
                {formatCurrency(ledger.closingBalance)}
                <span className="ml-1 text-[10px] font-normal">
                  {isNetDue ? "Dr" : isNetCredit ? "Cr" : ""}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
