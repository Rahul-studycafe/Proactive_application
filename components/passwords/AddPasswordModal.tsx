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
  useCreatePasswordMutation,
  useUpdatePasswordMutation,
  useGetPortalsQuery,
  useGetClientsQuery,
} from "@/lib/services/api";
import { ClientPassword, PortalMaster } from "@/lib/types/passwords";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Globe,
  User,
  FileText,
  Calendar,
  Lock,
  Sparkles,
  Building2,
} from "lucide-react";

interface AddPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  credentialToEdit?: ClientPassword | null;
}

export function AddPasswordModal({
  open,
  onOpenChange,
  clientId,
  credentialToEdit,
}: AddPasswordModalProps) {
  const isEditing = !!credentialToEdit;

  const { data: portals = [], isLoading: isLoadingPortals } = useGetPortalsQuery(undefined, {
    skip: !open,
  });

  const { data: clientsData } = useGetClientsQuery(
    { limit: 100 },
    { skip: !open || !!clientId }
  );
  const clients = clientsData?.clients || [];
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [createPassword, { isLoading: isCreating }] = useCreatePasswordMutation();
  const [updatePassword, { isLoading: isUpdating }] = useUpdatePasswordMutation();
  const isSubmitting = isCreating || isUpdating;

  const [selectedPortalMode, setSelectedPortalMode] = useState<string>("");
  const [portalName, setPortalName] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [portalId, setPortalId] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [lastVerifiedDate, setLastVerifiedDate] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sync form state when modal opens or credentialToEdit changes
  useEffect(() => {
    if (open) {
      if (credentialToEdit) {
        setPortalName(credentialToEdit.portalName || "");
        setPortalUrl(credentialToEdit.portalUrl || "");
        setPortalId(credentialToEdit.portalId);
        setUsername(credentialToEdit.username || "");
        setPassword(""); // Clear password field on edit for security
        setNotes(credentialToEdit.notes || "");
        setLastVerifiedDate(
          credentialToEdit.lastVerifiedDate
            ? new Date(credentialToEdit.lastVerifiedDate).toISOString().split("T")[0]
            : ""
        );

        // Check if matches an existing master
        const matched = portals.find(
          (p) => p.name.toLowerCase() === (credentialToEdit.portalName || "").toLowerCase()
        );
        if (matched) {
          setSelectedPortalMode(matched._id);
        } else {
          setSelectedPortalMode("custom");
        }
      } else {
        // Reset form for new addition
        setSelectedPortalMode("");
        setPortalName("");
        setPortalUrl("");
        setPortalId(undefined);
        setUsername("");
        setPassword("");
        setNotes("");
        setLastVerifiedDate(new Date().toISOString().split("T")[0]);
      }
      setShowPassword(false);
    }
  }, [open, credentialToEdit, portals]);

  const handlePortalSelect = (val: string) => {
    setSelectedPortalMode(val);
    if (val === "custom") {
      setPortalId(undefined);
      setPortalName("");
      setPortalUrl("");
    } else {
      const found = portals.find((p) => p._id === val);
      if (found) {
        setPortalId(found._id);
        setPortalName(found.name);
        setPortalUrl(found.portalUrl || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portalName.trim()) {
      toast.error("Please select or enter a portal name");
      return;
    }
    if (!username.trim()) {
      toast.error("Username / ID is required");
      return;
    }
    if (!isEditing && !password.trim()) {
      toast.error("Password is required for new credential");
      return;
    }

    const targetClientId =
      clientId ||
      selectedClientId ||
      (typeof credentialToEdit?.clientId === "object"
        ? credentialToEdit.clientId?._id
        : credentialToEdit?.clientId);

    if (!targetClientId) {
      toast.error("Please select a client account");
      return;
    }

    try {
      if (isEditing && credentialToEdit) {
        await updatePassword({
          id: credentialToEdit._id,
          payload: {
            portalId,
            portalName: portalName.trim(),
            portalUrl: portalUrl.trim() || undefined,
            username: username.trim(),
            password: password.trim() ? password.trim() : undefined,
            notes: notes.trim() || undefined,
            lastVerifiedDate: lastVerifiedDate || undefined,
          },
        }).unwrap();

        toast.success("Client credential updated successfully");
      } else {
        await createPassword({
          clientId: targetClientId,
          portalId,
          portalName: portalName.trim(),
          portalUrl: portalUrl.trim() || undefined,
          username: username.trim(),
          password: password.trim(),
          notes: notes.trim() || undefined,
          lastVerifiedDate: lastVerifiedDate || undefined,
        }).unwrap();

        toast.success("Credential securely encrypted and saved to vault");
      }

      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to save credential";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-border/70 shadow-2xl">
        {/* Header with decorative badge and gradient */}
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isEditing ? "Edit Portal Credential" : "Add Portal Credential"}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" /> AES-256 Encrypted
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? "Update portal login credentials. Passwords are re-encrypted with randomized IV."
                  : "Store statutory portal login details securely. Data is protected with cryptographic encryption."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client Selection (when accessed from Master Vault) */}
          {!clientId && !isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>
                  Client Account <span className="text-destructive">*</span>
                </span>
              </Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="w-full h-9 text-xs bg-background">
                  <SelectValue placeholder="Select client entity..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {c.fileNo && (
                          <span className="text-muted-foreground font-mono text-[11px]">
                            ({c.fileNo})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Portal Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Portal / Authority <span className="text-destructive">*</span></span>
              {portalUrl && (
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-normal"
                >
                  <Globe className="h-3 w-3" /> Visit Portal
                </a>
              )}
            </Label>
            <Select
              value={selectedPortalMode}
              onValueChange={handlePortalSelect}
              disabled={isLoadingPortals}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Choose portal (e.g. GST, Income Tax, MCA)" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {portals.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">({p.category})</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>+ Custom / Other Portal</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* If Custom Portal Selected */}
          {selectedPortalMode === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  Custom Portal Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="e.g. State Commercial Taxes, DGFT"
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  Portal URL (Optional)
                </Label>
                <Input
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  placeholder="https://example.gov.in"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          {/* Username & Password Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Username / Login ID <span className="text-destructive">*</span>
              </Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 27AAAAA0000A1Z5 / PAN"
                className="h-9 font-mono text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password {!isEditing && <span className="text-destructive">*</span>}
                </span>
                {isEditing && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    (Leave empty to retain)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? "•••••••• (unchanged)" : "Enter login password"}
                  className="h-9 pr-9 font-mono text-sm"
                  required={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Last Verified Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Last Verified
              </Label>
              <Input
                type="date"
                value={lastVerifiedDate}
                onChange={(e) => setLastVerifiedDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Security Notes / PIN / OTP Instructions
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. OTP sent to Director mobile ending in 4920; 6-digit PIN is 987654"
                rows={2}
                className="resize-none text-xs min-h-[40px]"
              />
            </div>
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
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </div>
              ) : isEditing ? (
                "Update Credential"
              ) : (
                "Save & Encrypt"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
