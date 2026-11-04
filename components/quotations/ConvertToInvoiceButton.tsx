"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useConvertToInvoiceMutation } from "@/lib/services/api";
import { Quotation } from "@/lib/types/quotation";

interface ConvertToInvoiceButtonProps {
  quotation: Pick<
    Quotation,
    "_id" | "quotationNo" | "status" | "convertedInvoiceId" | "totals"
  >;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
  onSuccess?: (invoiceId: string) => void;
}

export function ConvertToInvoiceButton({
  quotation,
  variant = "default",
  size = "sm",
  className = "",
  showText = true,
  onSuccess,
}: ConvertToInvoiceButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<"Unpaid" | "Draft">(
    "Unpaid",
  );

  const [convertToInvoice, { isLoading }] = useConvertToInvoiceMutation();

  const isConverted = quotation.status === "Converted";
  const convertedInvoiceId =
    typeof quotation.convertedInvoiceId === "object" &&
    quotation.convertedInvoiceId
      ? quotation.convertedInvoiceId._id
      : typeof quotation.convertedInvoiceId === "string"
        ? quotation.convertedInvoiceId
        : null;

  const convertedInvoiceNo =
    typeof quotation.convertedInvoiceId === "object" &&
    quotation.convertedInvoiceId
      ? quotation.convertedInvoiceId.invoiceNo
      : null;

  if (isConverted && convertedInvoiceId) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`border-purple-300/50 bg-purple-50/50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800/40 dark:bg-purple-950/20 dark:text-purple-300 dark:hover:bg-purple-950/40 ${className}`}
        onClick={() => router.push(`/view-invoice/${convertedInvoiceId}`)}
      >
        <FileCheck className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
        {showText && (
          <span>
            View Invoice {convertedInvoiceNo ? `(${convertedInvoiceNo})` : ""}
          </span>
        )}
      </Button>
    );
  }

  const handleConvert = async () => {
    try {
      const response = await convertToInvoice({
        id: quotation._id,
        status: initialStatus,
      }).unwrap();

      const newInvoice = response.invoice;
      const invoiceNo = newInvoice?.invoiceNo || "Invoice";
      const invoiceId = newInvoice?._id;

      toast.success(`Converted to ${invoiceNo} successfully!`, {
        description: `Quotation ${quotation.quotationNo} has been turned into an official invoice.`,
      });

      setOpen(false);

      if (onSuccess && invoiceId) {
        onSuccess(invoiceId);
      }

      if (invoiceId) {
        router.push(`/view-invoice/${invoiceId}`);
      }
    } catch (err: any) {
      toast.error("Failed to convert quotation", {
        description:
          err?.data?.message || err?.message || "An unexpected error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isConverted}
          className={`gap-1.5 ${
            variant === "default"
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              : ""
          } ${className}`}
        >
          <FileCheck className="h-4 w-4" />
          {showText && <span>Convert to Invoice</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <span className="p-2 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <FileCheck className="h-5 w-5" />
            </span>
            Convert to Invoice
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-1">
            Generate an official, sequential GST tax invoice from quotation{" "}
            <span className="font-semibold text-foreground">
              {quotation.quotationNo}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Quotation Total:</span>
              <span className="font-semibold text-foreground text-base">
                ₹
                {(quotation.totals?.grandTotal || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>
                All line items, SAC codes, and GST computations will be cloned.
                This quotation will be locked as Converted.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Initial Invoice Status
            </Label>
            <RadioGroup
              value={initialStatus}
              onValueChange={(val) =>
                setInitialStatus(val as "Unpaid" | "Draft")
              }
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem
                  value="Unpaid"
                  id="status-unpaid"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="status-unpaid"
                  className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer"
                >
                  <span className="font-semibold text-sm">Unpaid (Active)</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Ready for client payment & tracking
                  </span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="Draft"
                  id="status-draft"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="status-draft"
                  className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 cursor-pointer"
                >
                  <span className="font-semibold text-sm">Draft</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Review or modify before issuing
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConvert}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                Convert & View
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
