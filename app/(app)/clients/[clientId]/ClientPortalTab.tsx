"use client";

import { useState } from "react";
import {
  Globe,
  KeyRound,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Copy,
  Check,
  Lock,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useGetClientPortalUsersQuery,
  useCreateClientPortalUserMutation,
  useUpdateClientPortalUserMutation,
  useDeleteClientPortalUserMutation,
  useResetClientPortalUserPasswordMutation,
  useToggleClientPortalAccessMutation,
} from "@/lib/services/api";

interface ClientPortalTabProps {
  clientId: string;
  client: any;
}

export function ClientPortalTab({ clientId, client }: ClientPortalTabProps) {
  const {
    data: portalData,
    isLoading,
    refetch,
  } = useGetClientPortalUsersQuery(clientId);
  const [toggleAccess, { isLoading: isToggling }] =
    useToggleClientPortalAccessMutation();
  const [createUser, { isLoading: isCreating }] =
    useCreateClientPortalUserMutation();
  const [updateUser, { isLoading: isUpdating }] =
    useUpdateClientPortalUserMutation();
  const [deleteUser, { isLoading: isDeleting }] =
    useDeleteClientPortalUserMutation();
  const [resetPassword, { isLoading: isResetting }] =
    useResetClientPortalUserPasswordMutation();

  const [copied, setCopied] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTargetUser, setDeleteTargetUser] = useState<any | null>(null);

  // Form states for creating a new portal user
  const [formData, setFormData] = useState({
    name: client?.contactPersonName || "",
    email: client?.email || "",
    phone: client?.mobile || "",
    password: "",
    isPrimaryContact: true,
  });

  const portalUsers = portalData?.users || [];
  const isPortalEnabled = portalData?.allowLogin ?? client?.allowLogin ?? false;

  const handleCopyLink = () => {
    const portalUrl = `${window.location.origin}/portal/login`;
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success("Portal link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePortal = async (checked: boolean) => {
    try {
      await toggleAccess({ clientId, allowLogin: checked }).unwrap();
      toast.success(
        checked
          ? "Client portal access enabled"
          : "Client portal access disabled",
      );
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to update portal access",
      );
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
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

      toast.success("Portal user created successfully");
      setIsAddUserOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        isPrimaryContact: false,
      });
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to create portal user",
      );
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserData) return;

    try {
      await updateUser({
        clientId,
        userId: editUserData._id,
        name: editUserData.name,
        email: editUserData.email,
        phone: editUserData.phone,
        isPrimaryContact: editUserData.isPrimaryContact,
        isActive: editUserData.isActive,
      }).unwrap();

      toast.success("Portal user updated");
      setEditUserData(null);
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to update portal user",
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await resetPassword({
        clientId,
        userId: resetPasswordUser._id,
        newPassword,
      }).unwrap();

      toast.success("Password reset successfully");
      setResetPasswordUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to reset password",
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;

    try {
      await deleteUser({
        clientId,
        userId: deleteTargetUser._id,
      }).unwrap();

      toast.success("Portal user deleted");
      setDeleteTargetUser(null);
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to delete portal user",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Activation Banner */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="p-5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Client Self-Service Portal Access
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Allow {client.name} representatives to sign into their
                    secure compliance portal.
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isPortalEnabled}
                  onCheckedChange={handleTogglePortal}
                  disabled={isToggling}
                  id="portal-toggle"
                />
                <Label
                  htmlFor="portal-toggle"
                  className="text-sm font-medium cursor-pointer"
                >
                  {isPortalEnabled ? "Portal Active" : "Portal Disabled"}
                </Label>
              </div>

              <Badge
                variant="outline"
                className={
                  isPortalEnabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5"
                    : "border-muted-foreground/30 bg-muted text-muted-foreground gap-1.5"
                }
              >
                {isPortalEnabled ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Enabled
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" /> Disabled
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-0">
          <div className="rounded-lg bg-muted/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Portal URL:</span>
              <code className="bg-background px-2 py-0.5 rounded border border-border/80 font-mono text-[11px]">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/portal/login`
                  : "/portal/login"}
              </code>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 shrink-0 self-start sm:self-auto"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy Portal Link"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Portal Users Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Authorized Login
              Representatives
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individuals with login rights to view filing status, tax records,
              and invoices for {client.name}.
            </p>
          </div>

          <Button
            size="sm"
            className="gap-2 shadow-xs"
            onClick={() => setIsAddUserOpen(true)}
            disabled={!isPortalEnabled}
          >
            <Plus className="h-4 w-4" /> Add Portal User
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : portalUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                <User className="h-6 w-6 opacity-60" />
              </div>
              <h4 className="text-sm font-semibold">No Portal Users Added</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                No user credentials have been created for this client yet. Add
                the director, proprietor, or accountant to grant them
                self-service access.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setIsAddUserOpen(true)}
                disabled={!isPortalEnabled}
              >
                <Plus className="h-4 w-4" /> Add First Portal User
              </Button>
            </div>
          ) : (
            <div className="divide-y border-t border-border/80">
              {portalUsers.map((user: any) => (
                <div
                  key={user._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {user.name}
                        </span>
                        {user.isPrimaryContact && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-medium bg-primary/10 text-primary"
                          >
                            Primary Contact
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? "text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "text-[10px] border-muted-foreground/30 bg-muted text-muted-foreground"
                          }
                        >
                          {user.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 opacity-70" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 opacity-70" />
                          {user.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 opacity-70" />
                          Last login:{" "}
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setResetPasswordUser(user)}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset Password
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setEditUserData({ ...user })}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTargetUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Portal User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Add Portal User</DialogTitle>
              <DialogDescription>
                Create credentials for a client representative to log in to the
                portal.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email Address *</Label>
                <Input
                  id="user-email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-phone">Mobile Number *</Label>
                <Input
                  id="user-phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-password">
                  Initial Password (Optional)
                </Label>
                <Input
                  id="user-password"
                  type="text"
                  placeholder="Leave blank for default: Client@123"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  The user can also sign in friction-free using 6-digit OTP to
                  mobile/email.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="primary-contact"
                  checked={formData.isPrimaryContact}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPrimaryContact: !!checked })
                  }
                />
                <Label
                  htmlFor="primary-contact"
                  className="text-xs font-normal cursor-pointer"
                >
                  Designate as Primary Client Representative
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Portal User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Portal User Dialog */}
      <Dialog
        open={!!editUserData}
        onOpenChange={(open) => !open && setEditUserData(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          {editUserData && (
            <form onSubmit={handleUpdateUser}>
              <DialogHeader>
                <DialogTitle>Edit Portal User</DialogTitle>
                <DialogDescription>
                  Update user contact details and access status.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editUserData.name}
                    onChange={(e) =>
                      setEditUserData({ ...editUserData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editUserData.email}
                    onChange={(e) =>
                      setEditUserData({
                        ...editUserData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone">Mobile Number</Label>
                  <Input
                    id="edit-phone"
                    value={editUserData.phone}
                    onChange={(e) =>
                      setEditUserData({
                        ...editUserData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-active"
                      checked={editUserData.isActive}
                      onCheckedChange={(checked) =>
                        setEditUserData({
                          ...editUserData,
                          isActive: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="edit-active"
                      className="text-xs cursor-pointer"
                    >
                      User Account Active
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-primary"
                      checked={editUserData.isPrimaryContact}
                      onCheckedChange={(checked) =>
                        setEditUserData({
                          ...editUserData,
                          isPrimaryContact: !!checked,
                        })
                      }
                    />
                    <Label
                      htmlFor="edit-primary"
                      className="text-xs cursor-pointer"
                    >
                      Primary Contact
                    </Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUserData(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Reset Portal Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resetPasswordUser?.name} (
                {resetPasswordUser?.email}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">
                  New Password (Min. 6 chars)
                </Label>
                <Input
                  id="new-password"
                  type="text"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordUser(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={!!deleteTargetUser}
        onOpenChange={(open) => !open && setDeleteTargetUser(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove Portal User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete portal access for{" "}
              <strong>{deleteTargetUser?.name}</strong>? They will no longer be
              able to sign in.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
