"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Edit2,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Star,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useGetBillingEntitiesQuery,
  useCreateBillingEntityMutation,
  useUpdateBillingEntityMutation,
  useDeleteBillingEntityMutation,
} from "@/lib/services/api";

export default function BillingEntitiesPage() {
  const { data: entities = [], isLoading } = useGetBillingEntitiesQuery();
  const [createEntity, { isLoading: isCreating }] =
    useCreateBillingEntityMutation();
  const [updateEntity, { isLoading: isUpdating }] =
    useUpdateBillingEntityMutation();
  const [deleteEntity, { isLoading: isDeleting }] =
    useDeleteBillingEntityMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any | null>(null);

  // Form State
  const [branchName, setBranchName] = useState("");
  const [legalEntityName, setLegalEntityName] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-MUM-");
  const [receiptPrefix, setReceiptPrefix] = useState("RCT-MUM-");
  const [isDefault, setIsDefault] = useState(false);

  // Bank Details State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [upiId, setUpiId] = useState("");

  const handleOpenCreate = () => {
    setEditingEntity(null);
    setBranchName("");
    setLegalEntityName("");
    setGstin("");
    setPan("");
    setStateCode("");
    setContactEmail("");
    setContactPhone("");
    setInvoicePrefix("INV-BR-");
    setReceiptPrefix("RCT-BR-");
    setIsDefault(entities.length === 0);
    setBankName("");
    setAccountNumber("");
    setIfsc("");
    setBankBranch("");
    setUpiId("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entity: any) => {
    setEditingEntity(entity);
    setBranchName(entity.branchName || entity.name || "");
    setLegalEntityName(entity.legalEntityName || entity.entityName || "");
    setGstin(entity.gstin || "");
    setPan(entity.pan || "");
    setStateCode(entity.stateCode || "");
    setContactEmail(entity.contactEmail || "");
    setContactPhone(entity.contactPhone || "");
    setInvoicePrefix(entity.invoicePrefix || "INV/");
    setReceiptPrefix(entity.receiptPrefix || "RCT/");
    setIsDefault(entity.isDefault || false);
    setBankName(entity.bankDetails?.bankName || "");
    setAccountNumber(entity.bankDetails?.accountNumber || "");
    setIfsc(entity.bankDetails?.ifsc || "");
    setBankBranch(entity.bankDetails?.branch || "");
    setUpiId(entity.bankDetails?.upiId || entity.upiId || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !legalEntityName.trim()) {
      toast.error("Branch name and legal entity name are required");
      return;
    }

    const payload = {
      branchName: branchName.trim(),
      name: branchName.trim(),
      legalEntityName: legalEntityName.trim(),
      entityName: legalEntityName.trim(),
      gstin: gstin.trim().toUpperCase(),
      pan: pan.trim().toUpperCase(),
      stateCode: stateCode.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      invoicePrefix: invoicePrefix.trim(),
      receiptPrefix: receiptPrefix.trim(),
      isDefault,
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        branch: bankBranch.trim(),
        upiId: upiId.trim(),
      },
      upiId: upiId.trim(),
    };

    try {
      if (editingEntity) {
        await updateEntity({ id: editingEntity._id, ...payload }).unwrap();
        toast.success("Billing entity updated successfully");
      } else {
        await createEntity(payload).unwrap();
        toast.success("New branch billing entity registered successfully");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to save billing entity",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (
      confirm("Are you sure you want to remove this billing entity branch?")
    ) {
      try {
        await deleteEntity(id).unwrap();
        toast.success("Billing entity removed");
      } catch (err: any) {
        toast.error(
          err?.data?.error?.message ||
            err?.data?.message ||
            "Failed to delete billing entity",
        );
      }
    }
  };

  const handleSetDefault = async (entity: any) => {
    try {
      await updateEntity({ id: entity._id, isDefault: true }).unwrap();
      toast.success(
        `${entity.branchName || entity.name} is now the default billing entity`,
      );
    } catch (err: any) {
      toast.error("Failed to update default billing entity");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Multi-Branch &
            Regional Billing Entities
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure regional office branches (e.g. Mumbai, Bengaluru, Delhi)
            with distinct GSTIN, state codes, bank accounts, and isolated
            invoice serial numbering.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 text-xs shadow-xs">
          <Plus className="h-4 w-4" /> Add Regional Branch
        </Button>
      </div>

      {/* Branch Cards Grid (Phase F-141) */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : entities.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold">
            No Regional Branches Configured
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Add your primary practice entity and any regional branches to enable
            branch-isolated serial invoicing.
          </p>
          <Button
            onClick={handleOpenCreate}
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Register First Entity
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {entities.map((entity: any) => (
            <Card
              key={entity._id}
              className={`border-border/80 shadow-xs bg-card hover:shadow-md transition-all flex flex-col justify-between ${
                entity.isDefault ? "ring-2 ring-primary/30" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    State Code: {entity.stateCode || "—"}
                  </Badge>
                  {entity.isDefault ? (
                    <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
                      <Star className="h-3 w-3 fill-current" /> Default Branch
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(entity)}
                      className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Make Default
                    </Button>
                  )}
                </div>

                <CardTitle className="text-base font-bold text-foreground mt-2">
                  {entity.branchName || entity.name}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  {entity.legalEntityName || entity.entityName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs pt-0 flex-1">
                {/* Tax Identifiers */}
                <div className="p-2.5 rounded-lg border bg-muted/20 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GSTIN:</span>
                    <span className="font-semibold text-foreground">
                      {entity.gstin || "Not Registered"}
                    </span>
                  </div>
                  {entity.pan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PAN:</span>
                      <span className="font-semibold">{entity.pan}</span>
                    </div>
                  )}
                </div>

                {/* Sequence Prefixes */}
                <div className="space-y-1 text-[11px] pt-1">
                  <span className="text-muted-foreground block font-semibold">
                    Atomic Number Sequences:
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      Invoice: {entity.invoicePrefix || "INV/"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                    >
                      Receipt: {entity.receiptPrefix || "RCT/"}
                    </Badge>
                  </div>
                </div>

                {/* Bank Details */}
                {entity.bankDetails?.bankName && (
                  <div className="p-2 rounded-lg border bg-card text-[11px] space-y-0.5">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-primary" />{" "}
                      {entity.bankDetails.bankName}
                    </span>
                    <p className="font-mono text-muted-foreground">
                      A/C: {entity.bankDetails.accountNumber} (
                      {entity.bankDetails.ifsc})
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 border-t flex justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(entity)}
                  className="h-7 text-xs gap-1"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </Button>
                {!entity.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entity._id)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Billing Entity Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {editingEntity
                ? "Edit Regional Billing Entity"
                : "Add Regional Branch Billing Entity"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure branch name, GSTIN, legal registration, and sequence
              prefixes for this office.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Branch Name *</Label>
                <Input
                  required
                  placeholder="e.g. Mumbai - Main Office"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  Legal Entity Name *
                </Label>
                <Input
                  required
                  placeholder="e.g. Sharma & Co. Chartered Accountants"
                  value={legalEntityName}
                  onChange={(e) => setLegalEntityName(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Branch GSTIN</Label>
                <Input
                  placeholder="27AABCS1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="text-xs font-mono uppercase"
                  maxLength={15}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Entity PAN</Label>
                <Input
                  placeholder="AABCS1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="text-xs font-mono uppercase"
                  maxLength={10}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">GST State Code</Label>
                <Input
                  placeholder="e.g. 27"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="text-xs font-mono"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Sequence Prefixes */}
            <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
              <span className="font-semibold text-xs text-foreground block">
                Branch-Isolated Numbering Sequences:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Invoice Prefix</Label>
                  <Input
                    placeholder="INV-MUM-"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Generates: {invoicePrefix}001, {invoicePrefix}002
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Receipt Prefix</Label>
                  <Input
                    placeholder="RCT-MUM-"
                    value={receiptPrefix}
                    onChange={(e) => setReceiptPrefix(e.target.value)}
                    className="text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Generates: {receiptPrefix}001, {receiptPrefix}002
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-2 pt-2 border-t">
              <span className="font-semibold text-xs text-foreground block">
                Branch Bank Account & UPI
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Bank Name</Label>
                  <Input
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Account Number</Label>
                  <Input
                    placeholder="502000xxxxxxxx"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">IFSC Code</Label>
                  <Input
                    placeholder="HDFC0000001"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Bank Branch</Label>
                  <Input
                    placeholder="Nariman Point"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">UPI VPA</Label>
                  <Input
                    placeholder="mumbai@hdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Set as Default */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">
                  Default Billing Entity
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  New invoices and quotations will automatically route to this
                  entity by default.
                </p>
              </div>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <DialogFooter className="pt-2 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || isUpdating}
                className="text-xs shadow-xs"
              >
                {isCreating || isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : null}
                Save Branch Entity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
