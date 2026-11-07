"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetClientsQuery,
  useGetBillingEntitiesQuery,
  useGetInvoiceByIdQuery,
  useGetUnbilledTasksQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
} from "@/lib/services/api";
import { toast } from "sonner";
import { UnbilledExpensesAccordion } from "@/components/expenses";
import { UnbilledExpenseItem } from "@/lib/types/expenses";
import { withPermission } from "@/components/shared/withPermission";

interface InvoiceItem {
  referenceType: "Task" | "Expense" | "Manual";
  referenceId?: string;
  particulars: string;
  sacCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  gstPercentage: number;
  taxableAmount?: number;
  gstAmount?: number;
  total?: number;
}

function formatCurrency(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function TotalRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("id") || undefined;
  const isEdit = !!invoiceId;

  // Fetch clients for dropdown
  const { data: clientsData, isLoading: loadingClients } = useGetClientsQuery({
    limit: 200,
  });
  const clients = clientsData?.clients ?? [];

  // Fetch billing entities for branch context
  const { data: billingEntities = [], isLoading: loadingEntities } =
    useGetBillingEntitiesQuery();

  // Fetch existing invoice if editing
  const { data: existingInvoice, isLoading: loadingInvoice } =
    useGetInvoiceByIdQuery(invoiceId!, { skip: !invoiceId });

  const [billingEntityId, setBillingEntityId] = useState("");
  const [clientId, setClientId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saveAsStatus, setSaveAsStatus] = useState<"Draft" | "Unpaid">(
    "Unpaid",
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      referenceType: "Manual",
      particulars: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      gstPercentage: 18,
    },
  ]);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingInvoice && isEdit) {
      const inv = existingInvoice;
      setClientId(inv.clientId?._id || inv.clientId || "");
      setInvoiceDate(
        inv.date ? new Date(inv.date).toISOString().slice(0, 10) : "",
      );
      setDueDate(
        inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "",
      );
      setNotes(inv.notes || "");
      setSaveAsStatus(inv.status || "Draft");
      if (inv.billingEntityId) {
        setBillingEntityId(inv.billingEntityId._id || inv.billingEntityId);
      }
      if (inv.items?.length) {
        setItems(
          inv.items.map((it: any) => ({
            referenceType: it.referenceType || "Manual",
            referenceId: it.referenceId,
            particulars: it.particulars || "",
            sacCode: it.sacCode,
            quantity: it.quantity ?? 1,
            rate: it.rate ?? 0,
            discount: it.discount ?? 0,
            gstPercentage: it.gstPercentage ?? 18,
          })),
        );
      }
    }
  }, [existingInvoice, isEdit]);

  // Auto-set first client if not set and not editing
  useEffect(() => {
    if (!clientId && clients.length > 0 && !isEdit) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId, isEdit]);

  // Auto-set billing entity from active localStorage context or default
  useEffect(() => {
    if (!billingEntityId && billingEntities.length > 0 && !isEdit) {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("activeBillingEntityId")
          : null;
      const found = billingEntities.find((b: any) => b._id === stored);
      if (found) {
        setBillingEntityId(found._id);
      } else {
        const def =
          billingEntities.find((b: any) => b.isDefault) || billingEntities[0];
        if (def) setBillingEntityId(def._id);
      }
    }
  }, [billingEntities, billingEntityId, isEdit]);

  // Fetch unbilled tasks for selected client
  const { data: unbilledTasks } = useGetUnbilledTasksQuery(clientId, {
    skip: !clientId,
  });

  const [createInvoice, { isLoading: creating }] = useCreateInvoiceMutation();
  const [updateInvoice, { isLoading: updating }] = useUpdateInvoiceMutation();

  const isSaving = creating || updating;

  // Totals calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    items.forEach((it) => {
      const lineSub = it.quantity * it.rate;
      const disc = it.discount ?? 0;
      const taxable = lineSub - disc;
      const gst = (taxable * it.gstPercentage) / 100;
      subtotal += lineSub;
      totalDiscount += disc;
      totalTaxable += taxable;
      totalGst += gst;
    });
    const grandTotalRaw = totalTaxable + totalGst;
    const grandTotal = Math.round(grandTotalRaw);
    const roundOff = grandTotal - grandTotalRaw;
    return {
      subtotal,
      totalDiscount,
      totalTaxable,
      totalGst,
      roundOff,
      grandTotal,
    };
  }, [items]);

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => {
    setItems((p) => [
      ...p,
      {
        referenceType: "Manual",
        particulars: "",
        quantity: 1,
        rate: 0,
        discount: 0,
        gstPercentage: 18,
      },
    ]);
  };

  const removeItem = (idx: number) =>
    setItems((p) => p.filter((_, i) => i !== idx));

  const addUnbilledTask = (task: any) => {
    if (items.some((it) => it.referenceId === task._id)) return;

    // Resolve service name and period label
    const serviceName =
      task.serviceId?.name || task.title || task.description || "Task";
    const periodLabel = task.period?.label;
    const fullParticulars = periodLabel
      ? `${serviceName} - ${periodLabel}`
      : serviceName;
    const taskRate = task.billingAmount || task.billableAmount || 0;
    const gstPct = task.serviceId?.gstPercentage ?? 18;
    const sacCode = task.serviceId?.sacCode || "";

    const newItem: InvoiceItem = {
      referenceType: "Task" as const,
      referenceId: task._id,
      particulars: fullParticulars,
      sacCode,
      quantity: 1,
      rate: taskRate,
      discount: 0,
      gstPercentage: gstPct,
    };

    setItems((prev) => {
      // If there is only one empty placeholder line, replace it cleanly
      if (
        prev.length === 1 &&
        !prev[0].particulars.trim() &&
        prev[0].rate === 0
      ) {
        return [newItem];
      }
      return [...prev, newItem];
    });
  };

  const addUnbilledExpense = (exp: UnbilledExpenseItem) => {
    if (items.some((it) => it.referenceId === exp._id)) return;
    setItems((p) => [
      ...p,
      {
        referenceType: "Expense" as const,
        referenceId: exp._id,
        particulars: exp.particulars,
        quantity: 1,
        rate: exp.amount ?? 0,
        discount: 0,
        gstPercentage: 0, // Out-of-pocket client outlay recoveries are non-taxable / pure reimbursement
      },
    ]);
  };

  const addAllUnbilledExpenses = (exps: UnbilledExpenseItem[]) => {
    const newItems = exps
      .filter((exp) => !items.some((it) => it.referenceId === exp._id))
      .map((exp) => ({
        referenceType: "Expense" as const,
        referenceId: exp._id,
        particulars: exp.particulars,
        quantity: 1,
        rate: exp.amount ?? 0,
        discount: 0,
        gstPercentage: 0,
      }));

    if (newItems.length > 0) {
      setItems((p) => [...p, ...newItems]);
      toast.success(`Added ${newItems.length} unbilled outlay(s) to invoice`);
    }
  };

  const handleSave = async () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (items.length === 0 || items.every((it) => !it.particulars.trim())) {
      toast.error("Please add at least one line item");
      return;
    }

    const payload = {
      clientId,
      billingEntityId: billingEntityId || undefined,
      date: new Date(invoiceDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      notes: notes || undefined,
      status: saveAsStatus,
      items: items.map((it) => ({
        referenceType: it.referenceType,
        referenceId: it.referenceId || undefined,
        particulars: it.particulars,
        sacCode: it.sacCode || undefined,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount,
        gstPercentage: it.gstPercentage,
      })),
    };

    try {
      if (isEdit && invoiceId) {
        await updateInvoice({ id: invoiceId, ...payload }).unwrap();
        toast.success("Invoice updated successfully");
      } else {
        const res = await createInvoice(payload).unwrap();
        toast.success(
          `Invoice ${res?.invoice?.invoiceNo || ""} created successfully`,
        );
      }
      router.push("/invoices");
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to save invoice");
    }
  };

  if (isEdit && loadingInvoice) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Breadcrumbs
        items={[
          { label: "Invoices", href: "/invoices" },
          { label: isEdit ? "Edit Invoice" : "New Invoice" },
        ]}
      />

      {/* ─── Page Title Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit Draft Invoice" : "New Invoice"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update draft invoice details, items, and taxes."
              : "Generate a new invoice for client services and tasks."}
          </p>
        </div>
      </div>

      {/* ─── Invoice Form Card ─────────────────────────────────── */}
      <div className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
        {/* Header Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Billing Branch / Entity</Label>
            <Select
              value={billingEntityId}
              onValueChange={setBillingEntityId}
              disabled={isEdit || loadingEntities}
            >
              <SelectTrigger>
                <SelectValue placeholder="Default Branch" />
              </SelectTrigger>
              <SelectContent>
                {billingEntities.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.branchName || b.name}{" "}
                    {b.stateCode ? `(${b.stateCode})` : ""}
                    {b.isDefault ? " (Default)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select
              value={clientId}
              onValueChange={setClientId}
              disabled={isEdit || loadingClients}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} {c.fileNo ? `(${c.fileNo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Invoice Date</Label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Save As</Label>
            <Select
              value={saveAsStatus}
              onValueChange={(v) => setSaveAsStatus(v as "Draft" | "Unpaid")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Unpaid">Unpaid (Finalize)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Unbilled Tasks Quick-Add */}
        {unbilledTasks && unbilledTasks.length > 0 && (
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="mb-2 text-sm font-medium text-primary">
              Unbilled Completed Tasks ({unbilledTasks.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {unbilledTasks.map((task: any) => {
                const alreadyAdded = items.some(
                  (it) => it.referenceId === task._id,
                );
                const serviceName =
                  task.serviceId?.name ||
                  task.title ||
                  task.description ||
                  "Task";
                const periodLabel = task.period?.label;
                const taskAmount =
                  task.billingAmount || task.billableAmount || 0;
                const buttonLabel = periodLabel
                  ? `${serviceName} (${periodLabel})`
                  : serviceName;

                return (
                  <Button
                    key={task._id}
                    variant={alreadyAdded ? "secondary" : "outline"}
                    size="sm"
                    disabled={alreadyAdded}
                    onClick={() => addUnbilledTask(task)}
                    className="text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {buttonLabel}
                    {taskAmount ? ` (${formatCurrency(taskAmount)})` : ""}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Unbilled Client Outlays & Reimbursable Expenses (F-104) */}
        <UnbilledExpensesAccordion
          clientId={clientId}
          alreadyAddedExpenseIds={items
            .filter((it) => it.referenceType === "Expense" && it.referenceId)
            .map((it) => it.referenceId!)}
          onAddExpense={addUnbilledExpense}
          onAddAllExpenses={addAllUnbilledExpenses}
        />

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Particulars</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-28">Rate</TableHead>
                <TableHead className="w-24">Disc.</TableHead>
                <TableHead className="w-20">GST %</TableHead>
                <TableHead className="w-28 text-right">Taxable</TableHead>
                <TableHead className="w-28 text-right">Total</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, idx) => {
                const lineSub = it.quantity * it.rate;
                const taxable = lineSub - (it.discount ?? 0);
                const gst = (taxable * it.gstPercentage) / 100;
                const lineTotal = taxable + gst;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {it.referenceType === "Task" && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] shrink-0"
                          >
                            Task
                          </Badge>
                        )}
                        <Input
                          value={it.particulars}
                          placeholder="Description"
                          onChange={(e) =>
                            updateItem(idx, { particulars: e.target.value })
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(idx, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={it.rate}
                        onChange={(e) =>
                          updateItem(idx, { rate: Number(e.target.value) || 0 })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={it.discount}
                        onChange={(e) =>
                          updateItem(idx, {
                            discount: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={it.gstPercentage}
                        onChange={(e) =>
                          updateItem(idx, {
                            gstPercentage: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                      {formatCurrency(taxable)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(lineTotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Footer: Add Line + Notes + Totals */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <Button variant="outline" onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Line
            </Button>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="w-80 space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
            <TotalRow label="Subtotal" value={totals.subtotal} />
            {totals.totalDiscount > 0 && (
              <TotalRow label="Discount" value={-totals.totalDiscount} />
            )}
            <TotalRow label="Taxable" value={totals.totalTaxable} />
            <TotalRow label="GST" value={totals.totalGst} />
            {Math.abs(totals.roundOff) > 0.005 && (
              <TotalRow label="Round Off" value={totals.roundOff} />
            )}
            <div className="border-t pt-2">
              <TotalRow label="Grand Total" value={totals.grandTotal} bold />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button asChild variant="outline">
            <Link href="/invoices">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Invoice" : "Save Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewInvoiceContent />
    </Suspense>
  );
}

export default withPermission(
  NewInvoicePage,
  ["invoice:create", "invoice:edit"],
  {
    title: "Invoice Access Restricted",
    description:
      "You do not have permission to create or edit invoices. Please contact your Practice Administrator.",
    backHref: "/invoices",
    backLabel: "Return to Invoices",
  },
);
