"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Lock,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetRolesQuery,
  useGetPermissionsCatalogueQuery,
  useDeleteRoleMutation,
  useDuplicateRoleMutation,
} from "@/lib/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export function UserRolesSettingsView() {
  const router = useRouter();

  const { data: rolesData, isLoading: isLoadingRoles } =
    useGetRolesQuery(undefined);
  const { data: catalogueData } = useGetPermissionsCatalogueQuery(undefined);

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
  const [duplicateRole, { isLoading: isDuplicating }] =
    useDuplicateRoleMutation();

  const roles: any[] = rolesData?.roles || [];
  const catalogue: any[] = catalogueData?.catalogue || [];

  // Search filter for roles table
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Alert State
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);

  // Filter roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [roles, searchQuery]);

  // Duplicate Role
  const handleDuplicate = async (role: any) => {
    try {
      await duplicateRole(role._id).unwrap();
      toast.success(`Duplicated role "${role.name}"`);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to duplicate role",
      );
    }
  };

  // Delete Role Confirm
  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete._id).unwrap();
      toast.success(`Role "${roleToDelete.name}" deleted successfully`);
      setRoleToDelete(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to delete role",
      );
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">
              Roles & Permissions
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure dynamic roles and control what team members can view,
            edit, delete, and export.
          </p>
        </div>

        <Button
          onClick={() => router.push("/settings/roles/new")}
          className="gap-2 shrink-0 font-medium"
        >
          <Plus className="h-4 w-4" /> Create Custom Role
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {filteredRoles.length} role{filteredRoles.length === 1 ? "" : "s"}{" "}
          defined
        </div>
      </div>

      {/* Roles Table */}
      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[240px]">Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[140px] text-center">
                Assigned Users
              </TableHead>
              <TableHead className="w-[160px] text-center">
                Permissions
              </TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingRoles ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Loading roles and permissions...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  No roles found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => {
                const assignedCount = role.assignedUsersCount || 0;

                // Count allowed permissions
                let allowedCount = 0;
                if (role.isSuperAdmin) {
                  allowedCount = catalogue.length;
                } else if (role.permissions) {
                  Object.values(role.permissions).forEach((val: any) => {
                    if (val?.allowed) allowedCount++;
                    else if (typeof val === "object") {
                      Object.values(val).forEach((sub: any) => {
                        if (sub?.allowed) allowedCount++;
                      });
                    }
                  });
                }

                return (
                  <TableRow key={role._id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.isSuperAdmin ? (
                          <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded bg-primary/10 text-primary">
                            <Shield className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span className="font-semibold">{role.name}</span>
                        {role.isSuperAdmin && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 font-medium"
                          >
                            Owner / Full Access
                          </Badge>
                        )}
                        {role.isSystemDefault && !role.isSuperAdmin && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal"
                          >
                            Standard
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                      {role.description || "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs font-normal">
                        {assignedCount} member{assignedCount === 1 ? "" : "s"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <span className="text-xs font-medium">
                        {role.isSuperAdmin
                          ? "All Permissions (*:*)"
                          : `${allowedCount} allowed`}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Role & Permissions"
                          onClick={() =>
                            router.push(`/settings/roles/${role._id}`)
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {!role.isSuperAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Duplicate Role"
                              disabled={isDuplicating}
                              onClick={() => handleDuplicate(role)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title={
                                assignedCount > 0
                                  ? `Cannot delete while ${assignedCount} user(s) assigned`
                                  : "Delete Role"
                              }
                              disabled={
                                assignedCount > 0 || role.isSystemDefault
                              }
                              onClick={() => setRoleToDelete(role)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Role &quot;{roleToDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this custom role? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
