"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Mail,
  UserPlus,
  Trash2,
  Pencil,
  Loader2,
  Search,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetUsersQuery,
  useGetRolesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/lib/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UsersSettingsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<any>(null);

  // Form states for inviting user
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [roleId, setRoleId] = useState("");
  const [secondaryRoleIds, setSecondaryRoleIds] = useState<string[]>([]);

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch,
  } = useGetUsersQuery({
    limit: 100,
  });
  const { data: rolesData, isLoading: isRolesLoading } =
    useGetRolesQuery(undefined);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users: any[] = usersData?.users || [];
  const roles: any[] = rolesData?.roles || [];

  // Non-superadmin roles available for invitation
  const assignableRoles = roles.filter((r) => !r.isSuperAdmin);

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const roleNames = [
      u.roleId?.name,
      ...(Array.isArray(u.roleIds) ? u.roleIds.map((r: any) => r?.name) : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      u.name?.toLowerCase().includes(term) ||
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      roleNames.includes(term)
    );
  });

  const handleOpenInvite = () => {
    setName("");
    setUsername("");
    setEmail("");
    setMobile("");
    setRoleId(assignableRoles[0]?._id || "");
    setSecondaryRoleIds([]);
    setIsInviteOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (
      !username ||
      username === name.toLowerCase().replace(/[^a-z0-9]/g, "")
    ) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, ""));
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !roleId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const combinedRoleIds = Array.from(
      new Set([roleId, ...secondaryRoleIds.filter((id) => id !== roleId)]),
    );

    try {
      await createUser({
        name,
        username,
        email,
        mobile,
        roleId,
        roleIds: combinedRoleIds,
      }).unwrap();

      toast.success(`Invitation link successfully emailed to ${email}!`);
      setIsInviteOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to invite user.");
    }
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setName(user.name || "");
    setMobile(user.mobile || "");
    const pRoleId = user.roleId?._id || user.roleId || "";
    setRoleId(pRoleId);

    let sRoleIds: string[] = [];
    if (Array.isArray(user.roleIds)) {
      sRoleIds = user.roleIds
        .map((r: any) => (typeof r === "object" ? r._id : r))
        .filter((id: string) => id && id !== pRoleId);
    }
    setSecondaryRoleIds(sRoleIds);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const combinedRoleIds = Array.from(
      new Set([roleId, ...secondaryRoleIds.filter((id) => id !== roleId)]),
    );

    try {
      await updateUser({
        id: selectedUser._id,
        name,
        mobile,
        roleId: selectedUser.isOwner ? undefined : roleId,
        roleIds: selectedUser.isOwner ? undefined : combinedRoleIds,
      }).unwrap();

      toast.success("User updated successfully.");
      setIsEditOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update user.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetUser) return;
    try {
      await deleteUser(deleteTargetUser._id).unwrap();
      toast.success(`User ${deleteTargetUser.name} removed successfully.`);
      setDeleteTargetUser(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Team & Staff Management
            </h1>
            <Badge variant="secondary" className="font-mono text-xs">
              {users.length} Members
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage practice members, accountants, and staff. Practice Owners
            maintain immutable Super Admin authority.
          </p>
        </div>

        <Button onClick={handleOpenInvite} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          <span>Invite Team Member</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Member</TableHead>
              <TableHead className="font-semibold">Email & Contact</TableHead>
              <TableHead className="font-semibold">Assigned Role</TableHead>
              <TableHead className="font-semibold">Authority</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUsersLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading team members...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isOwner = !!u.isOwner;
                const isInvited = u.invitationStatus === "invited";
                const roleName =
                  u.roleId?.name || (isOwner ? "Super Admin" : "Staff");

                return (
                  <TableRow key={u._id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shrink-0 ${
                            isOwner ? "bg-amber-600 shadow-sm" : "bg-primary"
                          }`}
                        >
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {u.name}
                            </span>
                            {isOwner && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 gap-1 text-[11px] py-0">
                                <Lock className="w-3 h-3" />
                                <span>Owner</span>
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            @{u.username}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-sm text-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{u.email || "No email"}</span>
                        </div>
                        {u.mobile && (
                          <div className="text-xs text-muted-foreground">
                            {u.mobile}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {isOwner ? (
                        <Badge
                          variant="outline"
                          className="border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-medium"
                        >
                          Super Admin
                        </Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/5 text-primary text-xs"
                          >
                            {u.roleId?.name || "Staff"}
                          </Badge>
                          {Array.isArray(u.roleIds) &&
                            u.roleIds
                              .filter((r: any) => {
                                const rId = typeof r === "object" ? r?._id : r;
                                const pId =
                                  typeof u.roleId === "object"
                                    ? u.roleId?._id
                                    : u.roleId;
                                return rId && rId !== pId;
                              })
                              .map((r: any) => (
                                <Badge
                                  key={typeof r === "object" ? r._id : r}
                                  variant="secondary"
                                  className="text-[11px] py-0 px-1.5 font-normal bg-muted text-muted-foreground border"
                                >
                                  +{typeof r === "object" ? r.name : "Role"}
                                </Badge>
                              ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isOwner ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Super Admin (Platform)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Shield className="h-3.5 w-3.5" />
                          <span>Tenant Scoped</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isInvited ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Invite Sent</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            u.isActive
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
                              : "border-border bg-muted text-muted-foreground"
                          }
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            "Inactive"
                          )}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 w-8 p-0"
                          title="Edit member details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {isOwner ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="h-8 w-8 p-0 opacity-40 cursor-not-allowed"
                            title="The Practice Owner cannot be deleted."
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTargetUser(u)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Remove member from practice"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Member Dialog (Option B: Email Invitation Link) */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Invite Team Member</span>
            </DialogTitle>
            <DialogDescription>
              An invitation email will be sent to the employee with a secure
              link to activate their account and set their password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Full Name *</Label>
              <Input
                id="inv-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-username">Username *</Label>
              <Input
                id="inv-username"
                placeholder="e.g. rahul_acc"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email Address *</Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="e.g. rahul@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                The invitation link will be sent directly to this address.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-role">Primary Role *</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="inv-role">
                  <SelectValue placeholder="Select member role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {assignableRoles.filter((r) => r._id !== roleId).length > 0 && (
              <div className="space-y-2 pt-1 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Additional Secondary Roles (Optional)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Union evaluation
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg border">
                  {assignableRoles
                    .filter((r) => r._id !== roleId)
                    .map((r) => {
                      const isChecked = secondaryRoleIds.includes(r._id);
                      return (
                        <label
                          key={r._id}
                          className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                            isChecked
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSecondaryRoleIds([
                                  ...secondaryRoleIds,
                                  r._id,
                                ]);
                              } else {
                                setSecondaryRoleIds(
                                  secondaryRoleIds.filter((id) => id !== r._id),
                                );
                              }
                            }}
                          />
                          <span className="truncate">{r.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="inv-mobile">Mobile Number (Optional)</Label>
              <Input
                id="inv-mobile"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Invite...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              <span>Edit Team Member</span>
            </DialogTitle>
            <DialogDescription>
              Update contact information and assigned permissions role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role">Primary Role</Label>
              {selectedUser?.isOwner ? (
                <div className="p-2.5 rounded-lg border bg-muted/40 text-sm flex items-center justify-between text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Super Admin
                  </span>
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-300 text-amber-700 bg-amber-50"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Immutable Owner Role</span>
                  </Badge>
                </div>
              ) : (
                <>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select member role" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((r) => (
                        <SelectItem key={r._id} value={r._id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {assignableRoles.filter((r) => r._id !== roleId).length >
                    0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-foreground">
                          Additional Secondary Roles (Optional)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Union evaluation
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2.5 rounded-lg border">
                        {assignableRoles
                          .filter((r) => r._id !== roleId)
                          .map((r) => {
                            const isChecked = secondaryRoleIds.includes(r._id);
                            return (
                              <label
                                key={r._id}
                                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                                  isChecked
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-muted text-foreground"
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSecondaryRoleIds([
                                        ...secondaryRoleIds,
                                        r._id,
                                      ]);
                                    } else {
                                      setSecondaryRoleIds(
                                        secondaryRoleIds.filter(
                                          (id) => id !== r._id,
                                        ),
                                      );
                                    }
                                  }}
                                />
                                <span className="truncate">{r.name}</span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteTargetUser}
        onOpenChange={(open) => !open && setDeleteTargetUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Remove Team Member?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleteTargetUser?.name}</strong> (@
              {deleteTargetUser?.username}) from this practice? This action will
              revoke their login access immediately. Past task histories and
              audit logs will remain intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
