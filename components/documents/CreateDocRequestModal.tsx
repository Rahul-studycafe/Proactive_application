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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useCreateDocumentRequestMutation,
  useGetClientsQuery,
  useGetTasksQuery,
} from "@/lib/services/api";
import {
  FileUp,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { DocumentRequest } from "@/lib/types/document-request";

interface CreateDocRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientId?: string;
  defaultTaskId?: string;
  onSuccess?: (createdRequest: DocumentRequest & { uploadUrl: string; emailDispatched: boolean }) => void;
}

interface ChecklistFormItem {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  acceptedFormats: string[];
}

const COMMON_FORMAT_PRESETS = [
  { label: "PDF", value: ".pdf" },
  { label: "Excel/CSV", value: ".xlsx,.csv,.xls" },
  { label: "Images", value: ".png,.jpg,.jpeg" },
  { label: "Archives", value: ".zip,.rar" },
];

export function CreateDocRequestModal({
  open,
  onOpenChange,
  defaultClientId,
  defaultTaskId,
  onSuccess,
}: CreateDocRequestModalProps) {
  const { data: clientsRes } = useGetClientsQuery(undefined);
  const clients = clientsRes?.clients || [];

  const { data: tasksRes } = useGetTasksQuery(
    defaultClientId ? { clientId: defaultClientId, limit: 50 } : { limit: 50 }
  );
  const tasks = tasksRes?.tasks || [];

  const [createRequest, { isLoading }] = useCreateDocumentRequestMutation();

  const [clientId, setClientId] = useState(defaultClientId || "");
  const [taskId, setTaskId] = useState(defaultTaskId || "");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  const [items, setItems] = useState<ChecklistFormItem[]>([
    {
      id: "1",
      name: "Bank Statements (Last 12 Months)",
      description: "PDF statements from netbanking for all active bank accounts",
      isRequired: true,
      acceptedFormats: [".pdf", ".xlsx", ".csv"],
    },
    {
      id: "2",
      name: "Purchase & Expense Invoices",
      description: "Vendor bills or statement spreadsheet",
      isRequired: true,
      acceptedFormats: [".pdf", ".xlsx", ".zip", ".png", ".jpg"],
    },
  ]);

  useEffect(() => {
    if (!open) return;
    if (defaultClientId) {
      setClientId(defaultClientId);
    } else if (clients.length > 0 && !clientId) {
      setClientId(clients[0]._id);
    }
    if (defaultTaskId) {
      setTaskId(defaultTaskId);
    }
  }, [open, defaultClientId, defaultTaskId, clients, clientId]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: "",
        description: "",
        isRequired: true,
        acceptedFormats: [".pdf", ".xlsx", ".png", ".jpg"],
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("At least one document item must be requested.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof ChecklistFormItem,
    val: any
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      toast.error("Please provide a request title (e.g. GST Audit Documents).");
      return;
    }

    const validItems = items.filter((it) => it.name.trim().length > 0);
    if (validItems.length === 0) {
      toast.error("Please provide at least one valid document name.");
      return;
    }

    try {
      const res = await createRequest({
        clientId,
        taskId: taskId && taskId !== "none" ? taskId : undefined,
        title: title.trim(),
        instructions: instructions.trim() || undefined,
        expiresInDays: Number(expiresInDays) || 7,
        items: validItems.map((it) => ({
          name: it.name.trim(),
          description: it.description.trim() || undefined,
          isRequired: it.isRequired,
          acceptedFormats: it.acceptedFormats,
        })),
      }).unwrap();

      toast.success(
        res.emailDispatched
          ? "Document request created & magic link emailed to client!"
          : "Document request created successfully with magic upload link!"
      );

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to create document request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Request Documents from Client</DialogTitle>
              <DialogDescription>
                Create a customized file upload checklist and generate a secure passwordless magic link for your client.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Client & Linked Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="req-client">Client <span className="text-destructive">*</span></Label>
              <Select
                value={clientId}
                onValueChange={setClientId}
                disabled={!!defaultClientId}
              >
                <SelectTrigger id="req-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} {c.fileNo ? `(${c.fileNo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-task">Associated Task (Optional)</Label>
              <Select
                value={taskId || "none"}
                onValueChange={(val) => setTaskId(val === "none" ? "" : val)}
                disabled={!!defaultTaskId}
              >
                <SelectTrigger id="req-task">
                  <SelectValue placeholder="None (General Request)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">None (General Request)</SelectItem>
                  {tasks.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.description || t.title || "Task"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="req-title">Request Title <span className="text-destructive">*</span></Label>
              <Input
                id="req-title"
                placeholder="e.g. FY 25-26 Tax Audit & ITR Document Collection"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="req-expiry">Link Expiration</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="req-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days (Default)</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="req-instructions">Instructions for Client</Label>
            <Textarea
              id="req-instructions"
              rows={2}
              placeholder="e.g. Please upload original clear PDF statements or scans. Ensure no pages are obscured."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Required Documents Checklist ({items.length})
                </Label>
                <p className="text-xs text-muted-foreground">
                  The client will be asked to upload files for each item specified below.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-8 text-xs"
                id="add-doc-item-btn"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border bg-muted/20 p-3 space-y-2.5 relative transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-1">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Input
                          placeholder="Document Name (e.g. Form 16, Bank Statement)"
                          value={item.name}
                          onChange={(e) =>
                            handleItemChange(item.id, "name", e.target.value)
                          }
                          className="h-8 text-xs flex-1"
                          required
                        />

                        <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id={`req-toggle-${item.id}`}
                              checked={item.isRequired}
                              onCheckedChange={(val) =>
                                handleItemChange(item.id, "isRequired", val)
                              }
                            />
                            <Label
                              htmlFor={`req-toggle-${item.id}`}
                              className="text-xs cursor-pointer font-medium"
                            >
                              {item.isRequired ? "Mandatory" : "Optional"}
                            </Label>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Remove document item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <Input
                        placeholder="Guidance or format tip for client (optional)"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(item.id, "description", e.target.value)
                        }
                        className="h-7 text-xs text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
            <Button
              type="submit"
              id="submit-create-request-btn"
              disabled={isLoading}
            >
              {isLoading ? "Generating Link..." : "Create & Generate Magic Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}