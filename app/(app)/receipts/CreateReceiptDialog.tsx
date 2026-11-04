"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Receipt,
  IndianRupee,
} from "lucide-react";
import {
  useGetClientsQuery,
  useGetUnpaidInvoicesQuery,
  useCreateReceiptMutation,
} from "@/lib/services/api";
import { toast } from "sonner";

interface CreateReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
}

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

export function CreateReceiptDialog({
  open,
  onOpenChange,
  defaultClientId,
}: CreateReceiptDialogProps) {
  const [clientId, setClientId] = useState<string>(defaultClientId || "");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [tdsAmount, setTdsAmount] = useState<number | "">(0);
  const [discountAmount, setDiscountAmount] = useState<number | "">(0);
  const [notes, setNotes] = useState<string>("");

  // Map of invoiceId -> settledAmount
  const [settlementMap, setSettlementMap] = useState<Record<string, number>>(
    {},
  );

  const { data: clientsData, isLoading: isLoadingClients } = useGetClientsQuery(
    {
      limit: 100,
    },
  );
  const clients = clientsData?.clients || [];

  const {
    data: unpaidInvoices = [],
    isLoading: isLoadingInvoices,
    isFetching: isFetchingInvoices,
  } = useGetUnpaidInvoicesQuery(clientId, {
    skip: !clientId,
  });

  const [createReceipt, { isLoading: isSubmitting }] =
    useCreateReceiptMutation();

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (defaultClientId) setClientId(defaultClientId);
      setDate(new Date().toISOString().split("T")[0]);
      setSettlementMap({});
    }
  }, [open, defaultClientId]);

  // When client changes, clear previous settlements
  const handleClientChange = (id: string) => {
    setClientId(id);
    setSettlementMap({});
  };

  const numTotal = typeof totalAmount === "number" ? totalAmount : 0;
  const numTds = typeof tdsAmount === "number" ? tdsAmount : 0;
  const numDiscount = typeof discountAmount === "number" ? discountAmount : 0;

  const totalCapacity = numTotal + numTds + numDiscount;

  // Calculate sum of settlements
  const totalSettled = useMemo(() => {
    return Object.values(settlementMap).reduce((acc, v) => acc + (v || 0), 0);
  }, [settlementMap]);

  const unallocatedAmount = Math.max(0, totalCapacity - totalSettled);
  const isOverAllocated = totalSettled > totalCapacity;

  // Auto-settle FIFO waterfall
  const handleAutoSettle = () => {
    if (totalCapacity <= 0) {
      toast.error("Please enter a total payment amount before auto-settling.");
      return;
    }
    if (!unpaidInvoices || unpaidInvoices.length === 0) {
      toast.info("No unpaid invoices available to settle for this client.");
      return;
    }

    let pool = totalCapacity;
    const newMap: Record<string, number> = {};

    for (const inv of unpaidInvoices) {
      if (pool <= 0) break;
      const due = inv.totals?.amountDue || 0;
      const allocate = Math.min(due, pool);
      if (allocate > 0) {
        newMap[inv._id] = allocate;
        pool -= allocate;
      }
    }

    setSettlementMap(newMap);
    toast.success(
      `Auto-allocated ${formatCurrency(totalCapacity - pool)} across ${
        Object.keys(newMap).length
      } invoice(s)`,
    );
  };

  const handleSettlementChange = (
    invoiceId: string,
    value: string,
    maxDue: number,
  ) => {
    const val = value === "" ? 0 : parseFloat(value);
    if (isNaN(val) || val < 0) return;
    if (val > maxDue) {
      toast.warning(
        `Cannot settle more than the due amount (${formatCurrency(maxDue)})`,
      );
      setSettlementMap((prev) => ({ ...prev, [invoiceId]: maxDue }));
      return;
    }
    setSettlementMap((prev) => ({ ...prev, [invoiceId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (!numTotal || numTotal <= 0) {
      toast.error(
        "Please enter a valid received payment amount greater than 0.",
      );
      return;
    }
    if (isOverAllocated) {
      toast.error(
        `Total allocated settlements (${formatCurrency(
          totalSettled,
        )}) exceed total payment capacity (${formatCurrency(totalCapacity)}).`,
      );
      return;
    }

    // Prepare settlements payload
    const settlements = Object.entries(settlementMap)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, settledAmount]) => ({
        invoiceId,
        settledAmount,
      }));

    try {
      await createReceipt({
        clientId,
        date,
        paymentMode,
        referenceNumber: referenceNumber.trim() || undefined,
        totalAmount: numTotal,
        tdsAmount: numTds,
        discountAmount: numDiscount,
        settlements,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success("Receipt recorded and invoices settled successfully!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to record payment receipt.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Record Payment Receipt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record payments received from clients and settle outstanding
                invoices atomically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Row 1: Client & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs font-semibold">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={clientId}
                onValueChange={handleClientChange}
                disabled={isLoadingClients || !!defaultClientId}
              >
                <SelectTrigger id="client" className="h-9">
                  <SelectValue placeholder="Select client..." />
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
              <Label htmlFor="date" className="text-xs font-semibold">
                Receipt Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9"
                required
              />
            </div>
          </div>

          {/* Row 2: Payment Mode & Ref */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="paymentMode" className="text-xs font-semibold">
                Payment Mode <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger id="paymentMode" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">
                    Bank Transfer (NEFT / RTGS / IMPS)
                  </SelectItem>
                  <SelectItem value="UPI">UPI / QR Code</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refNo" className="text-xs font-semibold">
                Reference / UTR / Cheque No.
              </Label>
              <Input
                id="refNo"
                placeholder="e.g. UTR123456789 or CHQ-00421"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Row 3: Financial Amounts (Total Amount, TDS, Discount) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border bg-muted/20 p-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="totalAmount"
                className="text-xs font-semibold text-foreground"
              >
                Amount Received (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="totalAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  className="pl-8 h-9 font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="tdsAmount"
                className="text-xs font-medium text-muted-foreground"
              >
                TDS Deducted (Sec 194J/C)
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tdsAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={tdsAmount}
                  onChange={(e) =>
                    setTdsAmount(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  className="pl-8 h-9 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="discountAmount"
                className="text-xs font-medium text-muted-foreground"
              >
                Settlement Discount
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  className="pl-8 h-9 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Allocation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  Invoice Allocation & Settlement
                </h4>
                <p className="text-xs text-muted-foreground">
                  Allocate this payment across outstanding invoices or save as
                  advance.
                </p>
              </div>

              {clientId && unpaidInvoices.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAutoSettle}
                  className="gap-1.5 text-xs h-8"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />{" "}
                  Auto-Settle (FIFO)
                </Button>
              )}
            </div>

            {!clientId ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                Select a client above to view their outstanding invoices.
              </div>
            ) : isLoadingInvoices || isFetchingInvoices ? (
              <div className="flex h-24 items-center justify-center rounded-xl border bg-muted/10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : unpaidInvoices.length === 0 ? (
              <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/30 p-4 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    No outstanding invoices for this client.
                  </p>
                  <p className="mt-0.5">
                    Any payment amount recorded will be safely credited as an
                    Advance balance in the client's ledger.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs">Invoice #</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs text-right">
                        Grand Total
                      </TableHead>
                      <TableHead className="text-xs text-right">
                        Current Due
                      </TableHead>
                      <TableHead className="text-xs text-right w-36">
                        Settling Now (₹)
                      </TableHead>
                      <TableHead className="text-xs text-center w-28">
                        New Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaidInvoices.map((inv: any) => {
                      const due = inv.totals?.amountDue || 0;
                      const settling = settlementMap[inv._id] || 0;
                      const remaining = Math.max(0, due - settling);
                      const willBePaid = settling >= due && due > 0;

                      return (
                        <TableRow key={inv._id}>
                          <TableCell className="font-mono text-xs font-medium">
                            {inv.invoiceNo}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(inv.date)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatCurrency(inv.totals?.grandTotal || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold text-destructive">
                            {formatCurrency(due)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={due}
                              step="0.01"
                              value={settlementMap[inv._id] ?? ""}
                              placeholder="0.00"
                              onChange={(e) =>
                                handleSettlementChange(
                                  inv._id,
                                  e.target.value,
                                  due,
                                )
                              }
                              className="h-8 text-right font-mono text-xs font-semibold"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {settling > 0 ? (
                              willBePaid ? (
                                <Badge className="text-[10px] bg-success/20 text-success border-success/30">
                                  Will be Paid
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] bg-blue-500/20 text-blue-500 border-blue-500/30">
                                  Partially Paid
                                </Badge>
                              )
                            ) : (
                              <span className="text-[11px] text-muted-foreground">
                                Unchanged
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Reconciliation Summary Footer */}
            {totalCapacity > 0 && (
              <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs ${
                  isOverAllocated
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "bg-muted/30"
                }`}
              >
                <div>
                  <span className="text-muted-foreground">
                    Total Capacity:{" "}
                  </span>
                  <span className="font-semibold font-mono">
                    {formatCurrency(totalCapacity)}
                  </span>
                  <span className="mx-2 text-muted-foreground">|</span>
                  <span className="text-muted-foreground">Allocated: </span>
                  <span className="font-semibold font-mono">
                    {formatCurrency(totalSettled)}
                  </span>
                </div>
                <div>
                  {isOverAllocated ? (
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Over-allocated by{" "}
                      {formatCurrency(totalSettled - totalCapacity)}
                    </span>
                  ) : unallocatedAmount > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Advance Credit: {formatCurrency(unallocatedAmount)}
                    </span>
                  ) : (
                    <span className="text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> 100% Fully
                      Settled
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-medium text-muted-foreground"
            >
              Internal Notes / Remarks
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g. Received via NEFT from client personal account..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-xs resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isOverAllocated}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Settle Receipt
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
