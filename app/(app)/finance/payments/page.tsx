"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  QrCode,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetPaymentTransactionsQuery } from "@/lib/services/api";
import { formatDate } from "@/lib/utils";
import { withPermission } from "@/components/shared/withPermission";

function PaymentTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const { data, isLoading, refetch } = useGetPaymentTransactionsQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const transactions = data?.transactions || [];

  const filteredTransactions = transactions.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const txId = (t.gatewayTransactionId || "").toLowerCase();
    const orderId = (t.gatewayOrderId || "").toLowerCase();
    const clientName = (t.clientId?.name || "").toLowerCase();
    const invNo = (t.invoiceId?.invoiceNo || "").toLowerCase();
    return (
      txId.includes(q) ||
      orderId.includes(q) ||
      clientName.includes(q) ||
      invNo.includes(q)
    );
  });

  const totalCaptured = transactions
    .filter((t: any) => t.status === "Captured")
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const capturedCount = transactions.filter(
    (t: any) => t.status === "Captured",
  ).length;
  const failedCount = transactions.filter(
    (t: any) => t.status === "Failed",
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Captured":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 gap-1 text-[11px]"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Captured
          </Badge>
        );
      case "Initiated":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 gap-1 text-[11px]"
          >
            <Clock className="h-3 w-3 text-blue-600" /> Initiated
          </Badge>
        );
      case "Failed":
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 gap-1 text-[11px]"
          >
            <AlertCircle className="h-3 w-3 text-rose-600" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[11px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" /> Digital Collections &
            Direct UPI Reconciliation Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit history of all digital collections processed through Direct
            UPI QR, bank transfers, and instant automated ledger settlements.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5 text-xs shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Live Feed
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settled Gateway Revenue
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹
              {totalCaptured.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Processed via digital payment rails across {capturedCount}{" "}
            transactions.
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Successful Transactions
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {capturedCount} Settled
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Autonomously reconciled with receipts issued.
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Failed Attempts
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${failedCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}
            >
              {failedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] text-muted-foreground">
            Declined by bank or abandoned at checkout.
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Payment ID, Order ID, Invoice #, or Client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-xs w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Statuses
              </SelectItem>
              <SelectItem value="Captured" className="text-xs">
                Captured
              </SelectItem>
              <SelectItem value="Initiated" className="text-xs">
                Initiated
              </SelectItem>
              <SelectItem value="Failed" className="text-xs">
                Failed
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table (Phase F-135) */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CreditCard className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              No Payment Transactions Recorded
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Transactions processed via Dynamic UPI QR codes or direct bank
              transfers will appear in this reconciliation ledger.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold">
                  Payment / UTR ID
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Client Name
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Invoice Settled
                </TableHead>
                <TableHead className="text-xs font-semibold">Method</TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Amount (₹)
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Timestamp
                </TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx: any) => (
                <TableRow
                  key={tx._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {tx.gatewayTransactionId}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {tx.clientId?.name || "Client"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {tx.invoiceId?.invoiceNo || "Invoice"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {tx.paymentMethod || "UPI"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-right text-emerald-600 dark:text-emerald-400">
                    ₹
                    {(tx.amount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(tx.status)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTx(tx)}
                      className="h-7 text-xs text-primary hover:bg-primary/10"
                    >
                      Audit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Transaction Audit Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedTx?.gatewayProvider || "Gateway"}
              </Badge>
              {selectedTx && getStatusBadge(selectedTx.status)}
            </div>
            <DialogTitle className="text-base font-bold mt-1">
              Transaction Audit Particulars
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cryptographic verification and ACID settlement audit record.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">
                    Gateway Payment ID:
                  </span>
                  <span className="font-mono font-semibold">
                    {selectedTx.gatewayTransactionId}
                  </span>
                </div>
                {selectedTx.gatewayOrderId && (
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">
                      {selectedTx.gatewayOrderId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-semibold">
                    {selectedTx.clientId?.name}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">
                    Invoice Reference:
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    {selectedTx.invoiceId?.invoiceNo}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹
                    {selectedTx.amount?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Payment Channel:
                  </span>
                  <span className="font-medium">
                    {selectedTx.paymentMethod || "UPI"}
                  </span>
                </div>
              </div>

              {selectedTx.status === "Captured" && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Invoice balances and client running ledgers were updated
                    automatically via ACID multi-document transaction.
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withPermission(PaymentTransactionsPage, "payment:view", {
  title: "Transactions Access Restricted",
  description:
    "You do not have permission to view online payment transactions. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
