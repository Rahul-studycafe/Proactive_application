"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetExpensesQuery,
  useDeleteExpenseMutation,
  useGetExpenseCategoriesQuery,
} from "@/lib/services/api";
import { ClientExpense } from "@/lib/types/expenses";
import { AddExpenseModal } from "./AddExpenseModal";
import { ReceiptViewerDialog } from "./ReceiptViewerDialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Receipt,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  Layers,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface ClientExpensesTabProps {
  clientId: string;
  clientName?: string;
}

export function ClientExpensesTab({
  clientId,
  clientName,
}: ClientExpensesTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState<string>("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ClientExpense | null>(
    null,
  );

  const [previewExpense, setPreviewExpense] = useState<ClientExpense | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClientExpense | null>(null);

  // Queries
  const queryParams = useMemo(() => {
    return {
      clientId,
      search: search.trim() || undefined,
      categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      isBilled: billingFilter !== "all" ? billingFilter : undefined,
      limit: 100,
    };
  }, [clientId, search, categoryFilter, billingFilter]);

  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery(
    queryParams,
    {
      skip: !clientId,
    },
  );

  const { data: categories = [] } = useGetExpenseCategoriesQuery();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation();

  const expenses: ClientExpense[] = data?.expenses || [];
  const summary = data?.summary || {
    totalAmount: 0,
    billedAmount: 0,
    unbilledAmount: 0,
  };
  const totalCount = data?.pagination?.total || expenses.length;

  const recoveryRate =
    summary.totalAmount > 0
      ? Math.round((summary.billedAmount / summary.totalAmount) * 100)
      : 0;

  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp: ClientExpense) => {
    if (exp.isBilled) {
      toast.error(
        "Cannot edit an expense that has already been billed on an invoice",
      );
      return;
    }
    setEditingExpense(exp);
    setIsAddModalOpen(true);
  };

  const handleOpenPreview = (exp: ClientExpense) => {
    setPreviewExpense(exp);
    setIsPreviewOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteExpense(deleteTarget._id).unwrap();
      toast.success(`Expense ${deleteTarget.expenseNo} deleted successfully`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to delete expense",
      );
    }
  };

  // Helper for category badge styling
  const getCategoryBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("challan") || lower.includes("tax")) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium">
          {name}
        </Badge>
      );
    }
    if (
      lower.includes("stamping") ||
      lower.includes("court") ||
      lower.includes("legal")
    ) {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 font-medium">
          {name}
        </Badge>
      );
    }
    if (lower.includes("roc") || lower.includes("mca")) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 font-medium">
          {name}
        </Badge>
      );
    }
    if (lower.includes("travel") || lower.includes("conveyance")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium">
          {name}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-medium">
        {name}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Minimalist Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Receipt className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-foreground">
              {formatCurrency(summary.totalAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Total Outlays ({totalCount})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.billedAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Billed Recoveries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {formatCurrency(summary.unbilledAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Unbilled Exposure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {recoveryRate}%
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Recovery Rate
            </p>
          </div>
        </div>
      </div>

      {/* Main Expenses Container */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        {/* Toolbar Bar */}
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-muted/20">
          {/* Filters */}
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expense #, notes, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={billingFilter} onValueChange={setBillingFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Unbilled Only</SelectItem>
                <SelectItem value="true">Billed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 w-9 border-border"
              title="Refresh expenses"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Log Expense</span>
            </Button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[110px] text-xs font-semibold">
                  Expense #
                </TableHead>
                <TableHead className="w-[100px] text-xs font-semibold">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold">Amount</TableHead>
                <TableHead className="text-xs font-semibold">
                  Pay Mode
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Billing Status
                </TableHead>
                <TableHead className="text-xs font-semibold">Receipt</TableHead>
                <TableHead className="text-xs font-semibold">
                  Particulars / Notes
                </TableHead>
                <TableHead className="text-right text-xs font-semibold w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <span>Loading client expenses...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          No Expenses Logged
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Track statutory outlays, court fees, and challan
                          payments to easily recover them on invoices.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={handleOpenAdd}
                          className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Log First Expense</span>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((exp) => {
                  return (
                    <TableRow
                      key={exp._id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* Expense No */}
                      <TableCell className="align-middle">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {exp.expenseNo}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="align-middle text-xs text-muted-foreground">
                        {new Date(exp.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      {/* Category */}
                      <TableCell className="align-middle">
                        {getCategoryBadge(exp.categoryName)}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="align-middle font-bold text-sm text-foreground">
                        {formatCurrency(exp.amount)}
                      </TableCell>

                      {/* Payment Mode */}
                      <TableCell className="align-middle text-xs">
                        <span className="text-muted-foreground">
                          {exp.paymentMode}
                        </span>
                        {exp.paidFromAccount && (
                          <span className="block text-[10px] text-muted-foreground/70 truncate max-w-[120px]">
                            {exp.paidFromAccount}
                          </span>
                        )}
                      </TableCell>

                      {/* Billing Status */}
                      <TableCell className="align-middle">
                        {exp.isBilled ? (
                          <div className="space-y-0.5">
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                              Billed
                            </Badge>
                            {exp.invoiceId && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {typeof exp.invoiceId === "object"
                                  ? exp.invoiceId.invoiceNo
                                  : "Invoiced"}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                            Unbilled
                          </Badge>
                        )}
                      </TableCell>

                      {/* Receipt Attachment */}
                      <TableCell className="align-middle">
                        {exp.receiptFileUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPreview(exp)}
                            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 gap-1 hover:bg-blue-500/10"
                            title="Preview receipt attachment"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span>Receipt</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Particulars / Notes */}
                      <TableCell className="align-middle max-w-[200px]">
                        {exp.notes ? (
                          <p
                            className="text-xs text-muted-foreground line-clamp-2"
                            title={exp.notes}
                          >
                            {exp.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 italic">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenPreview(exp)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View receipt voucher"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(exp)}
                            disabled={exp.isBilled}
                            className={`h-8 w-8 ${
                              exp.isBilled
                                ? "opacity-30 cursor-not-allowed"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                            title={
                              exp.isBilled
                                ? "Billed expenses cannot be edited"
                                : "Edit outlay"
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(exp)}
                            disabled={exp.isBilled}
                            className={`h-8 w-8 ${
                              exp.isBilled
                                ? "opacity-30 cursor-not-allowed"
                                : "text-muted-foreground hover:text-destructive"
                            }`}
                            title={
                              exp.isBilled
                                ? "Billed expenses cannot be deleted"
                                : "Delete outlay"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        defaultClientId={clientId}
        defaultClientName={clientName}
        expenseToEdit={editingExpense}
      />

      {/* Receipt Viewer Dialog */}
      <ReceiptViewerDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        expense={previewExpense}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Expense Outlay?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to permanently delete outlay{" "}
              <strong className="text-foreground">
                {deleteTarget?.expenseNo}
              </strong>{" "}
              ({formatCurrency(deleteTarget?.amount || 0)} •{" "}
              {deleteTarget?.categoryName})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Expense"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
