"use client";

import { useEffect, useState } from "react";
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
import { useReturnPhysicalDocMutation } from "@/lib/services/api";
import { PhysicalDocument } from "@/lib/types/physical-document";
import { CheckCircle2, FileCheck, Calendar, User, MapPin } from "lucide-react";

interface RecordReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PhysicalDocument | null;
}

export function RecordReturnModal({
  open,
  onOpenChange,
  document,
}: RecordReturnModalProps) {
  const [returnDoc, { isLoading }] = useReturnPhysicalDocMutation();

  const [actualReturnedDate, setActualReturnedDate] = useState("");
  const [returnedToPersonName, setReturnedToPersonName] = useState("");
  const [returnedNotes, setReturnedNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (document) {
      setActualReturnedDate(todayStr);
      const clientName =
        typeof document.clientId === "object" ? document.clientId.name : "";
      setReturnedToPersonName(
        document.receivedByPersonName || clientName || "",
      );
      setReturnedNotes("");
    }
  }, [document, open]);

  if (!document) return null;

  const clientName =
    typeof document.clientId === "object" ? document.clientId.name : "Client";

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await returnDoc({
        id: document._id,
        data: {
          actualReturnedDate: actualReturnedDate
            ? new Date(actualReturnedDate).toISOString()
            : undefined,
          returnedToPersonName: returnedToPersonName.trim() || undefined,
          returnedNotes: returnedNotes.trim() || undefined,
        },
      }).unwrap();

      toast.success("Document marked as safely returned and acknowledged.");
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.message ||
        "Failed to record document return";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Record Document Return
              </DialogTitle>
              <DialogDescription>
                Acknowledge and archive the handover of original client asset.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Document Overview Snippet */}
        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1.5">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-primary" />
            {document.documentName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>
              Client: <strong className="text-foreground">{clientName}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {document.location}
            </span>
          </div>
          {document.returnDate && (
            <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Due Date:{" "}
              {new Date(document.returnDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleReturn} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="return-date" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Actual Return Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="return-date"
              type="date"
              value={actualReturnedDate}
              onChange={(e) => setActualReturnedDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="return-person"
              className="flex items-center gap-1.5"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Handed Back To (Full Name)
            </Label>
            <Input
              id="return-person"
              placeholder="e.g. Ramesh Patel (Owner / Authorized Rep)"
              value={returnedToPersonName}
              onChange={(e) => setReturnedToPersonName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="return-notes">Acknowledgment / Custody Notes</Label>
            <Textarea
              id="return-notes"
              rows={2}
              placeholder="e.g. Handed over original in sound condition with client signature."
              value={returnedNotes}
              onChange={(e) => setReturnedNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="confirm-return-btn"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
