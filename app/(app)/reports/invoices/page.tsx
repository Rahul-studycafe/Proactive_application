"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  IndianRupee,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInvoicesReportQuery } from "@/lib/services/api";
import {
  ReportLayout,
  ReportFilterBar,
  ExcelExportButton,
  type ReportFilterValues,
} from "@/components/reports";
import { withPermission } from "@/components/shared/withPermission";

function InvoicesReportPage() {
  const [filters, setFilters] = useState<ReportFilterValues>({
    datePreset: "this-month",
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = useMemo(() => {
    return {
      clientId: filters.clientId,
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page,
      limit,
    };
  }, [filters, page]);

  const { data, isLoading, isFetching, refetch } =
    useGetInvoicesReportQuery(queryParams);

  const summary = data?.summary || {
    totalInvoiced: 0,
    totalTaxable: 0,
    totalDiscount: 0,
    totalTax: 0,
    totalPaid: 0,
    totalDue: 0,
    invoiceCount: 0,
  };

  const invoices = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const statusOptions = [
    { label: "Unpaid", value: "Unpaid" },
    { label: "Partially Paid", value: "Partially Paid" },
    { label: "Paid", value: "Paid" },
    { label: "Cancelled", value: "Cancelled" },
  ];

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

  const recoveryRate =
    summary.totalInvoiced > 0
      ? Math.round((summary.totalPaid / summary.totalInvoiced) * 100)
      : 0;

  return (
    <ReportLayout
      title="Invoices & Financial Revenue Report"
      subtitle="Comprehensive audit of professional fee billings, taxable fee yields, output GST liability, and cash collections."
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
            reportType="invoices"
            queryParams={queryParams}
            fileName={`invoices-report-${new Date().toISOString().split("T")[0]}.xlsx`}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Invoiced */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Invoiced
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono mt-1">
                {formatCurrency(summary.totalInvoiced)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.invoiceCount} invoices issued
              </p>
            </CardContent>
          </Card>

          {/* Total Collections */}
          <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Collected
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                {formatCurrency(summary.totalPaid)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bank receipts & remittances
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Due */}
          <Card className="border border-rose-500/30 bg-rose-500/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Outstanding Due
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300 font-mono mt-1">
                {formatCurrency(summary.totalDue)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pending collection
              </p>
            </CardContent>
          </Card>

          {/* Total GST Output */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Output GST Tax
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono mt-1">
                {formatCurrency(summary.totalTax)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                On ₹{formatCurrency(summary.totalTaxable)} taxable
              </p>
            </CardContent>
          </Card>

          {/* Recovery Rate */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recovery Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold tracking-tight text-primary font-mono">
                  {recoveryRate}%
                </h3>
              </div>
              <Progress
                value={recoveryRate}
                className="h-1.5 mt-2 bg-primary/20"
              />
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <ReportFilterBar
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          showClientFilter
          showStatusFilter
          statusOptions={statusOptions}
        />

        {/* Invoices Table */}
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-[14%] min-w-[130px]">
                    Invoice #
                  </TableHead>
                  <TableHead className="w-[12%] min-w-[100px]">Date</TableHead>
                  <TableHead className="w-[22%] min-w-[180px]">
                    Client & GSTIN
                  </TableHead>
                  <TableHead className="w-[12%] min-w-[100px] text-right">
                    Taxable (₹)
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[85px] text-right">
                    GST (₹)
                  </TableHead>
                  <TableHead className="w-[12%] min-w-[100px] text-right">
                    Grand Total
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[90px] text-right">
                    Due (₹)
                  </TableHead>
                  <TableHead className="w-[8%] min-w-[80px] text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground/60" />
                        <h4 className="font-semibold text-foreground">
                          No Invoices Match Filters
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your date range or payment status
                          parameters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow
                      key={inv._id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="font-mono font-bold text-foreground">
                        <Link
                          href={`/view-invoice/${inv._id}`}
                          className="hover:text-primary hover:underline flex items-center gap-1"
                        >
                          {inv.invoiceNo}
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.date)}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {inv.client?.name || "Client Name"}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {inv.client?.gstin || "Unregistered"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatCurrency(inv.totals?.totalTaxable || 0)}
                      </TableCell>

                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatCurrency(inv.totals?.totalGst || 0)}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatCurrency(inv.totals?.grandTotal || 0)}
                      </TableCell>

                      <TableCell
                        className={`text-right font-mono font-semibold ${
                          (inv.totals?.amountDue || 0) > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(inv.totals?.amountDue || 0)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${
                            inv.status === "Paid"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : inv.status === "Partially Paid"
                                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                : inv.status === "Unpaid"
                                  ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
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
                </span>{" "}
                ({pagination.total} total invoices)
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

export default withPermission(InvoicesReportPage, "report:view", {
  title: "Reports Access Restricted",
  description:
    "You do not have permission to view analytical practice reports. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
