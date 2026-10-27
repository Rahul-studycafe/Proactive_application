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
import { Switch } from "@/components/ui/switch";
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
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  Percent,
  Sparkles,
  IndianRupee,
} from "lucide-react";
import {
  useCreateQuotationMutation,
  useGetClientsQuery,
  useGetServicesQuery,
} from "@/lib/services/api";
import { CreateQuotationItemInput } from "@/lib/types/quotation";

interface CreateQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
  onSuccess?: (quotationId: string) => void;
}

interface QuotationItemRow extends CreateQuotationItemInput {
  tempId: string;
}

const DEFAULT_TERMS =
  "1. This quotation is valid for 30 calendar days from the date of issue.\n2. 50% advance payment required upon acceptance of the proposal.\n3. Out-of-pocket statutory filing fees & stamp duties will be billed at actuals.\n4. GST will be charged extra as applicable per prevailing tax laws.";

export function CreateQuotationModal({
  open,
  onOpenChange,
  preselectedClientId,
  onSuccess,
}: CreateQuotationModalProps) {
  const [createQuotation, { isLoading: isSubmitting }] =
    useCreateQuotationMutation();

  const { data: clientsData } = useGetClientsQuery(
    { limit: 250 },
    { skip: !open }
  );
  const clients = clientsData?.clients || [];

  const { data: servicesResponse } = useGetServicesQuery(undefined, {
    skip: !open,
  });
  const services: any[] = Array.isArray(servicesResponse)
    ? servicesResponse
    : (servicesResponse as any)?.data || (servicesResponse as any)?.services || [];

  // Form states
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [date, setDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isInterState, setIsInterState] = useState(false);
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<QuotationItemRow[]>([
    {
      tempId: "item-1",
      serviceId: "",
      description: "",
      sacCode: "998231",
      quantity: 1,
      rate: 0,
      discount: 0,
      gstPercentage: 18,
    },
  ]);

  // Set default dates on open
  useEffect(() => {
    if (open) {
      const today = new Date();
      const validDate = new Date();
      validDate.setDate(today.getDate() + 30);

      setDate(today.toISOString().split("T")[0]);
      setValidUntil(validDate.toISOString().split("T")[0]);

      if (preselectedClientId) {
        setClientId(preselectedClientId);
      }
    }
  }, [open, preselectedClientId]);

  // When client changes, check state
  const selectedClient = useMemo(() => {
    return clients.find((c: any) => c._id === clientId);
  }, [clients, clientId]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${Math.random()}`,
        serviceId: "",
        description: "",
        sacCode: "998231",
        quantity: 1,
        rate: 0,
        discount: 0,
        gstPercentage: 18,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemRow,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    if (serviceId === "custom") {
      handleItemChange(index, "serviceId", "");
      return;
    }

    const s = services.find((srv) => srv._id === serviceId);
    if (!s) return;

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        serviceId: s._id,
        description: s.name || updated[index].description,
        sacCode: s.sacCode || "998231",
        rate: s.defaultBillingRate ?? updated[index].rate,
        gstPercentage: s.gstPercentage ?? 18,
      };
      return updated;
    });
  };

  // Live Tax Math Computation
  const calculated = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const rowCalcs = items.map((item) => {
      const rate = Number(item.rate) || 0;
      const quantity = Math.max(0.01, Number(item.quantity) || 1);
      const discount = Math.max(0, Number(item.discount) || 0);
      const amount = Number((rate * quantity).toFixed(2));
      const taxableAmount = Math.max(0, Number((amount - discount).toFixed(2)));
      const gstPercentage = Number(item.gstPercentage) || 0;

      const taxAmount = Number(((taxableAmount * gstPercentage) / 100).toFixed(2));

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = taxAmount;
      } else {
        cgst = Number((taxAmount / 2).toFixed(2));
        sgst = Number((taxAmount - cgst).toFixed(2));
      }

      const total = Number((taxableAmount + taxAmount).toFixed(2));

      subtotal += amount;
      discountTotal += discount;
      taxableTotal += taxableAmount;
      cgstTotal += cgst;
      sgstTotal += sgst;
      igstTotal += igst;

      return {
        amount,
        taxableAmount,
        taxAmount,
        total,
      };
    });

    const taxTotal = Number((cgstTotal + sgstTotal + igstTotal).toFixed(2));
    const grandTotalRaw = taxableTotal + taxTotal;
    const grandTotal = Math.round(grandTotalRaw);
    const roundOff = Number((grandTotal - grandTotalRaw).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxableTotal: Number(taxableTotal.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      taxTotal,
      roundOff,
      grandTotal,
      rowCalcs,
    };
  }, [items, isInterState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a target client");
      return;
    }

    if (!items.length) {
      toast.error("At least one line item is required");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        toast.error(`Item #${i + 1} requires a description`);
        return;
      }
    }

    try {
      const payload = {
        clientId,
        date: date || undefined,
        validUntil: validUntil || undefined,
        isInterState,
        termsAndConditions: termsAndConditions.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          serviceId: it.serviceId || undefined,
          description: it.description.trim(),
          sacCode: it.sacCode?.trim() || undefined,
          rate: Number(it.rate) || 0,
          quantity: Number(it.quantity) || 1,
          discount: Number(it.discount) || 0,
          gstPercentage: Number(it.gstPercentage) || 0,
        })),
      };

      const res = await createQuotation(payload).unwrap();
      const quote = (res as any)?.data || res;
      toast.success(`Quotation created successfully!`, {
        description: `Quotation No. ${quote.quotationNo || "created"} has been saved as Draft.`,
      });

      onOpenChange(false);

      if (onSuccess && quote._id) {
        onSuccess(quote._id);
      }
    } catch (err: any) {
      toast.error("Failed to create quotation", {
        description:
          err?.data?.message || err?.message || "An unexpected error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Create Quotation / Proposal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Draft a professional estimate with SAC codes, itemized GST math,
                and validity timeline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Top Row: Client Selector & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Selector */}
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Client <span className="text-destructive">*</span>
              </Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Client..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-medium text-foreground">
                          {c.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.fileNo || "No File"} • {c.pan || "No PAN"}
                          {c.state ? ` • ${c.state}` : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date of Issue */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Issue Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Valid Until */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Valid Until
              </Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Tax Region Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/30">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>Supply Type:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isInterState
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                  }`}
                >
                  {isInterState
                    ? "Inter-State (IGST 100%)"
                    : "Intra-State (CGST 50% + SGST 50%)"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Toggle on if client is located in another State or Union Territory outside practice base.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="inter-state-switch"
                className="text-xs font-medium cursor-pointer"
              >
                Inter-State IGST
              </Label>
              <Switch
                id="inter-state-switch"
                checked={isInterState}
                onCheckedChange={setIsInterState}
              />
            </div>
          </div>

          {/* Dynamic Line Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Line Items & Services</span>
                <span className="text-xs font-normal text-muted-foreground">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              </Label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-8 gap-1.5 text-xs font-medium text-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 text-xs">
                    <TableRow>
                      <TableHead className="w-[22%] min-w-[160px]">Service / Template</TableHead>
                      <TableHead className="w-[26%] min-w-[180px]">Description & SAC</TableHead>
                      <TableHead className="w-[10%] min-w-[70px] text-right">Qty</TableHead>
                      <TableHead className="w-[14%] min-w-[100px] text-right">Rate (₹)</TableHead>
                      <TableHead className="w-[11%] min-w-[80px] text-right">Disc (₹)</TableHead>
                      <TableHead className="w-[10%] min-w-[75px] text-right">GST %</TableHead>
                      <TableHead className="w-[12%] min-w-[95px] text-right">Total (₹)</TableHead>
                      <TableHead className="w-[5%] min-w-[40px] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => {
                      const rowCalc = calculated.rowCalcs[idx];
                      return (
                        <TableRow key={item.tempId} className="align-top text-xs">
                          {/* Service Template selector */}
                          <TableCell className="p-2">
                            <Select
                              value={item.serviceId || "custom"}
                              onValueChange={(val) => handleServiceSelect(idx, val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Custom Item" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Custom Line Item</SelectItem>
                                {services.map((s: any) => (
                                  <SelectItem key={s._id} value={s._id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Description & SAC */}
                          <TableCell className="p-2 space-y-1.5">
                            <Input
                              placeholder="Description *"
                              className="h-8 text-xs font-medium"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(idx, "description", e.target.value)
                              }
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                SAC:
                              </span>
                              <Input
                                placeholder="998231"
                                className="h-6 text-[11px] font-mono px-1.5 py-0 w-24"
                                value={item.sacCode || ""}
                                onChange={(e) =>
                                  handleItemChange(idx, "sacCode", e.target.value)
                                }
                              />
                            </div>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell className="p-2 text-right">
                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              className="h-8 text-xs text-right font-mono"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "quantity",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </TableCell>

                          {/* Rate */}
                          <TableCell className="p-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-8 text-xs text-right font-mono"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "rate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </TableCell>

                          {/* Discount */}
                          <TableCell className="p-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              className="h-8 text-xs text-right font-mono"
                              value={item.discount || 0}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "discount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </TableCell>

                          {/* GST % */}
                          <TableCell className="p-2 text-right">
                            <Select
                              value={String(item.gstPercentage ?? 18)}
                              onValueChange={(val) =>
                                handleItemChange(idx, "gstPercentage", Number(val))
                              }
                            >
                              <SelectTrigger className="h-8 text-xs font-mono text-right">
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

                          {/* Line Total */}
                          <TableCell className="p-2 text-right font-mono font-semibold pt-3.5">
                            ₹{(rowCalc?.total || 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>

                          {/* Remove */}
                          <TableCell className="p-2 text-center pt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={items.length <= 1}
                              onClick={() => handleRemoveItem(idx)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
          </div>

          {/* Bottom Grid: Terms & Live Math Totals Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Left: Terms and Notes */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Terms & Conditions
                </Label>
                <Textarea
                  rows={4}
                  className="text-xs resize-none font-sans"
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  placeholder="Terms and conditions for client acceptance..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Internal / Client Notes (Optional)
                </Label>
                <Textarea
                  rows={2}
                  className="text-xs resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional delivery milestones, client-specific instructions, etc."
                />
              </div>
            </div>

            {/* Right: Live GST Math Summary Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-2">
                  Tax Calculation Summary
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono text-foreground">
                      ₹{calculated.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {calculated.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Total Discount:</span>
                      <span className="font-mono">
                        -₹{calculated.discountTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/40">
                    <span>Taxable Value:</span>
                    <span className="font-mono font-medium text-foreground">
                      ₹{calculated.taxableTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isInterState ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>IGST (Inter-State):</span>
                      <span className="font-mono text-foreground">
                        ₹{calculated.igstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST (Intra-State 50%):</span>
                        <span className="font-mono text-foreground">
                          ₹{calculated.cgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST (Intra-State 50%):</span>
                        <span className="font-mono text-foreground">
                          ₹{calculated.sgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  {calculated.roundOff !== 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Round-off:</span>
                      <span className="font-mono text-foreground">
                        {calculated.roundOff > 0 ? "+" : ""}
                        ₹{calculated.roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2.5 border-t border-border/80">
                    <span className="text-sm font-bold text-foreground">
                      Grand Total:
                    </span>
                    <span className="text-lg font-bold font-mono text-primary">
                      ₹{calculated.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/80 gap-2 sm:gap-0">
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
              disabled={isSubmitting}
              className="gap-2 shadow-sm font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Proposal...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Create Quotation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
