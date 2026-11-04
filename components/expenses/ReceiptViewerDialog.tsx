"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientExpense } from "@/lib/types/expenses";
import {
  Download,
  ExternalLink,
  Receipt,
  FileQuestion,
  Calendar,
  CreditCard,
} from "lucide-react";

interface ReceiptViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ClientExpense | null;
}

export function ReceiptViewerDialog({
  open,
  onOpenChange,
  expense,
}: ReceiptViewerDialogProps) {
  if (!expense) return null;

  const backendBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
    "http://localhost:5000";

  const fileUrl = expense.receiptFileUrl
    ? expense.receiptFileUrl.startsWith("http")
      ? expense.receiptFileUrl
      : `${backendBaseUrl}${expense.receiptFileUrl}`
    : null;

  const isPdf =
    expense.receiptFileName?.toLowerCase().endsWith(".pdf") ||
    expense.receiptFileUrl?.toLowerCase().endsWith(".pdf");

  const formattedAmount = `₹${(expense.amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

  const clientName =
    typeof expense.clientId === "object"
      ? expense.clientId?.name
      : "Client Outlay";

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fileUrl) return;

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("Download request failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const downloadName =
        expense.receiptFileName ||
        (isPdf
          ? `Receipt-${expense.expenseNo}.pdf`
          : `Receipt-${expense.expenseNo}.png`);
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 flex flex-col overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-muted/60 via-background to-muted/40 px-6 py-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>Receipt Voucher</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {expense.expenseNo}
                  </Badge>
                  {expense.isBilled ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                      Billed
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Unbilled
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                  <span>{clientName}</span>
                  <span>•</span>
                  <span>{expense.categoryName}</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">
                    {formattedAmount}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {fileUrl && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="h-8 gap-1.5 text-xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                  title="Open in new window"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center min-h-[360px] max-h-[65vh] bg-muted/20">
          {!fileUrl ? (
            <div className="text-center py-12 space-y-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto">
                <FileQuestion className="h-6 w-6" />
              </div>
              <p className="font-medium text-sm text-foreground">
                No Receipt Attached
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                No physical receipt or challan file was uploaded for this
                expense outlay.
              </p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-[500px] rounded-lg overflow-hidden border border-border/60 bg-background">
              <iframe
                src={`${fileUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title={`Receipt-${expense.expenseNo}`}
              />
            </div>
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={fileUrl}
                alt={`Receipt for ${expense.expenseNo}`}
                className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-md border border-border/60"
              />
            </div>
          )}
        </div>

        {/* Footer with Metadata */}
        <div className="px-6 py-3 border-t border-border/50 bg-background flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(expense.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" />
              {expense.paymentMode}
              {expense.paidFromAccount && ` (${expense.paidFromAccount})`}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
