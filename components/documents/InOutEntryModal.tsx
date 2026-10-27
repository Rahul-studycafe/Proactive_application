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
import {
  useCreatePhysicalDocMutation,
  useUpdatePhysicalDocMutation,
  useGetClientsQuery,
} from "@/lib/services/api";
import {
  PhysicalDocument,
  PhysicalDocCategory,
  PhysicalDocType,
} from "@/lib/types/physical-document";
import { ArrowDownLeft, ArrowUpRight, FolderPlus, MapPin, Calendar, User, Phone } from "lucide-react";

interface InOutEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docToEdit?: PhysicalDocument | null;
  defaultClientId?: string;
  defaultCategory?: PhysicalDocCategory;
}

const DOCUMENT_TYPES: PhysicalDocType[] = [
  "Passbook",
  "Cheque Book",
  "Original Deeds",
  "PAN Card",
  "Registration Certificate",
  "Company Seal",
  "Other",
];

export function InOutEntryModal({
  open,
  onOpenChange,
  docToEdit,
  defaultClientId,
  defaultCategory = "Received",
}: InOutEntryModalProps) {
  const isEditing = !!docToEdit;

  const { data: clientsRes } = useGetClientsQuery(undefined);
  const clients = clientsRes?.clients || [];

  const [createDoc, { isLoading: isCreating }] = useCreatePhysicalDocMutation();
  const [updateDoc, { isLoading: isUpdating }] = useUpdatePhysicalDocMutation();
  const isSubmitting = isCreating || isUpdating;

  const [clientId, setClientId] = useState("");
  const [category, setCategory] = useState<PhysicalDocCategory>(defaultCategory);
  const [date, setDate] = useState("");
  const [documentType, setDocumentType] = useState<PhysicalDocType>("Original Deeds");
  const [documentName, setDocumentName] = useState("");
  const [isReturnable, setIsReturnable] = useState(true);
  const [returnDate, setReturnDate] = useState("");
  const [location, setLocation] = useState("");
  const [receivedByPersonName, setReceivedByPersonName] = useState("");
  const [receivedByPhone, setReceivedByPhone] = useState("");
  const [notes, setNotes] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!open) return;
    if (docToEdit) {
      const cId =
        typeof docToEdit.clientId === "object"
          ? docToEdit.clientId._id
          : docToEdit.clientId;
      setClientId(cId || defaultClientId || "");
      setCategory(docToEdit.category || "Received");
      setDate(docToEdit.date ? new Date(docToEdit.date).toISOString().split("T")[0] : todayStr);
      setDocumentType(docToEdit.documentType || "Original Deeds");
      setDocumentName(docToEdit.documentName || "");
      setIsReturnable(!!docToEdit.isReturnable);
      setReturnDate(
        docToEdit.returnDate
          ? new Date(docToEdit.returnDate).toISOString().split("T")[0]
          : ""
      );
      setLocation(docToEdit.location || "");
      setReceivedByPersonName(docToEdit.receivedByPersonName || "");
      setReceivedByPhone(docToEdit.receivedByPhone || "");
      setNotes(docToEdit.notes || "");
    } else {
      setClientId(defaultClientId || (clients[0]?._id ?? ""));
      setCategory(defaultCategory);
      setDate(todayStr);
      setDocumentType("Original Deeds");
      setDocumentName("");
      setIsReturnable(true);
      // default return date in 14 days
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setReturnDate(d.toISOString().split("T")[0]);
      setLocation("");
      setReceivedByPersonName("");
      setReceivedByPhone("");
      setNotes("");
    }
  }, [open, docToEdit, defaultClientId, defaultCategory]);

  useEffect(() => {
    if (!clientId && clients.length > 0 && !defaultClientId) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId, defaultClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (!documentName.trim() || documentName.trim().length < 2) {
      toast.error("Document name must be at least 2 characters.");
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      toast.error("Please specify the office storage location.");
      return;
    }
    if (isReturnable && !returnDate) {
      toast.error("Please provide expected return date for returnable assets.");
      return;
    }

    try {
      if (isEditing && docToEdit) {
        await updateDoc({
          id: docToEdit._id,
          data: {
            clientId,
            category,
            date: date ? new Date(date).toISOString() : undefined,
            documentType,
            documentName: documentName.trim(),
            isReturnable,
            returnDate: isReturnable && returnDate ? new Date(returnDate).toISOString() : null,
            location: location.trim(),
            receivedByPersonName: receivedByPersonName.trim() || undefined,
            receivedByPhone: receivedByPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        }).unwrap();
        toast.success("Document custody record updated successfully.");
      } else {
        await createDoc({
          clientId,
          category,
          date: date ? new Date(date).toISOString() : undefined,
          documentType,
          documentName: documentName.trim(),
          isReturnable,
          returnDate: isReturnable && returnDate ? new Date(returnDate).toISOString() : null,
          location: location.trim(),
          receivedByPersonName: receivedByPersonName.trim() || undefined,
          receivedByPhone: receivedByPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }).unwrap();
        toast.success(
          category === "Received"
            ? "Document received into custody and logged."
            : "Document handover recorded successfully."
        );
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to save document record";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Custody Document" : "Log Document In / Out"}
              </DialogTitle>
              <DialogDescription>
                Track physical documents, deeds, certificates, and seals moving in or out of the office.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category Toggle */}
          <div className="space-y-1.5">
            <Label>Transaction Category <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-category-received"
                onClick={() => setCategory("Received")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  category === "Received"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                <span>Received from Client</span>
              </button>
              <button
                type="button"
                id="btn-category-given"
                onClick={() => setCategory("Given")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  category === "Given"
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                <span>Given to Client / Third Party</span>
              </button>
            </div>
          </div>

          {/* Client & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-client">Client <span className="text-destructive">*</span></Label>
              <Select
                value={clientId}
                onValueChange={setClientId}
                disabled={isEditing || !!defaultClientId}
              >
                <SelectTrigger id="doc-client">
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
              <Label htmlFor="doc-date">Transaction Date <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="doc-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Type & Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="doc-type">Document Type <span className="text-destructive">*</span></Label>
              <Select
                value={documentType}
                onValueChange={(val) => setDocumentType(val as PhysicalDocType)}
              >
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="doc-name">Document Description / Name <span className="text-destructive">*</span></Label>
              <Input
                id="doc-name"
                placeholder="e.g. Original Sale Deed - Bandra West Commercial Plot"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Storage Location */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Office Storage Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="doc-location"
              placeholder="e.g. Cabinet A, Shelf 3, Red Binder or Safe Box 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Exact filing cabinet, drawer, locker, or shelf slot where this physical asset is preserved.
            </p>
          </div>

          {/* Returnable Switch & Expected Return Date */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="doc-returnable" className="font-medium cursor-pointer">
                  Is this asset returnable?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Check if client expects this original hardcopy back after filing or audit.
                </p>
              </div>
              <Switch
                id="doc-returnable"
                checked={isReturnable}
                onCheckedChange={setIsReturnable}
              />
            </div>

            {isReturnable && (
              <div className="pt-2 border-t">
                <Label htmlFor="doc-return-date" className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Expected Return Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-return-date"
                  type="date"
                  className="mt-1"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required={isReturnable}
                />
              </div>
            )}
          </div>

          {/* Person / Bearer Contact details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-person" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {category === "Received" ? "Handed In By (Person Name)" : "Handed Out To (Person Name)"}
              </Label>
              <Input
                id="doc-person"
                placeholder="e.g. Rajesh Sharma (Director's Assistant)"
                value={receivedByPersonName}
                onChange={(e) => setReceivedByPersonName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="doc-phone"
                placeholder="e.g. +91 98200 12345"
                value={receivedByPhone}
                onChange={(e) => setReceivedByPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Audit Notes / Condition Remarks</Label>
            <Textarea
              id="doc-notes"
              rows={2}
              placeholder="e.g. 1 original hardcopy booklet, verified intact stamp paper."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sticky bottom-0 bg-background/95 backdrop-blur border-t mt-4 pb-1">
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
              id="submit-in-out-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : category === "Received"
                ? "Record Receipt"
                : "Record Handover"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
