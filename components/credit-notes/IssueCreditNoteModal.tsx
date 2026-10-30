"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Trash2,
  Plus,
  AlertCircle,
  Receipt,
  FileMinus,
  IndianRupee,
} from "lucide-react";
import {
  useCreateCreditNoteMutation,
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "@/lib/services/api";
import { CreditNoteReason } from "@/lib/types/credit-note";

interface IssueCreditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedInvoiceId?: string;
  onSuccess?: (creditNoteId: string) => void;
}

interface EditableCreditItem {
  id: string;
  description: string;
  sacCode: string;
  quantity: number;
  rate: number;
  gstPercentage: number;
}

export function IssueCreditNoteModal({
  open,
  onOpenChange,
  preselectedInvoiceId,
  onSuccess,
}: IssueCreditNoteModalProps) {
  const [createCreditNote, { isLoading: isSubmitting }] =
    useCreateCreditNoteMutation();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    preselectedInvoiceId || ""
  );

  // If no preselected invoice, query finalized invoices
  const { data: invoicesData } = useGetInvoicesQuery(
    { page: 1, limit: 100 },
    { skip: !!preselectedInvoiceId || !open }
  );
  const eligibleInvoices = useMemo(() => {
    return (invoicesData?.invoices || []).filter(
      (inv: any) => inv.status !== "Draft" && inv.status !== "Cancelled"
    );
  }, [invoicesData]);

  // Load selected invoice detail
  const { data: invoiceDetail, isLoading: isLoadingInvoice } =
    useGetInvoiceByIdQuery(selectedInvoiceId, {
      skip: !selectedInvoiceId || !open,
    });

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState<CreditNoteReason>(
    "Overcharge Correction"
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableCreditItem[]>([]);

  // When invoice detail loads, populate line items
  useEffect(() => {
    if (invoiceDetail) {
      const initialItems: EditableCreditItem[] = (
        invoiceDetail.items || []
      ).map((item: any, idx: number) => ({
        id: item._id || String(idx),
        description: item.particulars || item.description || "Service",
        sacCode: item.sacCode || "998231",
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        gstPercentage: item.gstPercentage || 18,
      }));

      if (initialItems.length === 0) {
        initialItems.push({
          id: "default-1",
          description: "Service Fee Adjustment",
          sacCode: "998231",
          quantity: 1,
          rate: invoiceDetail.totals?.grandTotal || 0,
          gstPercentage: 18,
        });
      }

      setItems(initialItems);
    }
  }, [invoiceDetail]);

  useEffect(() => {
    if (preselectedInvoiceId) {
      setSelectedInvoiceId(preselectedInvoiceId);
    }
  }, [preselectedInvoiceId, open]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;

    items.forEach((item) => {
      const lineAmount = Math.round(item.quantity * item.rate * 100) / 100;
      const lineGst =
        Math.round(((lineAmount * item.gstPercentage) / 100) * 100) / 100;
      subtotal += lineAmount;
      taxTotal += lineGst;
      cgstTotal += Math.round((lineGst / 2) * 100) / 100;
      sgstTotal += Math.round((lineGst / 2) * 100) / 100;
    });

    const calculatedGrand = Math.round((subtotal + taxTotal) * 100) / 100;
    const roundOff =
      Math.round((Math.round(calculatedGrand) - calculatedGrand) * 100) / 100;
    const grandTotal = Math.round(calculatedGrand);

    return {
      subtotal,
      taxTotal,
      cgstTotal,
      sgstTotal,
      igstTotal: 0,
      roundOff,
      grandTotal,
    };
  }, [items]);

  const maxAllowableCredit = invoiceDetail?.totals?.grandTotal ?? 0;
  const isExceeding = calculatedTotals.grandTotal > maxAllowableCredit;

  const handleItemChange = (
    id: string,
    field: keyof EditableCreditItem,
    val: any
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        description: "Adjustment / Discount",
        sacCode: "998231",
        quantity: 1,
        rate: 0,
        gstPercentage: 18,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("At least one line item is required on the credit note");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !invoiceDetail) {
      toast.error("Please select a valid invoice");
      return;
    }

    if (calculatedTotals.grandTotal <= 0) {
      toast.error("Credit note total must be greater than zero");
      return;
    }

    if (isExceeding) {
      toast.error(
        `Credit note total (₹${calculatedTotals.grandTotal}) cannot exceed original invoice total (₹${maxAllowableCredit})`
      );
      return;
    }

    const clientId =
      typeof invoiceDetail.clientId === "object"
        ? invoiceDetail.clientId._id
        : invoiceDetail.clientId;

    try {
      const payloadItems = items.map((it) => {
        const amount = Math.round(it.quantity * it.rate * 100) / 100;
        const lineGst =
          Math.round(((amount * it.gstPercentage) / 100) * 100) / 100;
        return {
          description: it.description.trim(),
          sacCode: it.sacCode.trim() || undefined,
          quantity: it.quantity,
          rate: it.rate,
          amount,
          gstPercentage: it.gstPercentage,
          cgst: Math.round((lineGst / 2) * 100) / 100,
          sgst: Math.round((lineGst / 2) * 100) / 100,
          igst: 0,
          total: Math.round((amount + lineGst) * 100) / 100,
        };
      });

      const res = await createCreditNote({
        clientId,
        invoiceId: selectedInvoiceId,
        date,
        reason,
        items: payloadItems,
        totals: calculatedTotals,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success(
        `Credit Note ${res.creditNoteNo} issued successfully. Invoice balance adjusted.`
      );
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(res._id);
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to issue credit note"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <FileMinus className="h-5 w-5" />
              <DialogTitle>Issue Financial Credit Note</DialogTitle>
            </div>
            <DialogDescription>
              Create an immutable credit adjustment linked to an issued invoice with atomic balance reduction and running ledger sync.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Invoice Selection */}
            {!preselectedInvoiceId && (
              <div className="space-y-1.5">
                <Label htmlFor="invoiceSelect">
                  Select Original Invoice <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedInvoiceId}
                  onValueChange={setSelectedInvoiceId}
                >
                  <SelectTrigger id="invoiceSelect">
                    <SelectValue placeholder="Choose finalized invoice to credit" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {eligibleInvoices.map((inv: any) => (
                      <SelectItem key={inv._id} value={inv._id}>
                        {inv.invoiceNo} — {inv.clientId?.name || "Client"} (₹
                        {inv.totals?.grandTotal || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Invoice Context Banner */}
            {invoiceDetail && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">Original Invoice: </span>
                  <strong className="text-foreground">
                    {invoiceDetail.invoiceNo}
                  </strong>
                  <span className="text-muted-foreground ml-2">
                    ({new Date(invoiceDetail.date).toLocaleDateString("en-IN")})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Client: </span>
                  <strong className="text-foreground">
                    {typeof invoiceDetail.clientId === "object"
                      ? invoiceDetail.clientId.name
                      : "Client"}
                  </strong>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-muted-foreground">Invoice Total: </span>
                    <strong className="text-foreground">
                      ₹{invoiceDetail.totals?.grandTotal?.toLocaleString("en-IN") || 0}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Due: </span>
                    <strong className="text-amber-600 dark:text-amber-400">
                      ₹{invoiceDetail.totals?.amountDue?.toLocaleString("en-IN") || 0}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Date & Reason */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cnDate">Credit Note Date</Label>
                <Input
                  id="cnDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnReason">Reason for Credit</Label>
                <Select
                  value={reason}
                  onValueChange={(val) => setReason(val as CreditNoteReason)}
                >
                  <SelectTrigger id="cnReason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Overcharge Correction">
                      Overcharge Correction
                    </SelectItem>
                    <SelectItem value="Service Cancellation">
                      Service Cancellation
                    </SelectItem>
                    <SelectItem value="Goodwill Discount">
                      Goodwill Discount
                    </SelectItem>
                    <SelectItem value="Deficiency of Service">
                      Deficiency of Service
                    </SelectItem>
                    <SelectItem value="Other">Other Statutory Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Credited Line Items & Adjustments
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Row
                </Button>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="w-[90px]">SAC</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[110px]">Rate (₹)</TableHead>
                      <TableHead className="w-[90px]">GST %</TableHead>
                      <TableHead className="w-[110px] text-right">Amount (₹)</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const lineTotal =
                        Math.round(
                          (item.quantity *
                            item.rate *
                            (1 + item.gstPercentage / 100)) *
                            100
                        ) / 100;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="p-2">
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Service description"
                              className="h-8 text-xs"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={item.sacCode}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "sacCode",
                                  e.target.value
                                )
                              }
                              placeholder="SAC"
                              className="h-8 text-xs font-mono"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  "rate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 text-xs"
                              required
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={String(item.gstPercentage)}
                              onValueChange={(val) =>
                                handleItemChange(
                                  item.id,
                                  "gstPercentage",
                                  parseFloat(val)
                                )
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="12">12%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                                <SelectItem value="28">28%</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2 text-right font-medium text-xs font-mono">
                            ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="p-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="w-full sm:max-w-xs space-y-1.5">
                <Label htmlFor="cnNotes">Remarks / Audit Note</Label>
                <Textarea
                  id="cnNotes"
                  placeholder="e.g. Corrective credit agreed as per MCA billing review..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="w-full sm:w-64 space-y-1 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-mono">
                    ₹{calculatedTotals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">GST Total:</span>
                  <span className="font-mono">
                    ₹{calculatedTotals.taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t text-sm font-bold text-foreground">
                  <span>Grand Total:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">
                    ₹{calculatedTotals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {isExceeding && (
                  <div className="flex items-center gap-1.5 text-destructive text-[11px] font-medium pt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Exceeds original invoice total of ₹{maxAllowableCredit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isExceeding || !selectedInvoiceId}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? "Issuing..." : "Issue Credit Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
