"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileMinus,
  Search,
  Plus,
  RefreshCw,
  X,
  FileText,
  Building2,
  Calendar,
  IndianRupee,
  MoreVertical,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Banknote,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCreditNotesQuery } from "@/lib/services/api";
import { CreditNote, CreditNoteStatus } from "@/lib/types/credit-note";
import { IssueCreditNoteModal } from "@/components/credit-notes/IssueCreditNoteModal";
import { ApplyCreditModal } from "@/components/credit-notes/ApplyCreditModal";
import { RefundCreditModal } from "@/components/credit-notes/RefundCreditModal";

export default function CreditNotesDirectoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCnForApply, setSelectedCnForApply] =
    useState<CreditNote | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCnForRefund, setSelectedCnForRefund] =
    useState<CreditNote | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const queryParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    };
  }, [search, statusFilter, fromDate, toDate]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetCreditNotesQuery(queryParams);

  const creditNotes: CreditNote[] = listData?.creditNotes || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = listData?.total ?? creditNotes.length;
    let totalCredited = 0;
    let totalUnallocated = 0;
    let settledCount = 0;

    creditNotes.forEach((cn) => {
      totalCredited += cn.totals?.grandTotal || 0;
      totalUnallocated += cn.unallocatedCredit || 0;
      if (cn.status === "Applied" || cn.status === "Refunded") {
        settledCount++;
      }
    });

    return {
      totalCount,
      totalCredited,
      totalUnallocated,
      settledCount,
    };
  }, [creditNotes, listData]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

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
      case "Cancelled":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-500/30 dark:text-rose-400">
            <X className="mr-1 h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            <FileMinus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Financial Credit Notes
            </h1>
            <p className="text-sm text-muted-foreground">
              Statutory invoice adjustments, multi-document ACID reconciliations & unallocated balances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            id="issue-credit-note-btn"
            size="sm"
            onClick={() => setIsIssueModalOpen(true)}
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Issue Credit Note
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Credit Notes
              </span>
              <FileMinus className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold">{metrics.totalCount}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Issued in practice
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Value Credited
              </span>
              <IndianRupee className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground font-mono">
              ₹{metrics.totalCredited.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Deducted from invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Unallocated Balance
              </span>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
              ₹{metrics.totalUnallocated.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Available for future billing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Reconciled / Refunded
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {metrics.settledCount}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fully allocated or settled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by credit note number, client name, remarks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-[150px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range filters */}
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 w-36 text-xs"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 w-36 text-xs"
              placeholder="To"
            />
          </div>

          {(search || statusFilter !== "all" || fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 4. Credit Notes Data Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[140px]">Credit Note No</TableHead>
              <TableHead className="w-[110px]">Date</TableHead>
              <TableHead className="w-[200px]">Client</TableHead>
              <TableHead className="w-[130px]">Original Invoice</TableHead>
              <TableHead className="w-[180px]">Reason</TableHead>
              <TableHead className="w-[130px] text-right">Credited Total</TableHead>
              <TableHead className="w-[130px] text-right">Unallocated</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : creditNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-600">
                      <FileMinus className="h-6 w-6" />
                    </div>
                    <p className="text-base font-medium">No credit notes found</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {search || statusFilter !== "all" || fromDate || toDate
                        ? "Try adjusting your search criteria or resetting filters."
                        : "No financial credit notes have been issued in this organization yet."}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {(search || statusFilter !== "all" || fromDate || toDate) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        id="issue-first-credit-note-btn"
                        size="sm"
                        onClick={() => setIsIssueModalOpen(true)}
                        className="text-xs gap-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Issue First Credit Note
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              creditNotes.map((cn) => {
                const client =
                  typeof cn.clientId === "object" ? cn.clientId : null;
                const invoice =
                  typeof cn.invoiceId === "object" ? cn.invoiceId : null;
                const formattedDate = new Date(cn.date).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" }
                );

                return (
                  <TableRow
                    key={cn._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Credit Note No */}
                    <TableCell>
                      <Link
                        href={`/credit-notes/${cn._id}`}
                        className="font-mono font-semibold text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline"
                      >
                        {cn.creditNoteNo}
                      </Link>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formattedDate}
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      <div className="font-semibold text-xs text-foreground">
                        {client?.name || "Client"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {client?.entityType || client?.pan || ""}
                      </div>
                    </TableCell>

                    {/* Original Invoice */}
                    <TableCell>
                      {invoice ? (
                        <Link
                          href={`/view-invoice/${invoice._id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {invoice.invoiceNo}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Reason */}
                    <TableCell>
                      <div className="text-xs text-foreground font-medium">
                        {cn.reason}
                      </div>
                      {cn.notes && (
                        <div
                          className="text-[10px] text-muted-foreground truncate max-w-[150px] mt-0.5"
                          title={cn.notes}
                        >
                          {cn.notes}
                        </div>
                      )}
                    </TableCell>

                    {/* Grand Total */}
                    <TableCell className="text-right font-mono text-xs font-bold text-foreground">
                      ₹{cn.totals?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Unallocated Balance */}
                    <TableCell className="text-right font-mono text-xs">
                      {cn.unallocatedCredit > 0 ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          ₹{cn.unallocatedCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">₹0.00</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(cn.status)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild className="gap-2 text-xs">
                            <Link href={`/credit-notes/${cn._id}`}>
                              <Printer className="h-3.5 w-3.5 text-primary" />
                              View & Print Note
                            </Link>
                          </DropdownMenuItem>

                          {cn.unallocatedCredit > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCnForApply(cn);
                                  setIsApplyModalOpen(true);
                                }}
                                className="gap-2 text-xs font-medium text-purple-600 dark:text-purple-400"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                                Apply to Invoice
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCnForRefund(cn);
                                  setIsRefundModalOpen(true);
                                }}
                                className="gap-2 text-xs font-medium text-blue-600 dark:text-blue-400"
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                Record Refund
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground bg-muted/20">
          <span>
            Showing <strong className="text-foreground">{creditNotes.length}</strong> of{" "}
            <strong className="text-foreground">{listData?.total ?? creditNotes.length}</strong> Credit Notes
          </span>
          {listData?.totalPages && listData.totalPages > 1 && (
            <span>
              Page {listData.page} of {listData.totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Modals */}
      <IssueCreditNoteModal
        open={isIssueModalOpen}
        onOpenChange={setIsIssueModalOpen}
        onSuccess={() => refetch()}
      />

      <ApplyCreditModal
        open={isApplyModalOpen}
        onOpenChange={setIsApplyModalOpen}
        creditNote={selectedCnForApply}
        onSuccess={() => refetch()}
      />

      <RefundCreditModal
        open={isRefundModalOpen}
        onOpenChange={setIsRefundModalOpen}
        creditNote={selectedCnForRefund}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
