"use client";

import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Building2,
  FileText,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetDebtorsAgingReportQuery,
  useGetClientsQuery,
} from "@/lib/services/api";
import {
  ReportLayout,
  DebtorsAgingCard,
  ExcelExportButton,
} from "@/components/reports";
import { DebtorsAgingItem } from "@/lib/types/report";
import { withPermission } from "@/components/shared/withPermission";

function DebtorsAgingReportPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const limit = 20;

  const { data: clientsData } = useGetClientsQuery({ limit: 150 });
  const clients = clientsData?.clients || [];

  const queryParams = useMemo(() => {
    return {
      clientId: selectedClientId !== "all" ? selectedClientId : undefined,
      page,
      limit,
    };
  }, [selectedClientId, page]);

  const { data, isLoading, isFetching, refetch } =
    useGetDebtorsAgingReportQuery(queryParams);

  const summary = data?.summary || {
    totalOutstanding: 0,
    totalCurrent0_30: 0,
    totalOverdue31_60: 0,
    totalCritical61_90: 0,
    totalDelinquent90Plus: 0,
    totalDebtorsCount: 0,
  };

  const rawDebtors: DebtorsAgingItem[] = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Client-side quick search filter
  const debtors = useMemo(() => {
    if (!search.trim()) return rawDebtors;
    const q = search.toLowerCase();
    return rawDebtors.filter(
      (d) =>
        d.clientName?.toLowerCase().includes(q) ||
        d.pan?.toLowerCase().includes(q) ||
        d.mobile?.includes(q),
    );
  }, [rawDebtors, search]);

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  return (
    <ReportLayout
      title="Debtors Aging (0–90+ Days) Matrix"
      subtitle="Stratify unpaid client fees across 0-30, 31-60, 61-90, and 90+ days aging buckets to mitigate bad debt risks."
      activeCategory="Financial"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <ExcelExportButton
            reportType="debtors-aging"
            queryParams={queryParams}
            fileName={`debtors-aging-report-${new Date().toISOString().split("T")[0]}.xlsx`}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* 4 Colored Bucket Cards & Visual Distribution Bar (F-114) */}
        <DebtorsAgingCard summary={summary} />

        {/* Filter Bar */}
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search debtor name, PAN, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <div className="w-48">
              <Select
                value={selectedClientId}
                onValueChange={(val) => {
                  setSelectedClientId(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedClientId !== "all" || search.trim() !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedClientId("all");
                setSearch("");
                setPage(1);
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Debtors Matrix Table */}
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-[4%]"></TableHead>
                  <TableHead className="w-[24%] min-w-[180px]">
                    Debtor Client
                  </TableHead>
                  <TableHead className="w-[14%] min-w-[110px] text-right">
                    Total Due
                  </TableHead>
                  <TableHead className="w-[13%] min-w-[100px] text-right text-emerald-600 dark:text-emerald-400">
                    0–30 Days
                  </TableHead>
                  <TableHead className="w-[13%] min-w-[100px] text-right text-amber-600 dark:text-amber-400">
                    31–60 Days
                  </TableHead>
                  <TableHead className="w-[13%] min-w-[100px] text-right text-orange-600 dark:text-orange-400">
                    61–90 Days
                  </TableHead>
                  <TableHead className="w-[13%] min-w-[100px] text-right text-rose-600 dark:text-rose-400">
                    90+ Days
                  </TableHead>
                  <TableHead className="w-[6%] min-w-[60px] text-center">
                    Invoices
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : debtors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                        <Clock className="h-8 w-8 text-muted-foreground/60" />
                        <h4 className="font-semibold text-foreground">
                          No Debtors with Pending Dues
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Excellent! All client billing receivables are fully
                          settled.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  debtors.map((debtor) => {
                    const isExpanded = expandedClientId === debtor.clientId;

                    return (
                      <Fragment key={debtor.clientId}>
                        <TableRow
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => toggleExpand(debtor.clientId)}
                        >
                          <TableCell className="p-2 text-center text-muted-foreground">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">
                                {debtor.clientName || "Client"}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {debtor.pan ? `PAN: ${debtor.pan}` : "No PAN"}
                                {debtor.mobile ? ` • ${debtor.mobile}` : ""}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-foreground">
                            {formatCurrency(debtor.totalDue)}
                          </TableCell>

                          <TableCell className="text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                            {debtor.bucket0_30 > 0
                              ? formatCurrency(debtor.bucket0_30)
                              : "—"}
                          </TableCell>

                          <TableCell className="text-right font-mono font-medium text-amber-700 dark:text-amber-400">
                            {debtor.bucket31_60 > 0
                              ? formatCurrency(debtor.bucket31_60)
                              : "—"}
                          </TableCell>

                          <TableCell className="text-right font-mono font-medium text-orange-700 dark:text-orange-400">
                            {debtor.bucket61_90 > 0
                              ? formatCurrency(debtor.bucket61_90)
                              : "—"}
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                            {debtor.bucket90Plus > 0
                              ? formatCurrency(debtor.bucket90Plus)
                              : "—"}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono"
                            >
                              {debtor.invoicesCount} inv
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Sub-table for Unpaid Invoices */}
                        {isExpanded &&
                          debtor.invoices &&
                          debtor.invoices.length > 0 && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={8} className="p-3 pl-10">
                                <div className="rounded-lg border border-border/80 bg-card p-3 space-y-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                                    Unpaid Invoices for {debtor.clientName}
                                  </span>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader className="bg-muted/50 text-[11px]">
                                        <TableRow>
                                          <TableHead>Invoice #</TableHead>
                                          <TableHead>Due Date</TableHead>
                                          <TableHead className="text-center">
                                            Days Overdue
                                          </TableHead>
                                          <TableHead className="text-right">
                                            Amount Due
                                          </TableHead>
                                          <TableHead className="text-center">
                                            Status
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody className="text-xs">
                                        {debtor.invoices.map((inv, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell className="font-mono font-bold text-foreground">
                                              {inv.invoiceNo}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                              {formatDate(inv.dueDate)}
                                            </TableCell>
                                            <TableCell className="text-center font-mono">
                                              {inv.daysOverdue > 90 ? (
                                                <Badge
                                                  variant="outline"
                                                  className="border-rose-400 bg-rose-50 text-rose-700 text-[10px] font-bold"
                                                >
                                                  {inv.daysOverdue} days
                                                </Badge>
                                              ) : inv.daysOverdue > 60 ? (
                                                <Badge
                                                  variant="outline"
                                                  className="border-orange-400 bg-orange-50 text-orange-700 text-[10px] font-bold"
                                                >
                                                  {inv.daysOverdue} days
                                                </Badge>
                                              ) : inv.daysOverdue > 30 ? (
                                                <Badge
                                                  variant="outline"
                                                  className="border-amber-400 bg-amber-50 text-amber-700 text-[10px]"
                                                >
                                                  {inv.daysOverdue} days
                                                </Badge>
                                              ) : (
                                                <span className="text-emerald-600 font-medium">
                                                  {inv.daysOverdue} days
                                                  (Current)
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold text-foreground">
                                              {formatCurrency(inv.amountDue)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                              >
                                                {inv.status}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 border-t border-border/80 text-xs text-muted-foreground">
              <div>
                Showing page{" "}
                <span className="font-semibold text-foreground">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {pagination.totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ReportLayout>
  );
}

export default withPermission(DebtorsAgingReportPage, "report:view", {
  title: "Debtors Aging Report Restricted",
  description:
    "You do not have permission to view debtors aging analysis reports. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
