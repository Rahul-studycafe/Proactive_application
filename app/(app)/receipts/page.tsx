"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Receipt,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Banknote,
  Smartphone,
  CheckCircle2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetReceiptsQuery } from "@/lib/services/api";
import { CreateReceiptDialog } from "./CreateReceiptDialog";
import { ReceiptDetailsDialog } from "./ReceiptDetailsDialog";
import { withPermission } from "@/components/shared/withPermission";
import { Can } from "@/contexts/PermissionsContext";

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

const getPaymentModeBadge = (mode: string) => {
  switch (mode) {
    case "Bank Transfer":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 gap-1 text-[11px]"
        >
          <Building2 className="h-3 w-3" /> Bank Transfer
        </Badge>
      );
    case "UPI":
      return (
        <Badge
          variant="outline"
          className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1 text-[11px]"
        >
          <Smartphone className="h-3 w-3" /> UPI
        </Badge>
      );
    case "Cheque":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 text-[11px]"
        >
          <Receipt className="h-3 w-3" /> Cheque
        </Badge>
      );
    case "Cash":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 text-[11px]"
        >
          <Banknote className="h-3 w-3" /> Cash
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[11px]">
          {mode || "Other"}
        </Badge>
      );
  }
};

function ReceiptsPage() {
  const [page, setPage] = useState(1);
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const queryParams: Record<string, any> = { page, limit: 15 };
  if (modeFilter !== "all") queryParams.paymentMode = modeFilter;

  const { data, isLoading, isFetching } = useGetReceiptsQuery(queryParams);

  const receipts = data?.receipts || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  // Client-side search filter on page items
  const filteredReceipts = useMemo(() => {
    if (!searchTerm.trim()) return receipts;
    const q = searchTerm.toLowerCase();
    return receipts.filter((r: any) => {
      const clientName =
        typeof r.clientId === "object" ? r.clientId?.name?.toLowerCase() : "";
      const clientFile =
        typeof r.clientId === "object" ? r.clientId?.fileNo?.toLowerCase() : "";
      const receiptNo = r.receiptNo?.toLowerCase() || "";
      const refNo = r.referenceNumber?.toLowerCase() || "";
      return (
        receiptNo.includes(q) ||
        refNo.includes(q) ||
        clientName?.includes(q) ||
        clientFile?.includes(q)
      );
    });
  }, [receipts, searchTerm]);

  // Aggregate stats on current page
  const totalReceived = useMemo(() => {
    return receipts.reduce(
      (sum: number, r: any) => sum + (r.totalAmount || 0),
      0,
    );
  }, [receipts]);

  const totalAdvance = useMemo(() => {
    return receipts.reduce(
      (sum: number, r: any) => sum + (r.unallocatedAmount || 0),
      0,
    );
  }, [receipts]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Receipts & Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Track incoming payments, TDS deductions, and invoice settlement
            reconciliation.
          </p>
        </div>
        <Can do="receipt:create">
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Record Payment
          </Button>
        </Can>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">
              Total Receipts Recorded
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight">
              {pagination.total}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Across all payment methods
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Collections
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceived)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded in this view
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-muted-foreground">
              Advance Collections
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(totalAdvance)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unallocated client credits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt #, client, or UTR/cheque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Payment Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 mb-3 opacity-20" />
            <p className="font-semibold text-foreground">No receipts found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Record client payments to start tracking settlements and ledger
              credits.
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Record First Receipt
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[120px]">Receipt #</TableHead>
                <TableHead className="w-[110px]">Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-[140px]">Payment Mode</TableHead>
                <TableHead className="w-[160px]">Reference / UTR</TableHead>
                <TableHead className="w-[130px] text-right">
                  Amount (₹)
                </TableHead>
                <TableHead className="w-[120px] text-right">
                  Advance (₹)
                </TableHead>
                <TableHead className="w-[90px] text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.map((r: any) => {
                const client =
                  typeof r.clientId === "object" ? r.clientId : null;
                return (
                  <TableRow key={r._id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold">
                      {r.receiptNo}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {formatDate(r.date)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {client ? (
                        <Link
                          href={`/clients/${client._id}?tab=ledger`}
                          className="font-medium hover:underline text-foreground"
                        >
                          {client.name}
                          {client.fileNo && (
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({client.fileNo})
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">
                          Unknown Client
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getPaymentModeBadge(r.paymentMode)}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.referenceNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {r.unallocatedAmount > 0 ? (
                        <span className="text-foreground font-semibold">
                          {formatCurrency(r.unallocatedAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedReceipt(r)}
                        title="View Receipt Voucher"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t p-4 text-xs text-muted-foreground">
            <div>
              Showing Page {pagination.page} of {pagination.pages} (
              {pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2.5"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Receipt Dialog */}
      <CreateReceiptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* View Receipt Voucher Details Dialog */}
      <ReceiptDetailsDialog
        receipt={selectedReceipt}
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
      />
    </div>
  );
}

export default withPermission(ReceiptsPage, "receipt:view", {
  title: "Receipts Access Restricted",
  description:
    "You do not have permission to view receipts and payment logs. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
