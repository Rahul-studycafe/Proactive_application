"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  Send,
  Eye,
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  FileCheck,
  Clock,
  ArrowRight,
  ExternalLink,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetQuotationsQuery,
  useUpdateQuotationStatusMutation,
  useSendQuotationEmailMutation,
  useDeleteQuotationMutation,
} from "@/lib/services/api";
import {
  Quotation,
  QuotationStatus,
  GetQuotationsParams,
} from "@/lib/types/quotation";
import {
  QuotationStatusBadge,
  ConvertToInvoiceButton,
  QuotationPipelineFunnel,
  CreateQuotationModal,
} from "@/components/quotations";
import { withPermission } from "@/components/shared/withPermission";
import { Can } from "@/contexts/PermissionsContext";

function QuotationsPage() {
  const router = useRouter();

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals & Action States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quotation | null>(null);

  // RTK Query Mutations
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateQuotationStatusMutation();
  const [sendEmail, { isLoading: isSendingEmail }] =
    useSendQuotationEmailMutation();
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();

  const queryParams: GetQuotationsParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit,
    };
  }, [search, statusFilter, startDate, endDate, page]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetQuotationsQuery(queryParams);

  const quotations: Quotation[] = listData?.quotations || [];
  const total = listData?.total || 0;
  const totalPages = listData?.totalPages || 1;

  const handleStatusChange = async (
    quoteId: string,
    newStatus: "Draft" | "Sent" | "Accepted" | "Declined",
  ) => {
    try {
      await updateStatus({ id: quoteId, status: newStatus }).unwrap();
      toast.success(`Quotation status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.data?.message || err?.message || "An error occurred",
      });
    }
  };

  const handleSendEmail = async (quote: Quotation) => {
    try {
      const res = await sendEmail({ id: quote._id }).unwrap();
      toast.success(`Proposal email dispatched!`, {
        description: `Sent to client email address.`,
      });
    } catch (err: any) {
      toast.error("Failed to send quotation email", {
        description: err?.data?.message || err?.message || "An error occurred",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDelete) return;
    try {
      await deleteQuotation(quoteToDelete._id).unwrap();
      toast.success(
        `Quotation ${quoteToDelete.quotationNo} deleted successfully`,
      );
      setQuoteToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete quotation", {
        description: err?.data?.message || err?.message || "An error occurred",
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quotations & Pre-Sales Proposals
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Build itemized service estimates, track client approvals, and
            seamlessly convert won deals into active invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Can do="quotation:create">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Quotation
            </Button>
          </Can>
        </div>
      </div>

      {/* Pre-Sales Funnel & KPI Ribbon (F-110) */}
      <QuotationPipelineFunnel />

      {/* Filter Toolbar */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotation no, client name, PAN..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-9 text-xs w-36"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                className="h-9 text-xs w-36"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotations Master Data Table (F-106) */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-xs">
                <TableHead className="w-[14%] min-w-[130px]">Quote #</TableHead>
                <TableHead className="w-[20%] min-w-[180px]">Client</TableHead>
                <TableHead className="w-[12%] min-w-[110px]">Date</TableHead>
                <TableHead className="w-[12%] min-w-[110px]">
                  Valid Until
                </TableHead>
                <TableHead className="w-[16%] min-w-[140px]">
                  Items Summary
                </TableHead>
                <TableHead className="w-[12%] min-w-[110px] text-right">
                  Grand Total
                </TableHead>
                <TableHead className="w-[10%] min-w-[100px] text-center">
                  Status
                </TableHead>
                <TableHead className="w-[4%] min-w-[50px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j} className="py-3.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : quotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="p-3.5 rounded-2xl bg-muted text-muted-foreground">
                        <FileSpreadsheet className="h-8 w-8" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">
                          No Quotations Found
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {hasActiveFilters
                            ? "No proposals match your current filter parameters. Try clearing some filters."
                            : "Create your first pre-sales proposal to start closing deals faster."}
                        </p>
                      </div>
                      {hasActiveFilters ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetFilters}
                          className="text-xs"
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Can do="quotation:create">
                          <Button
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="text-xs gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create First Quotation
                          </Button>
                        </Can>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                quotations.map((quote) => {
                  const client =
                    typeof quote.clientId === "object" && quote.clientId
                      ? (quote.clientId as any)
                      : null;
                  const isConverted = quote.status === "Converted";

                  return (
                    <TableRow
                      key={quote._id}
                      className="text-xs hover:bg-muted/30 transition-colors group"
                    >
                      {/* Quotation No & Link */}
                      <TableCell className="font-mono font-bold text-foreground">
                        <Link
                          href={`/quotations/${quote._id}`}
                          className="hover:text-primary hover:underline flex items-center gap-1.5"
                        >
                          {quote.quotationNo}
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </TableCell>

                      {/* Client */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {client?.name || "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {client?.fileNo || client?.pan || "No ID"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground">
                        {formatDate(quote.date)}
                      </TableCell>

                      {/* Valid Until */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            {formatDate(quote.validUntil)}
                          </span>
                          {new Date(quote.validUntil) < new Date() &&
                            quote.status !== "Converted" &&
                            quote.status !== "Accepted" && (
                              <span className="text-[10px] text-destructive font-medium">
                                Expired
                              </span>
                            )}
                        </div>
                      </TableCell>

                      {/* Items Preview */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground truncate max-w-[150px]">
                            {quote.items?.[0]?.description || "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {quote.items?.length || 0} line{" "}
                            {quote.items?.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Grand Total */}
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatCurrency(quote.totals?.grandTotal || 0)}
                        <div className="text-[10px] font-normal text-muted-foreground">
                          Tax: {formatCurrency(quote.totals?.taxTotal || 0)}
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <QuotationStatusBadge status={quote.status} />
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Convert Button for Accepted or Sent */}
                          {(quote.status === "Accepted" ||
                            quote.status === "Sent") && (
                            <Can do="invoice:create">
                              <ConvertToInvoiceButton
                                quotation={quote}
                                size="sm"
                                showText={false}
                                className="h-7 w-7 p-0"
                              />
                            </Can>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 text-xs"
                            >
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/quotations/${quote._id}`)
                                }
                                className="cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                View / Print Proposal
                              </DropdownMenuItem>

                              <Can do="quotation:send">
                                <DropdownMenuItem
                                  onClick={() => handleSendEmail(quote)}
                                  className="cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  Send via Email
                                </DropdownMenuItem>
                              </Can>

                              {!isConverted && (
                                <Can do="quotation:edit">
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>
                                    Change Status
                                  </DropdownMenuLabel>
                                  {quote.status !== "Draft" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(quote._id, "Draft")
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Clock className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                      Mark as Draft
                                    </DropdownMenuItem>
                                  )}
                                  {quote.status !== "Sent" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(quote._id, "Sent")
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Send className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                      Mark as Sent
                                    </DropdownMenuItem>
                                  )}
                                  {quote.status !== "Accepted" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          quote._id,
                                          "Accepted",
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                      Mark as Accepted
                                    </DropdownMenuItem>
                                  )}
                                  {quote.status !== "Declined" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          quote._id,
                                          "Declined",
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      <XCircle className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                      Mark as Declined
                                    </DropdownMenuItem>
                                  )}
                                </Can>
                              )}

                              {!isConverted && (
                                <Can do="quotation:delete">
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setQuoteToDelete(quote)}
                                    className="text-destructive focus:text-destructive cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete Quotation
                                  </DropdownMenuItem>
                                </Can>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/80 text-xs text-muted-foreground">
            <div>
              Showing page{" "}
              <span className="font-semibold text-foreground">{page}</span> of{" "}
              <span className="font-semibold text-foreground">
                {totalPages}
              </span>{" "}
              ({total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Quotation Modal (F-107) */}
      <CreateQuotationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!quoteToDelete}
        onOpenChange={(op) => !op && setQuoteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Quotation {quoteToDelete?.quotationNo}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to permanently delete this quotation
              estimate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default withPermission(QuotationsPage, "quotation:view", {
  title: "Quotations Access Restricted",
  description:
    "You do not have permission to view quotations and proposals. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
