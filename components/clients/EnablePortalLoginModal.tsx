"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Copy,
  Check,
  Globe,
  Share2,
  Mail,
  Phone,
  User,
  KeyRound,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useGetClientPortalUsersQuery,
  useCreateClientPortalUserMutation,
  useToggleClientPortalAccessMutation,
} from "@/lib/services/api";

interface EnablePortalLoginModalProps {
  clientId: string;
  client: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EnablePortalLoginModal({
  clientId,
  client,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: EnablePortalLoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const { data: portalData, isLoading: isLoadingUsers } = useGetClientPortalUsersQuery(clientId, {
    skip: !isOpen,
  });

  const [toggleAccess, { isLoading: isToggling }] = useToggleClientPortalAccessMutation();
  const [createUser, { isLoading: isCreating }] = useCreateClientPortalUserMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: client?.contactPersonName || client?.name || "",
    email: client?.email || "",
    phone: client?.mobile || "",
    password: "",
    isPrimaryContact: true,
  });

  const isPortalEnabled = portalData?.allowLogin ?? client?.allowLogin ?? false;
  const portalUsers = portalData?.users || [];
  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/portal/login` : "/portal/login";

  const handleToggle = async (checked: boolean) => {
    try {
      await toggleAccess({ clientId, allowLogin: checked }).unwrap();
      toast.success(checked ? "Client portal access enabled" : "Client portal access disabled");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.data?.message || "Failed to toggle portal access");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    toast.success("Portal link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = (userEmail?: string) => {
    const message = encodeURIComponent(
      `Hello ${formData.name || client?.name},\n\nYour client portal access for ${client?.name} is ready! You can review compliance deadlines, download tax returns, and inspect invoices here:\n\n🔗 ${portalUrl}\n\nLogin with your email or phone number.`
    );
    window.open(`https://wa.me/${(formData.phone || client?.mobile || "").replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in name, email, and phone");
      return;
    }

    try {
      await createUser({
        clientId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        isPrimaryContact: formData.isPrimaryContact,
      }).unwrap();

      toast.success("Client portal user created successfully!");
      setShowAddForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        isPrimaryContact: false,
      });
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.data?.message || "Failed to create portal user");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5 text-primary" />
            Portal Access
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Client Portal Access & Login</DialogTitle>
              <DialogDescription className="text-xs">
                Manage external portal login credentials for <strong>{client?.name}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Master Access Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <div className="font-semibold flex items-center gap-2">
                {isPortalEnabled ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Portal Login Access</span>
                <Badge
                  variant="outline"
                  className={
                    isPortalEnabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {isPortalEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                When enabled, verified contacts can sign in via OTP or Password.
              </p>
            </div>
            <Switch
              checked={isPortalEnabled}
              disabled={isToggling}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Quick Share Link Box */}
          <div className="p-3 rounded-lg border bg-card space-y-2">
            <Label className="text-xs font-semibold">Client Portal URL</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={portalUrl}
                className="font-mono text-xs bg-muted/40 h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-1.5 shrink-0 text-xs h-8"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedLink ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleWhatsAppShare()}
                className="gap-1.5 shrink-0 text-xs h-8 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Portal Authorized Users */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">
                Authorized Portal Users ({portalUsers.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-7 text-xs gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {showAddForm ? "Cancel" : "Add Portal User"}
              </Button>
            </div>

            {/* List of active portal contacts */}
            <div className="space-y-2">
              {portalUsers.map((u: any) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>{u.name}</span>
                      {u.isPrimaryContact && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {u.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {u.phone}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {u.status || "Active"}
                  </Badge>
                </div>
              ))}

              {portalUsers.length === 0 && !showAddForm && (
                <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                  <p>No portal users authorized yet.</p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="text-xs text-primary"
                  >
                    + Invite primary contact now
                  </Button>
                </div>
              )}
            </div>

            {/* Add User Form (Phase F-125) */}
            {showAddForm && (
              <form onSubmit={handleCreateUser} className="p-3 rounded-lg border bg-muted/20 space-y-3 mt-2">
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-primary" /> Invite New Portal User
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Email Address *</Label>
                    <Input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mobile Number *</Label>
                    <Input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Initial Password (Optional — OTP login is active)</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank for OTP-only access"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="is-primary"
                    checked={formData.isPrimaryContact}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPrimaryContact: !!checked })}
                  />
                  <Label htmlFor="is-primary" className="text-xs cursor-pointer">
                    Set as Primary Contact for this organization
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    className="text-xs h-8 gap-1"
                  >
                    {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Create & Authorize
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

