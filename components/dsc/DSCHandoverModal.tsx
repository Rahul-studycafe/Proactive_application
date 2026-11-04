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
import { useLogDscHandoverMutation } from "@/lib/services/api";
import { DSCItem } from "@/lib/types/dsc";

interface DSCHandoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dsc: DSCItem | null;
}

export function DSCHandoverModal({
  open,
  onOpenChange,
  dsc,
}: DSCHandoverModalProps) {
  const [logHandover, { isLoading }] = useLogDscHandoverMutation();

  const [action, setAction] = useState<
    "Handed to Client" | "Received from Client" | "Internal Transfer"
  >("Handed to Client");
  const [transferredToName, setTransferredToName] = useState("");
  const [transferredToPhone, setTransferredToPhone] = useState("");
  const [reason, setReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsc) return;

    if (!transferredToName.trim()) {
      toast.error("Recipient / contact name is required");
      return;
    }
    if (!reason.trim()) {
      toast.error("Movement reason is required");
      return;
    }

    try {
      await logHandover({
        id: dsc._id,
        data: {
          action,
          transferredToName: transferredToName.trim(),
          transferredToPhone: transferredToPhone.trim() || undefined,
          reason: reason.trim(),
          expectedReturnDate: expectedReturnDate || undefined,
          notes: notes.trim() || undefined,
        },
      }).unwrap();

      toast.success(
        action === "Handed to Client"
          ? "DSC handed over to client; custody status updated"
          : action === "Received from Client"
            ? "DSC received back; status updated to In Office"
            : "Internal custody transfer logged",
      );

      // Reset & close
      setTransferredToName("");
      setTransferredToPhone("");
      setReason("");
      setExpectedReturnDate("");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to log custody movement",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Log Physical Custody Movement</DialogTitle>
            <DialogDescription>
              Record chain-of-custody for{" "}
              <strong>{dsc?.certificateName}</strong> (Dongle #
              {dsc?.tokenSerialNumber || "N/A"}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Movement Action */}
            <div className="space-y-1.5">
              <Label htmlFor="action">Custody Action</Label>
              <Select
                value={action}
                onValueChange={(val) =>
                  setAction(
                    val as
                      | "Handed to Client"
                      | "Received from Client"
                      | "Internal Transfer",
                  )
                }
              >
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Handed to Client">
                    Handed to Client / Representative
                  </SelectItem>
                  <SelectItem value="Received from Client">
                    Received Back from Client
                  </SelectItem>
                  <SelectItem value="Internal Transfer">
                    Internal Transfer (To Staff / Partner)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transferred To Name */}
            <div className="space-y-1.5">
              <Label htmlFor="transferredToName">
                {action === "Handed to Client"
                  ? "Recipient / Client Rep Name"
                  : action === "Received from Client"
                    ? "Delivered by Person Name"
                    : "Assigned Staff Member Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="transferredToName"
                placeholder="e.g. Ramesh Patel"
                value={transferredToName}
                onChange={(e) => setTransferredToName(e.target.value)}
                required
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="transferredToPhone">Contact Phone Number</Label>
              <Input
                id="transferredToPhone"
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={transferredToPhone}
                onChange={(e) => setTransferredToPhone(e.target.value)}
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Movement Reason <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reason"
                placeholder='e.g. "MCA Annual Director Filing on client premises"'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>

            {/* Expected Return Date (if handed out) */}
            {action !== "Received from Client" && (
              <div className="space-y-1.5">
                <Label htmlFor="expectedReturnDate">Expected Return Date</Label>
                <Input
                  id="expectedReturnDate"
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="handoverNotes">Audit Notes</Label>
              <Textarea
                id="handoverNotes"
                placeholder="Any special remarks or receipt acknowledgment details..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 sticky bottom-0 bg-background/95 backdrop-blur border-t mt-4 pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Log Custody Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
