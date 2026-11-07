"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Check,
  Search,
  X,
  Sparkles,
  Save,
  CheckCircle2,
  RotateCcw,
  Landmark,
  FileSpreadsheet,
  CreditCard,
  Receipt,
  Layers,
  KeyRound,
  Lock,
  Files,
  CalendarCheck,
  BarChart3,
  Settings2,
  Users,
  CheckSquare,
  AlertTriangle,
  Loader2,
  Info,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetRoleByIdQuery,
  useGetPermissionsCatalogueQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "@/lib/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface RoleEditorPageContentProps {
  roleId?: string; // If undefined or "new", it's Create mode
}

const CATEGORY_ICONS: Record<string, any> = {
  "Clients & CRM": Users,
  "Tasks & Workflows": CheckSquare,
  "Billing & Invoices": Landmark,
  "Quotations": FileSpreadsheet,
  "Receipts & Payments": CreditCard,
  "Expenses & Outlays": Receipt,
  "Services & Packages": Layers,
  "DSC Management": KeyRound,
  "Password Vault": Lock,
  "Documents": Files,
  "HR & Attendance": CalendarCheck,
  "Reports & Analytics": BarChart3,
  "Firm Administration": Settings2,
};

const SCOPE_EXPLANATIONS: Record<string, string> = {
  everything: "Unrestricted access across all clients, records, and staff members.",
  team_only: "Restricted to records belonging to the user's assigned department or branch.",
  assigned_only: "Strictly restricted to records where this user is directly assigned or creator.",
};

export function RoleEditorPageContent({ roleId }: RoleEditorPageContentProps) {
  const router = useRouter();
  const isNew = !roleId || roleId === "new";

  // Queries & Mutations
  const {
    data: roleData,
    isLoading: isLoadingRole,
    isError: isRoleError,
  } = useGetRoleByIdQuery(roleId as string, {
    skip: isNew,
  });

  const {
    data: catalogueData,
    isLoading: isLoadingCatalogue,
  } = useGetPermissionsCatalogueQuery(undefined);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const catalogue: any[] = catalogueData?.catalogue || [];
  const categories: string[] = catalogueData?.categories || [];
  const blueprints: any[] = catalogueData?.blueprints || [];

  const existingRole = roleData?.role;
  const isSuperAdmin = Boolean(existingRole?.isSuperAdmin);

  // Form State
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionsState, setPermissionsState] = useState<
    Record<string, { allowed: boolean; scope: "everything" | "team_only" | "assigned_only" }>
  >({});
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initialBaseline, setInitialBaseline] = useState<{
    name: string;
    description: string;
    permissions: Record<string, { allowed: boolean; scope: "everything" | "team_only" | "assigned_only" }>;
  } | null>(null);

  // Set default active category once categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Initialize permissions on load
  useEffect(() => {
    if (!catalogue.length) return;

    if (isNew) {
      if (!hasInitialized) {
        const initial: Record<string, { allowed: boolean; scope: "everything" | "team_only" | "assigned_only" }> = {};
        catalogue.forEach((p) => {
          initial[p.id] = { allowed: false, scope: "everything" };
        });
        setPermissionsState(initial);
        setInitialBaseline({
          name: "",
          description: "",
          permissions: initial,
        });
        setHasInitialized(true);
      }
    } else if (existingRole && !hasInitialized) {
      setRoleName(existingRole.name || "");
      setRoleDescription(existingRole.description || "");

      const initial: Record<string, { allowed: boolean; scope: "everything" | "team_only" | "assigned_only" }> = {};
      const existing = existingRole.permissions || {};

      catalogue.forEach((p) => {
        if (existing[p.id] && typeof existing[p.id] === "object") {
          initial[p.id] = {
            allowed: Boolean(existing[p.id].allowed),
            scope: existing[p.id].scope || "everything",
          };
        } else if (existing[p.resource] && existing[p.resource][p.action]) {
          initial[p.id] = {
            allowed: Boolean(existing[p.resource][p.action].allowed),
            scope: existing[p.resource][p.action].scope || "everything",
          };
        } else {
          initial[p.id] = { allowed: false, scope: "everything" };
        }
      });

      setPermissionsState(initial);
      setInitialBaseline({
        name: existingRole.name || "",
        description: existingRole.description || "",
        permissions: initial,
      });
      setHasInitialized(true);
    }
  }, [catalogue, existingRole, isNew, hasInitialized]);

  // Compute allowed counts per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; allowed: number }> = {};
    categories.forEach((cat) => {
      const items = catalogue.filter((p) => p.category === cat);
      const allowed = items.filter((p) => permissionsState[p.id]?.allowed).length;
      stats[cat] = { total: items.length, allowed };
    });
    return stats;
  }, [categories, catalogue, permissionsState]);

  // Global total allowed count
  const totalAllowed = useMemo(() => {
    return Object.values(permissionsState).filter((p) => p.allowed).length;
  }, [permissionsState]);

  // Search filtered permissions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return catalogue.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [catalogue, searchQuery]);

  // Toggle permission
  const handleTogglePermission = (id: string) => {
    if (isSuperAdmin) return;
    setPermissionsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        allowed: !prev[id]?.allowed,
      },
    }));
  };

  // Change data scope
  const handleChangeScope = (
    id: string,
    scope: "everything" | "team_only" | "assigned_only"
  ) => {
    if (isSuperAdmin) return;
    setPermissionsState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        scope,
      },
    }));
  };

  // Bulk category actions
  const handleSelectAllCategory = (catName: string) => {
    if (isSuperAdmin) return;
    const catPerms = catalogue.filter((p) => p.category === catName);
    setPermissionsState((prev) => {
      const next = { ...prev };
      catPerms.forEach((p) => {
        next[p.id] = { ...next[p.id], allowed: true };
      });
      return next;
    });
    toast.success(`Granted all permissions in ${catName}`);
  };

  const handleClearCategory = (catName: string) => {
    if (isSuperAdmin) return;
    const catPerms = catalogue.filter((p) => p.category === catName);
    setPermissionsState((prev) => {
      const next = { ...prev };
      catPerms.forEach((p) => {
        next[p.id] = { ...next[p.id], allowed: false };
      });
      return next;
    });
    toast.info(`Revoked permissions in ${catName}`);
  };

  // Blueprint template quick loader
  const handleApplyBlueprint = (blueprintName: string) => {
    if (isSuperAdmin) return;
    const bp = blueprints.find((b) => b.name === blueprintName);
    if (!bp) {
      toast.error(`Blueprint "${blueprintName}" not found`);
      return;
    }

    const next: Record<
      string,
      { allowed: boolean; scope: "everything" | "team_only" | "assigned_only" }
    > = {};
    catalogue.forEach((p) => {
      const def = bp.permissions?.[p.id];
      next[p.id] = {
        allowed: Boolean(def?.allowed),
        scope: def?.scope || "everything",
      };
    });
    setPermissionsState(next);
    toast.success(`Applied permissions template from "${bp.name}"`);
  };

  // Check for unsaved changes against initial baseline
  const hasChanges = useMemo(() => {
    if (!initialBaseline) return false;
    if (roleName.trim() !== initialBaseline.name.trim()) return true;
    if (roleDescription.trim() !== initialBaseline.description.trim()) return true;

    for (const p of catalogue) {
      const cur = permissionsState[p.id];
      const base = initialBaseline.permissions[p.id];
      const curAllowed = Boolean(cur?.allowed);
      const baseAllowed = Boolean(base?.allowed);
      if (curAllowed !== baseAllowed) return true;
      if (curAllowed) {
        const curScope = cur?.scope || "everything";
        const baseScope = base?.scope || "everything";
        if (curScope !== baseScope) return true;
      }
    }

    return false;
  }, [roleName, roleDescription, permissionsState, initialBaseline, catalogue]);

  const isSaving = isCreating || isUpdating;
  const isSaveDisabled = isSaving || isSuperAdmin || !hasChanges || !roleName.trim();

  // Save handler
  const handleSaveRole = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSuperAdmin) {
      toast.error("The Super Admin role cannot be modified.");
      return;
    }

    if (!roleName.trim()) {
      toast.error("Please enter a role name.");
      return;
    }

    if (!hasChanges) {
      toast.info("No changes to save.");
      return;
    }

    try {
      if (isNew) {
        const created: any = await createRole({
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: permissionsState,
        }).unwrap();
        toast.success(`Role "${roleName.trim()}" created successfully!`);
        const newId = created?._id || created?.id || created?.role?._id;
        if (newId) {
          router.replace(`/settings/roles/${newId}`);
        } else {
          router.push("/settings?module=user-roles");
        }
      } else {
        await updateRole({
          id: roleId,
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: permissionsState,
        }).unwrap();
        toast.success(`Role "${roleName.trim()}" updated successfully!`);
        // Stay on page and update baseline so hasChanges becomes false (disabling the save button)
        setInitialBaseline({
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissions: JSON.parse(JSON.stringify(permissionsState)),
        });
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to save role");
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isSaveDisabled) {
          handleSaveRole();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaveDisabled, handleSaveRole]);
  const isLoading = (!isNew && isLoadingRole) || isLoadingCatalogue;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading role configuration & permissions...</p>
      </div>
    );
  }

  if (!isNew && (isRoleError || !existingRole)) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">Role Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          The requested role does not exist or may have been deleted.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/settings?module=user-roles")}
        >
          Return to User Roles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ─── 1. TOP HEADER & BREADCRUMBS ─────────────────────────── */}
      <div className="space-y-2">
        <Breadcrumbs
          items={[
            { label: "Settings", href: "/settings" },
            { label: "User Roles", href: "/settings?module=user-roles" },
            { label: isNew ? "New Role" : existingRole?.name || "Edit Role" },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5 pt-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {isNew ? "Create Custom Role" : `Edit Role: ${existingRole?.name}`}
                </h1>
                {isSuperAdmin ? (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                    Immutable Super Admin
                  </Badge>
                ) : existingRole?.isSystemDefault ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    System Blueprint Role
                  </Badge>
                ) : !isNew ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    Custom Role
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define granular resource permissions and data access scopes for this role.
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/settings?module=user-roles")}
              disabled={isSaving}
              className="h-9 text-xs"
            >
              Cancel
            </Button>

            {!isSuperAdmin && (
              <Button
                type="button"
                onClick={() => handleSaveRole()}
                disabled={isSaveDisabled}
                className="h-9 text-xs gap-1.5 px-4 shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>Save Role & Permissions</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. SUPER ADMIN NOTICE (IF APPLICABLE) ───────────────── */}
      {isSuperAdmin && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                Super Admin Access Is Immutable
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 leading-relaxed">
                The Super Admin role possesses permanent unrestricted privileges (*:*) across all resources,
                settings, and user management functions. To grant restricted or scoped access to employees,
                configure the <strong>Admin</strong>, <strong>Accountant</strong>, or <strong>Staff</strong> roles,
                or create a custom role.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 3. ROLE DETAILS & BLUEPRINT LOADER CARD ─────────────── */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Role Identity Inputs */}
            <div className="lg:col-span-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role-name-input" className="text-xs font-semibold text-foreground">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="role-name-input"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Tax Associate"
                    disabled={isSuperAdmin}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role-desc-input" className="text-xs font-semibold text-foreground">
                    Description
                  </Label>
                  <Input
                    id="role-desc-input"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Brief description of responsibilities"
                    disabled={isSuperAdmin}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right: Quick Template Blueprints */}
            {!isSuperAdmin && (
              <div className="lg:col-span-6 rounded-lg border bg-muted/30 p-3 flex flex-col justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Start from Standard Blueprint Template:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background hover:bg-muted font-medium"
                    onClick={() => handleApplyBlueprint("Admin")}
                  >
                    Admin Blueprint
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background hover:bg-muted font-medium"
                    onClick={() => handleApplyBlueprint("Accountant")}
                  >
                    Accountant Blueprint
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-background hover:bg-muted font-medium"
                    onClick={() => handleApplyBlueprint("Staff")}
                  >
                    Staff Blueprint
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── 4. SEARCH FILTER & OVERVIEW METRICS BAR ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions by keyword (e.g. invoice, client, delete, attendance)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {hasChanges && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
              Unsaved Changes
            </span>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Granted:</span>
            <span className="font-bold text-foreground font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {totalAllowed} of {catalogue.length} Permissions
            </span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-border" />

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border">Ctrl+S</kbd>
            <span>to save</span>
          </div>
        </div>
      </div>

      {/* ─── 5. SEARCH RESULTS VIEW (WHEN SEARCHING) ─────────────── */}
      {searchResults !== null ? (
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Search Results ({searchResults.length} matching permissions)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-7 text-xs text-muted-foreground"
            >
              Clear Search
            </Button>
          </div>

          <CardContent className="p-0 divide-y divide-border/60">
            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No permissions matched &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try broader keywords like &ldquo;view&rdquo;, &ldquo;create&rdquo;, &ldquo;invoice&rdquo;, or &ldquo;task&rdquo;.
                </p>
              </div>
            ) : (
              searchResults.map((p) => {
                const state = permissionsState[p.id] || { allowed: false, scope: "everything" };
                const isAllowed = state.allowed;

                return (
                  <PermissionRowItem
                    key={p.id}
                    permission={p}
                    isAllowed={isAllowed}
                    scope={state.scope}
                    isSuperAdmin={isSuperAdmin}
                    showCategoryBadge
                    onToggle={() => handleTogglePermission(p.id)}
                    onChangeScope={(scope) => handleChangeScope(p.id, scope)}
                  />
                );
              })
            )}
          </CardContent>
        </Card>
      ) : (
        /* ─── 6. TWO-COLUMN MASTER-DETAIL CATEGORY WORKSPACE ───────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Vertical Category Navigation Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3  lg:top-4 space-y-2">
            <div className="rounded-xl border bg-card shadow-sm p-2 space-y-1">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Categories</span>
                <span>{categories.length} Total</span>
              </div>

              <div className="space-y-0.5">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] || Layers;
                  const stats = categoryStats[cat] || { total: 0, allowed: 0 };
                  const isActive = activeCategory === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left group ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <span className="truncate">{cat}</span>
                      </div>

                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono shrink-0 ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : stats.allowed > 0
                            ? "bg-primary/10 text-primary font-semibold"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {stats.allowed}/{stats.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Category Permissions Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <Card className="shadow-sm border-border overflow-hidden">
              {/* Category Header Strip */}
              <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const CatIcon = CATEGORY_ICONS[activeCategory] || Layers;
                    return (
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <CatIcon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {activeCategory} Permissions
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure individual access actions and data scopes for {activeCategory.toLowerCase()}.
                    </p>
                  </div>
                </div>

                {!isSuperAdmin && (
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllCategory(activeCategory)}
                      className="h-8 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span>Select All</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearCategory(activeCategory)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <span>Clear All</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Permissions List */}
              <CardContent className="p-0 divide-y divide-border/60">
                {catalogue
                  .filter((p) => p.category === activeCategory)
                  .map((p) => {
                    const state = permissionsState[p.id] || { allowed: false, scope: "everything" };
                    const isAllowed = state.allowed;

                    return (
                      <PermissionRowItem
                        key={p.id}
                        permission={p}
                        isAllowed={isAllowed}
                        scope={state.scope}
                        isSuperAdmin={isSuperAdmin}
                        showCategoryBadge={false}
                        onToggle={() => handleTogglePermission(p.id)}
                        onChangeScope={(scope) => handleChangeScope(p.id, scope)}
                      />
                    );
                  })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REUSABLE PERMISSION ROW ITEM ───────────────────────────────────────────
interface PermissionRowItemProps {
  permission: any;
  isAllowed: boolean;
  scope?: "everything" | "team_only" | "assigned_only";
  isSuperAdmin?: boolean;
  showCategoryBadge?: boolean;
  onToggle: () => void;
  onChangeScope: (scope: "everything" | "team_only" | "assigned_only") => void;
}

function PermissionRowItem({
  permission: p,
  isAllowed,
  scope = "everything",
  isSuperAdmin = false,
  showCategoryBadge = false,
  onToggle,
  onChangeScope,
}: PermissionRowItemProps) {
  return (
    <div
      onClick={(e) => {
        // Prevent toggle if clicking on interactive select element
        if ((e.target as HTMLElement).closest("select, [role=combobox], button")) {
          return;
        }
        onToggle();
      }}
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors cursor-pointer select-none ${
        isAllowed
          ? "bg-accent/25 hover:bg-accent/35"
          : "hover:bg-muted/40 opacity-80 hover:opacity-100"
      }`}
    >
      {/* Left: Checkbox & Info */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <Checkbox
          id={`perm-${p.id}`}
          checked={isAllowed}
          onCheckedChange={onToggle}
          disabled={isSuperAdmin}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={`perm-${p.id}`}
              className="text-sm font-semibold text-foreground cursor-pointer"
            >
              {p.name}
            </label>

            {p.isDangerous && (
              <Badge
                variant="destructive"
                className="text-[10px] py-0 px-1.5 font-normal"
              >
                Destructive
              </Badge>
            )}

            {showCategoryBadge && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground">
                {p.category}
              </Badge>
            )}

            <span className="text-[10px] font-mono text-muted-foreground/70">
              {p.id}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {p.description}
          </p>
        </div>
      </div>

      {/* Right: Data Scope Selector Dropdown */}
      <div
        className="flex items-center gap-3 shrink-0 sm:pl-4 self-end sm:self-center"
        onClick={(e) => e.stopPropagation()}
      >
        {p.supportsScope && isAllowed ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Data Scope:
              </Label>
              <Select
                value={scope}
                onValueChange={(val: any) => onChangeScope(val)}
                disabled={isSuperAdmin}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs bg-background font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="w-[200px]">
                  <SelectItem value="everything" className="text-xs">
                    Everything (Firm)
                  </SelectItem>
                  <SelectItem value="team_only" className="text-xs">
                    Team / Dept Only
                  </SelectItem>
                  <SelectItem value="assigned_only" className="text-xs">
                    Assigned Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="text-[10px] text-muted-foreground italic max-w-[200px] text-right">
              {SCOPE_EXPLANATIONS[scope] || ""}
            </span>
          </div>
        ) : p.supportsScope ? (
          <span className="text-[11px] text-muted-foreground italic px-2.5 py-1 rounded-md bg-muted/50 border">
            Scope disabled
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 font-mono text-right">
            Global action
          </span>
        )}
      </div>
    </div>
  );
}

