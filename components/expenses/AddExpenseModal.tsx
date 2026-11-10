"use client";

import { useEffect, useState, useRef } from "react";
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
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useGetExpenseCategoriesQuery,
  useGetClientsQuery,
  useGetTasksQuery,
} from "@/lib/services/api";
import { ClientExpense, ExpensePaymentMode } from "@/lib/types/expenses";
import { DynamicConfigSelect } from "@/components/ui/dynamic-config-select";
import {
  Receipt,
  UploadCloud,
  FileCheck,
  X,
  Calendar,
  Building2,
  CreditCard,
  FileText,
  IndianRupee,
  Layers,
  CheckCircle2,
} from "lucide-react";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultClientName?: string;
  expenseToEdit?: ClientExpense | null;
}

const DEFAULT_CATEGORIES = [
  { _id: "challan_tax", name: "Challan / Tax Paid" },
  { _id: "gov_stamping", name: "Government Stamping" },
  { _id: "roc_filing", name: "ROC Forms & Filings" },
  { _id: "legal_fees", name: "Legal Fees" },
  { _id: "travel_conveyance", name: "Travel & Conveyance" },
  { _id: "stationery_courier", name: "Stationery & Courier" },
  { _id: "misc_outlay", name: "Miscellaneous Outlay" },
];

export function AddExpenseModal({
  open,
  onOpenChange,
  defaultClientId,
  defaultClientName,
  expenseToEdit,
}: AddExpenseModalProps) {
  const isEditing = !!expenseToEdit;

  const { data: serverCategories = [] } = useGetExpenseCategoriesQuery(
    undefined,
    {
      skip: !open,
    },
  );

  const categories =
    serverCategories.length > 0 ? serverCategories : DEFAULT_CATEGORIES;

  // If no defaultClientId, fetch clients list for selection
  const { data: clientsData } = useGetClientsQuery(
    { limit: 200 },
    { skip: !open || !!defaultClientId },
  );
  const clients = clientsData?.clients || [];

  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const isSubmitting = isCreating || isUpdating;

  // Form States
  const [clientId, setClientId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] =
    useState<ExpensePaymentMode>("Bank Transfer");
  const [paidFromAccount, setPaidFromAccount] = useState("");
  const [date, setDate] = useState("");
  const [taskId, setTaskId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<
    string | undefined
  >(undefined);
  const [existingReceiptName, setExistingReceiptName] = useState<
    string | undefined
  >(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch linked client tasks if clientId is available
  const activeClientId = clientId || defaultClientId || "";
  const { data: tasksData } = useGetTasksQuery(
    { clientId: activeClientId, limit: 100 },
    { skip: !activeClientId || !open },
  );
  const clientTasks = tasksData?.tasks || [];

  // Reset or pre-fill state on open
  useEffect(() => {
    if (open) {
      if (expenseToEdit) {
        const cId =
          typeof expenseToEdit.clientId === "object"
            ? expenseToEdit.clientId._id
            : expenseToEdit.clientId;
        setClientId(cId);

        const catId =
          typeof expenseToEdit.categoryId === "object"
            ? expenseToEdit.categoryId._id
            : expenseToEdit.categoryId;
        setCategoryId(catId || "");
        setCategoryName(expenseToEdit.categoryName || "");

        setAmount(String(expenseToEdit.amount || ""));
        setPaymentMode(expenseToEdit.paymentMode || "Bank Transfer");
        setPaidFromAccount(expenseToEdit.paidFromAccount || "");
        setDate(
          expenseToEdit.date
            ? new Date(expenseToEdit.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        );

        const tId =
          typeof expenseToEdit.taskId === "object"
            ? expenseToEdit.taskId._id
            : expenseToEdit.taskId;
        setTaskId(tId || "");

        setNotes(expenseToEdit.notes || "");
        setReceiptFile(null);
        setExistingReceiptUrl(expenseToEdit.receiptFileUrl);
        setExistingReceiptName(expenseToEdit.receiptFileName);
      } else {
        setClientId(defaultClientId || "");
        setCategoryId(categories[0]?._id || "");
        setCategoryName(categories[0]?.name || "");
        setAmount("");
        setPaymentMode("Bank Transfer");
        setPaidFromAccount("");
        setDate(new Date().toISOString().split("T")[0]);
        setTaskId("");
        setNotes("");
        setReceiptFile(null);
        setExistingReceiptUrl(undefined);
        setExistingReceiptName(undefined);
      }
    }
  }, [open, expenseToEdit, defaultClientId, categories]);

  const handleCategorySelect = (val: string) => {
    setCategoryId(val);
    const cat = categories.find((c) => c._id === val);
    if (cat) {
      setCategoryName(cat.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an image (JPG, PNG) or PDF document");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Receipt file cannot exceed 10MB");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetClientId = clientId || defaultClientId;
    if (!targetClientId) {
      toast.error("Please select a client for this outlay");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid expense amount greater than 0");
      return;
    }

    if (!categoryId) {
      toast.error("Please select an expense category");
      return;
    }

    const formData = new FormData();
    formData.append("clientId", targetClientId);
    formData.append("categoryId", categoryId);
    if (categoryName) formData.append("categoryName", categoryName);
    formData.append("amount", String(numAmount));
    formData.append("paymentMode", paymentMode);
    if (paidFromAccount)
      formData.append("paidFromAccount", paidFromAccount.trim());
    if (date) formData.append("date", date);
    if (taskId && taskId !== "none") formData.append("taskId", taskId);
    if (notes) formData.append("notes", notes.trim());

    if (receiptFile) {
      formData.append("receipt", receiptFile);
    }

    try {
      if (isEditing && expenseToEdit) {
        await updateExpense({ id: expenseToEdit._id, formData }).unwrap();
        toast.success(
          `Expense ${expenseToEdit.expenseNo} updated successfully`,
        );
      } else {
        await createExpense(formData).unwrap();
        toast.success("Client outlay recorded and added to unbilled ledger");
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Failed to record expense";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 max-h-[90vh] flex flex-col border-border/70 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-blue-600/10 px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {isEditing
                  ? `Edit Expense (${expenseToEdit?.expenseNo})`
                  : "Log Reimbursable Outlay"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {defaultClientName
                  ? `Record out-of-pocket client outlay for ${defaultClientName}`
                  : "Track statutory challans, court fees, and reimbursable client expenses."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
        >
          {/* Client Selector (if not scoped to a specific client) */}
          {!defaultClientId && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={clientId}
                onValueChange={setClientId}
                disabled={isEditing}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select client entity" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      <span className="font-medium">{c.name}</span>{" "}
                      {c.fileNo && (
                        <span className="text-xs text-muted-foreground">
                          ({c.fileNo})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Expense Category <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={handleCategorySelect}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                Amount (₹) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 h-9 text-sm font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Date & Payment Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Date Incurred <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Payment Mode
              </Label>
              <DynamicConfigSelect
                categoryKey="payment_modes"
                value={paymentMode}
                onValueChange={(v) => setPaymentMode(v as ExpensePaymentMode)}
                placeholder="Select payment mode..."
              />
            </div>
          </div>

          {/* Paid From Account & Linked Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Paid From Account (Optional)
              </Label>
              <Input
                value={paidFromAccount}
                onChange={(e) => setPaidFromAccount(e.target.value)}
                placeholder="e.g. Firm HDFC A/c, Petty Cash Drawer"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Linked Task (Optional)
              </Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Link to active task" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none">No linked task</SelectItem>
                  {clientTasks.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>
                      <span className="truncate max-w-[200px]">
                        {t.serviceId?.name || t.title || "Task"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes / Particulars */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Notes / Particulars Description
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Challan CIN 0192837 paid for MCA form filing. Reimbursable on next invoice."
              rows={2}
              className="resize-none text-xs min-h-[48px]"
            />
          </div>

          {/* Receipt Attachment Dropzone */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Receipt Voucher / Challan Attachment</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                PNG, JPG, PDF up to 10MB
              </span>
            </Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {receiptFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/5 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {receiptFile.name}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    ({(receiptFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReceiptFile(null)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : existingReceiptUrl ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/30 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-foreground truncate">
                    {existingReceiptName || "Attached Receipt Voucher"}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 text-[11px] px-2"
                >
                  Replace File
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border/80 hover:border-emerald-500/60 rounded-lg p-3 text-center cursor-pointer transition-colors hover:bg-muted/30 flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <UploadCloud className="h-4 w-4 text-muted-foreground" />
                <span>Click to attach receipt voucher / challan receipt</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
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
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </div>
              ) : isEditing ? (
                "Update Outlay"
              ) : (
                "Record Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
