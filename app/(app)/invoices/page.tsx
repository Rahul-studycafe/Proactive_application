"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Pencil,
  Ban,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetInvoicesQuery,
  useCancelInvoiceMutation,
} from "@/lib/services/api";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
type InvoiceStatus = "Draft" | "Unpaid" | "Partially Paid" | "Paid" | "Cancelled";

// ─── Status badge styling ───────────────────────────────────────
const statusStyle: Record<InvoiceStatus, string> = {
  Paid: "border-success/30 bg-success/10 text-success",
  Unpaid: "border-warning/30 bg-warning/15 text-warning-foreground",
  "Partially Paid": "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Draft: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

// ─── Helper ─────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Main Page ──────────────────────────────────────────────────
export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const queryParams: Record<string, any> = { page, limit: 10 };
  if (statusFilter !== "all") queryParams.status = statusFilter;

  const { data, isLoading, isFetching } = useGetInvoicesQuery(queryParams);
  const [cancelInvoice] = useCancelInvoiceMutation();

  const invoices = data?.invoices ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, pages: 1 };

  // Filter by search term client-side (on current page results)
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const q = searchTerm.toLowerCase();
    return invoices.filter(
      (inv: any) =>
        inv.invoiceNo?.toLowerCase().includes(q) ||
        inv.clientId?.name?.toLowerCase().includes(q)
    );
  }, [invoices, searchTerm]);

  const handleCancel = useCallback(
    async (id: string, invoiceNo?: string) => {
      if (
        !confirm(
          `Are you sure you want to cancel invoice ${invoiceNo || ""}? This will un-bill all linked tasks.`
        )
      ) {
        return;
      }
      try {
        await cancelInvoice(id).unwrap();
        toast.success(`Invoice ${invoiceNo || ""} cancelled successfully`);
      } catch (e: any) {
        toast.error(e?.data?.message || "Failed to cancel invoice");
      }
    },
    [cancelInvoice]
  );

  return (
    <div className="space-y-5">
      {/* ─── Header: Title + New Invoice Button ──────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${pagination.total} total · ${filtered.length} shown`}
          </p>
        </div>

        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Link>
        </Button>
      </div>

      {/* ─── Search & Filter Bar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice no, client name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Invoices Table ─────────────────────────────────── */}
      <div className="rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv: any) => (
                <TableRow key={inv._id} className="group">
                  <TableCell className="font-mono text-xs font-semibold">
                    <Link
                      href={`/view-invoice/${inv._id}`}
                      className="text-primary hover:underline hover:text-primary/80 transition-colors"
                      title="View invoice"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.clientId?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(inv.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusStyle[inv.status as InvoiceStatus] ?? ""}
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(inv.totals?.grandTotal ?? 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(inv.totals?.amountDue ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="View invoice"
                      >
                        <Link href={`/view-invoice/${inv._id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {inv.status === "Draft" && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit draft"
                        >
                          <Link href={`/invoices/new?id=${inv._id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                      {(inv.status === "Draft" || inv.status === "Unpaid") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Cancel invoice"
                          onClick={() => handleCancel(inv._id, inv.invoiceNo)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* ─── Pagination ───────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
              invoices)
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= pagination.pages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
