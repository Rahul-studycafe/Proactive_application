"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import {
  useApplyUnallocatedCreditMutation,
  useGetUnpaidInvoicesQuery,
} from "@/lib/services/api";
import { CreditNote } from "@/lib/types/credit-note";

interface ApplyCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditNote: CreditNote | null;
  onSuccess?: () => void;
}

export function ApplyCreditModal({
  open,
  onOpenChange,
  creditNote,
  onSuccess,
}: ApplyCreditModalProps) {
  const [applyCredit, { isLoading: isApplying }] =
    useApplyUnallocatedCreditMutation();

  const clientId =
    typeof creditNote?.clientId === "object"
      ? creditNote.clientId._id
      : creditNote?.clientId || "";

  const { data: unpaidInvoices = [], isLoading: isLoadingInvoices } =
    useGetUnpaidInvoicesQuery(clientId, {
      skip: !clientId || !open,
    });

  const [targetInvoiceId, setTargetInvoiceId] = useState("");
  const [amountToApply, setAmountToApply] = useState<number>(0);

  const selectedInvoice = (unpaidInvoices as any[]).find(
    (inv: any) => inv._id === targetInvoiceId,
  );

  const availableCredit = creditNote?.unallocatedCredit || 0;
  const maxCanApply = selectedInvoice
    ? Math.min(availableCredit, selectedInvoice.totals?.amountDue || 0)
    : availableCredit;

  useEffect(() => {
    if (selectedInvoice) {
      setAmountToApply(maxCanApply);
    } else {
      setAmountToApply(0);
    }
  }, [selectedInvoice, availableCredit, maxCanApply]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNote || !targetInvoiceId) {
      toast.error("Please select a target unpaid invoice");
      return;
    }

    if (amountToApply <= 0) {
      toast.error("Amount to apply must be greater than zero");
      return;
    }

    if (amountToApply > availableCredit) {
      toast.error(
        `Amount cannot exceed available credit of ₹${availableCredit}`,
      );
      return;
    }

    if (
      selectedInvoice &&
      amountToApply > (selectedInvoice.totals?.amountDue || 0)
    ) {
      toast.error(
        `Amount cannot exceed invoice balance due of ₹${selectedInvoice.totals?.amountDue}`,
      );
      return;
    }

    try {
      await applyCredit({
        id: creditNote._id,
        data: {
          targetInvoiceId,
          amountToApply,
        },
      }).unwrap();

      toast.success(
        `₹${amountToApply.toLocaleString("en-IN")} credit successfully applied to ${selectedInvoice?.invoiceNo || "invoice"}.`,
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to apply credit note",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply Unallocated Credit</DialogTitle>
            <DialogDescription>
              Allocate leftover credit from{" "}
              <strong>{creditNote?.creditNoteNo}</strong> against another unpaid
              invoice for this client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Credit Availability Card */}
            <div className="rounded-lg border bg-purple-500/10 border-purple-500/20 p-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">
                  Available Unallocated Credit:
                </span>
                <span className="text-base font-bold text-purple-700 dark:text-purple-300 font-mono">
                  ₹
                  {availableCredit.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Target Invoice Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="targetInvoice">
                Select Target Unpaid Invoice
              </Label>
              <Select
                value={targetInvoiceId}
                onValueChange={setTargetInvoiceId}
              >
                <SelectTrigger id="targetInvoice">
                  <SelectValue
                    placeholder={
                      isLoadingInvoices
                        ? "Loading invoices..."
                        : unpaidInvoices.length === 0
                          ? "No unpaid invoices found"
                          : "Choose unpaid invoice"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {(unpaidInvoices as any[]).map((inv: any) => (
                    <SelectItem key={inv._id} value={inv._id}>
                      {inv.invoiceNo} — Due: ₹
                      {inv.totals?.amountDue?.toLocaleString("en-IN") || 0}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Detail Preview */}
            {selectedInvoice && (
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Invoice Total:</span>
                  <span className="font-mono text-foreground">
                    ₹
                    {selectedInvoice.totals?.grandTotal?.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance Due:</span>
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    ₹
                    {selectedInvoice.totals?.amountDue?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* Amount to Apply Input */}
            <div className="space-y-1.5">
              <Label htmlFor="amountToApply">Amount to Apply (₹)</Label>
              <Input
                id="amountToApply"
                type="number"
                min="0.01"
                max={maxCanApply}
                step="any"
                value={amountToApply}
                onChange={(e) =>
                  setAmountToApply(parseFloat(e.target.value) || 0)
                }
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Maximum allowable: ₹{maxCanApply.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isApplying || !targetInvoiceId || amountToApply <= 0}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isApplying ? "Applying..." : "Apply Credit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
