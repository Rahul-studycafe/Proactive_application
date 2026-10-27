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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateDscMutation,
  useUpdateDscMutation,
  useGetClientsQuery,
} from "@/lib/services/api";
import {
  DSCItem,
  DSCClass,
  DSCTokenType,
  DSCIssuingAuthority,
  DSCStatus,
} from "@/lib/types/dsc";

interface CreateDSCModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dscToEdit?: DSCItem | null;
  defaultClientId?: string;
}

export function CreateDSCModal({
  open,
  onOpenChange,
  dscToEdit,
  defaultClientId,
}: CreateDSCModalProps) {
  const isEditing = !!dscToEdit;

  const { data: clientsRes } = useGetClientsQuery(undefined);
  const clients = clientsRes?.clients || [];

  const [createDsc, { isLoading: isCreating }] = useCreateDscMutation();
  const [updateDsc, { isLoading: isUpdating }] = useUpdateDscMutation();
  const isSubmitting = isCreating || isUpdating;

  const [clientId, setClientId] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [certificateClass, setCertificateClass] = useState<DSCClass>("Class 3");
  const [tokenType, setTokenType] = useState<DSCTokenType>("ePass2003");
  const [tokenSerialNumber, setTokenSerialNumber] = useState("");
  const [issuingAuthority, setIssuingAuthority] =
    useState<DSCIssuingAuthority>("eMudhra");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [physicalLocation, setPhysicalLocation] = useState("");
  const [status, setStatus] = useState<DSCStatus>("In Office");
  const [currentHolderName, setCurrentHolderName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (dscToEdit) {
      const cId =
        typeof dscToEdit.clientId === "object"
          ? dscToEdit.clientId._id
          : dscToEdit.clientId;
      setClientId(cId || "");
      setCertificateName(dscToEdit.certificateName || "");
      setCertificateClass(dscToEdit.certificateClass || "Class 3");
      setTokenType(dscToEdit.tokenType || "ePass2003");
      setTokenSerialNumber(dscToEdit.tokenSerialNumber || "");
      setIssuingAuthority(dscToEdit.issuingAuthority || "eMudhra");
      setIssueDate(
        dscToEdit.issueDate ? dscToEdit.issueDate.split("T")[0] : ""
      );
      setExpiryDate(
        dscToEdit.expiryDate ? dscToEdit.expiryDate.split("T")[0] : ""
      );
      setPhysicalLocation(dscToEdit.physicalLocation || "");
      setStatus(dscToEdit.status || "In Office");
      setCurrentHolderName(dscToEdit.currentHolderName || "");
      setNotes(dscToEdit.notes || "");
    } else {
      setClientId(defaultClientId || "");
      setCertificateName("");
      setCertificateClass("Class 3");
      setTokenType("ePass2003");
      setTokenSerialNumber("");
      setIssuingAuthority("eMudhra");
      setIssueDate("");
      setExpiryDate("");
      setPhysicalLocation("");
      setStatus("In Office");
      setCurrentHolderName("");
      setNotes("");
    }
  }, [dscToEdit, defaultClientId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !clientId) {
      toast.error("Please select a client");
      return;
    }
    if (!certificateName.trim()) {
      toast.error("Certificate name is required");
      return;
    }
    if (!issueDate || !expiryDate) {
      toast.error("Issue date and expiry date are required");
      return;
    }
    if (new Date(expiryDate) <= new Date(issueDate)) {
      toast.error("Expiry date must be after issue date");
      return;
    }
    if (!physicalLocation.trim()) {
      toast.error("Physical storage location is required");
      return;
    }

    try {
      if (isEditing && dscToEdit) {
        await updateDsc({
          id: dscToEdit._id,
          data: {
            certificateName: certificateName.trim(),
            certificateClass,
            tokenType,
            tokenSerialNumber: tokenSerialNumber.trim() || undefined,
            issuingAuthority,
            issueDate,
            expiryDate,
            physicalLocation: physicalLocation.trim(),
            status,
            currentHolderName:
              status === "With Client" ? currentHolderName.trim() : undefined,
            notes: notes.trim() || undefined,
          },
        }).unwrap();
        toast.success("DSC certificate updated successfully");
      } else {
        await createDsc({
          clientId,
          certificateName: certificateName.trim(),
          certificateClass,
          tokenType,
          tokenSerialNumber: tokenSerialNumber.trim() || undefined,
          issuingAuthority,
          issueDate,
          expiryDate,
          physicalLocation: physicalLocation.trim(),
          status,
          currentHolderName:
            status === "With Client" ? currentHolderName.trim() : undefined,
          notes: notes.trim() || undefined,
        }).unwrap();
        toast.success("DSC certificate registered successfully");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to save DSC token"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit DSC Certificate" : "Register New DSC Token"}
            </DialogTitle>
            <DialogDescription>
              Record client USB token serial, certifying authority, physical safe coordinate, and validity dates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Client Selector (only editable on creation) */}
            {!isEditing ? (
              <div className="space-y-1.5">
                <Label htmlFor="client">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client entity" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {clients.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} {c.entityType ? `(${c.entityType})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {/* Certificate Name */}
            <div className="space-y-1.5">
              <Label htmlFor="certificateName">
                Certificate Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="certificateName"
                placeholder='e.g. "Rahul Chauhan - Director DSC"'
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                required
              />
            </div>

            {/* Class & Token Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="certificateClass">Certificate Class</Label>
                <Select
                  value={certificateClass}
                  onValueChange={(val) => setCertificateClass(val as DSCClass)}
                >
                  <SelectTrigger id="certificateClass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Class 3">Class 3 (MCA/GST Standard)</SelectItem>
                    <SelectItem value="Class 2">Class 2 (Legacy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tokenType">USB Token Hardware Type</Label>
                <Select
                  value={tokenType}
                  onValueChange={(val) => setTokenType(val as DSCTokenType)}
                >
                  <SelectTrigger id="tokenType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ePass2003">ePass2003 Auto</SelectItem>
                    <SelectItem value="ProxKey">ProxKey Watchdata</SelectItem>
                    <SelectItem value="mToken">mToken CryptoID</SelectItem>
                    <SelectItem value="Watchdata">Watchdata</SelectItem>
                    <SelectItem value="Other">Other Hardware Dongle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Serial Number & Issuing Authority */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tokenSerialNumber">Dongle Serial Number</Label>
                <Input
                  id="tokenSerialNumber"
                  placeholder="e.g. 2026-EPASS-99482"
                  value={tokenSerialNumber}
                  onChange={(e) => setTokenSerialNumber(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="issuingAuthority">Issuing Authority (CA)</Label>
                <Select
                  value={issuingAuthority}
                  onValueChange={(val) =>
                    setIssuingAuthority(val as DSCIssuingAuthority)
                  }
                >
                  <SelectTrigger id="issuingAuthority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eMudhra">eMudhra Consumer Services</SelectItem>
                    <SelectItem value="Capricorn">Capricorn Identity Services</SelectItem>
                    <SelectItem value="Vsign">Vsign (Verasys CA)</SelectItem>
                    <SelectItem value="Sify">Sify SafeScrypt</SelectItem>
                    <SelectItem value="IDSign">IDSign CA</SelectItem>
                    <SelectItem value="Other">Other Certifying Authority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates: Issue & Expiry */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="issueDate">
                  Issue Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">
                  Expiry Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Physical Location & Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="physicalLocation">
                  Physical Storage Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="physicalLocation"
                  placeholder='e.g. "Safe Box 1, Slot D-14"'
                  value={physicalLocation}
                  onChange={(e) => setPhysicalLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Custody Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as DSCStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Office">In Office Custody</SelectItem>
                    <SelectItem value="With Client">With Client</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Holder Name (if With Client) */}
            {status === "With Client" && (
              <div className="space-y-1.5">
                <Label htmlFor="currentHolderName">
                  Current Holder Name / Contact
                </Label>
                <Input
                  id="currentHolderName"
                  placeholder="e.g. Rajesh Kumar (Client Director)"
                  value={currentHolderName}
                  onChange={(e) => setCurrentHolderName(e.target.value)}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes / Purpose</Label>
              <Textarea
                id="notes"
                placeholder="e.g. Primary DSC used for MCA Annual Filings & GST portal sign-offs"
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update DSC" : "Register DSC"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
