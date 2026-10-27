"use client";

import { useState } from "react";
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
import { useRefundCreditNoteMutation } from "@/lib/services/api";
import { CreditNote } from "@/lib/types/credit-note";

interface RefundCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditNote: CreditNote | null;
  onSuccess?: () => void;
}

export function RefundCreditModal({
  open,
  onOpenChange,
  creditNote,
  onSuccess,
}: RefundCreditModalProps) {
  const [refundCredit, { isLoading: isRefunding }] =
    useRefundCreditNoteMutation();

  const availableCredit = creditNote?.unallocatedCredit || 0;

  const [refundMode, setRefundMode] = useState<
    "Bank Transfer" | "Cash" | "Cheque" | "UPI" | "Other"
  >("Bank Transfer");
  const [refundDate, setRefundDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNo, setReferenceNo] = useState("");
  const [refundedAmount, setRefundedAmount] = useState<number>(availableCredit);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNote) return;

    if (refundedAmount <= 0) {
      toast.error("Refund amount must be greater than zero");
      return;
    }

    if (refundedAmount > availableCredit) {
      toast.error(`Refund cannot exceed available balance of ₹${availableCredit}`);
      return;
    }

    try {
      await refundCredit({
        id: creditNote._id,
        data: {
          refundMode,
          refundDate,
          referenceNo: referenceNo.trim() || undefined,
          refundedAmount,
          notes: notes.trim() || undefined,
        },
      }).unwrap();

      toast.success(
        `Refund of ₹${refundedAmount.toLocaleString("en-IN")} recorded successfully.`
      );
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to record refund"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Client Payout / Refund</DialogTitle>
            <DialogDescription>
              Record a bank transfer, cheque, or cash refund for unallocated balance on{" "}
              <strong>{creditNote?.creditNoteNo}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">
                  Eligible Refund Balance:
                </span>
                <span className="text-base font-bold text-blue-700 dark:text-blue-300 font-mono">
                  ₹{availableCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="refundMode">Payment Mode</Label>
                <Select
                  value={refundMode}
                  onValueChange={(val) => setRefundMode(val as any)}
                >
                  <SelectTrigger id="refundMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refundDate">Refund Date</Label>
                <Input
                  id="refundDate"
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refundAmount">Refunded Amount (₹)</Label>
              <Input
                id="refundAmount"
                type="number"
                min="0.01"
                max={availableCredit}
                step="any"
                value={refundedAmount}
                onChange={(e) => setRefundedAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refNo">Bank Ref / Cheque / UTR Number</Label>
              <Input
                id="refNo"
                placeholder="e.g. UTR-20261024-88492"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refundNotes">Notes</Label>
              <Textarea
                id="refundNotes"
                placeholder="Remarks regarding approval or bank account details..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isRefunding || refundedAmount <= 0}
            >
              {isRefunding ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
