"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  FileText,
  MapPin,
  Usb,
  ShieldCheck,
  Award,
  Globe,
  ExternalLink,
  CreditCard,
  Tag as TagIcon,
  Building2,
  FolderPlus,
  FileCheck2,
  Box,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  Sparkles,
  Loader2,
  ArrowUpDown,
  AlertCircle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetConfigurationCategoriesQuery,
  useGetConfigurationOptionsQuery,
  useCreateConfigurationOptionMutation,
  useUpdateConfigurationOptionMutation,
  useToggleConfigurationOptionMutation,
  useDeleteConfigurationOptionMutation,
  useReorderConfigurationOptionsMutation,
} from "@/lib/services/api";
import { ConfigurationOption } from "@/lib/types/configuration";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, any> = {
  document_types: FileText,
  office_storage_locations: MapPin,
  usb_token_types: Usb,
  issuing_authorities: ShieldCheck,
  certificate_classes: Award,
  portals_and_authorities: Globe,
  payment_modes: CreditCard,
  tags: TagIcon,
  client_entity_types: Building2,
  client_groups: FolderPlus,
  credit_note_reasons: FileCheck2,
  storage_unit_types: Box,
};

function ThreeHorizontalLinesIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

export function TenantConfigurationView({
  initialCategoryKey,
}: {
  initialCategoryKey?: string;
} = {}) {
  const { data: categories = [], isLoading: isLoadingCategories } =
    useGetConfigurationCategoriesQuery();

  const [activeCategoryKey, setActiveCategoryKey] = useState<string>(
    initialCategoryKey || "document_types"
  );
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);

  // Sync with initialCategoryKey prop when provided/changed
  React.useEffect(() => {
    if (initialCategoryKey) {
      setActiveCategoryKey(initialCategoryKey);
    }
  }, [initialCategoryKey]);

  // Fallback to first available category if activeCategoryKey is empty
  React.useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.key === activeCategoryKey)) {
      setActiveCategoryKey(initialCategoryKey && categories.some((c) => c.key === initialCategoryKey) ? initialCategoryKey : categories[0].key);
    }
  }, [categories, activeCategoryKey, initialCategoryKey]);

  const {
    data: options = [],
    isLoading: isLoadingOptions,
    isFetching: isFetchingOptions,
  } = useGetConfigurationOptionsQuery(
    { categoryKey: activeCategoryKey, includeInactive },
    { skip: !activeCategoryKey }
  );

  const [createOption, { isLoading: isCreating }] =
    useCreateConfigurationOptionMutation();
  const [updateOption, { isLoading: isUpdating }] =
    useUpdateConfigurationOptionMutation();
  const [toggleStatus] = useToggleConfigurationOptionMutation();
  const [deleteOption, { isLoading: isDeleting }] =
    useDeleteConfigurationOptionMutation();
  const [reorderOptions] = useReorderConfigurationOptionsMutation();

  // Dialog State: Create / Edit
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [optionToEdit, setOptionToEdit] = useState<ConfigurationOption | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formPortalUrl, setFormPortalUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState<string | null>(null);

  // Dialog State: Delete Confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState<ConfigurationOption | null>(null);

  // Drag-and-Drop Reorder State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const currentCategory = useMemo(() => {
    return categories.find((c) => c.key === activeCategoryKey);
  }, [categories, activeCategoryKey]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q)) ||
        (opt.metadata?.url && opt.metadata.url.toLowerCase().includes(q)) ||
        (opt.metadata?.portalUrl && opt.metadata.portalUrl.toLowerCase().includes(q))
    );
  }, [options, search]);

  const openCreateModal = () => {
    setOptionToEdit(null);
    setFormLabel("");
    setFormPortalUrl("");
    setFormDescription("");
    setFormColor(null);
    setEditModalOpen(true);
  };

  const openEditModal = (opt: ConfigurationOption) => {
    setOptionToEdit(opt);
    setFormLabel(opt.label);
    setFormPortalUrl(opt.metadata?.portalUrl || opt.metadata?.url || "");
    setFormDescription(opt.description || "");
    setFormColor(opt.color || null);
    setEditModalOpen(true);
  };

  const handleSaveOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = formLabel.trim();
    if (!cleanLabel) {
      toast.error("Label is required");
      return;
    }

    const isPortalCategory = activeCategoryKey === "portals_and_authorities";
    const cleanPortalUrl = formPortalUrl.trim();

    try {
      if (optionToEdit) {
        await updateOption({
          id: optionToEdit._id,
          categoryKey: activeCategoryKey,
          body: {
            label: cleanLabel,
            description: formDescription.trim() || undefined,
            color: formColor || null,
            metadata: isPortalCategory
              ? {
                  ...(optionToEdit.metadata || {}),
                  url: cleanPortalUrl || undefined,
                  portalUrl: cleanPortalUrl || undefined,
                }
              : optionToEdit.metadata,
          },
        }).unwrap();
        toast.success(`Option "${cleanLabel}" updated successfully`);
      } else {
        await createOption({
          categoryKey: activeCategoryKey,
          label: cleanLabel,
          value: cleanLabel,
          description: formDescription.trim() || undefined,
          color: formColor || undefined,
          metadata: isPortalCategory && cleanPortalUrl
            ? {
                url: cleanPortalUrl,
                portalUrl: cleanPortalUrl,
              }
            : undefined,
        }).unwrap();
        toast.success(`Option "${cleanLabel}" created successfully`);
      }
      setEditModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to save option");
    }
  };

  const handleToggleActive = async (opt: ConfigurationOption) => {
    try {
      await toggleStatus({
        id: opt._id,
        categoryKey: activeCategoryKey,
      }).unwrap();
      toast.success(
        `"${opt.label}" ${!opt.isActive ? "activated" : "deactivated"}`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to toggle status");
    }
  };

  const confirmDelete = (opt: ConfigurationOption) => {
    setOptionToDelete(opt);
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!optionToDelete) return;
    try {
      const res = await deleteOption({
        id: optionToDelete._id,
        categoryKey: activeCategoryKey,
      }).unwrap();

      if (res.softDeactivated) {
        toast.info(
          res.message ||
            `"${optionToDelete.label}" is used in historical records. Safely deactivated instead.`
        );
      } else {
        toast.success(`"${optionToDelete.label}" removed successfully`);
      }
      setDeleteDialogOpen(false);
      setOptionToDelete(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to remove option");
    }
  };

  const handleDrop = async (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    const sourceIndex = options.findIndex((o) => o._id === sourceId);
    const targetIndex = options.findIndex((o) => o._id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const reordered = [...options];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderOptions({
        categoryKey: activeCategoryKey,
        orderedIds: reordered.map((o) => o._id),
      }).unwrap();
      toast.success(`Reordered "${moved.label}"`);
    } catch (err: any) {
      toast.error("Failed to update sort order");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;

    const reordered = [...options];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderOptions({
        categoryKey: activeCategoryKey,
        orderedIds: reordered.map((o) => o._id),
      }).unwrap();
    } catch (err: any) {
      toast.error("Failed to update sort order");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Organization Configuration</h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              Tenant Customization
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dropdown options, registries, storage coordinates, and document categories customized for your firm.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Category Selector + Right Content Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-0 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto space-y-1 rounded-xl border bg-card p-2 shadow-xs">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configuration Modules
          </div>
          {isLoadingCategories ? (
            <div className="p-4 text-xs text-muted-foreground flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
            </div>
          ) : (
            categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.key] || Layers;
              const isActive = cat.key === activeCategoryKey;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveCategoryKey(cat.key);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <IconComp
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate font-medium">{cat.name || cat.title}</span>
                  </div>
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5 shrink-0",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                        : "text-muted-foreground"
                    )}
                  >
                    {cat.activeCount}
                  </Badge>
                </button>
              );
            })
          )}
        </div>

        {/* Category Details & Option Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Active Category Header Card */}
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  {currentCategory?.name || currentCategory?.title || "Options"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentCategory?.description}
                </p>
              </div>

              <Button
                onClick={openCreateModal}
                size="sm"
                className="gap-1.5 text-xs h-9 font-medium shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New Option</span>
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={`Search ${currentCategory?.name || currentCategory?.title || "options"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Label htmlFor="toggle-inactive" className="text-xs text-muted-foreground cursor-pointer">
                  Show Inactive ({options.filter((o) => !o.isActive).length})
                </Label>
                <Switch
                  id="toggle-inactive"
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                  className="scale-75"
                />
              </div>
            </div>
          </div>

          {/* Options Table */}
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[44px] text-center text-xs">
                    <span className="sr-only">Reorder</span>
                  </TableHead>
                  <TableHead className="text-xs">Option Label / Value</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                  <TableHead className="text-xs text-right w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingOptions || isFetchingOptions ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading configuration options...
                    </TableCell>
                  </TableRow>
                ) : filteredOptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      No options found for this category. Click &ldquo;Add New Option&rdquo; to create your first option.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOptions.map((opt) => (
                    <TableRow
                      key={opt._id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", opt._id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggedId(opt._id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverId !== opt._id) setDragOverId(opt._id);
                      }}
                      onDragLeave={() => {
                        if (dragOverId === opt._id) setDragOverId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = e.dataTransfer.getData("text/plain");
                        handleDrop(sourceId, opt._id);
                        setDraggedId(null);
                        setDragOverId(null);
                      }}
                      className={cn(
                        "transition-all select-none",
                        !opt.isActive && "opacity-60 bg-muted/20",
                        draggedId === opt._id && "opacity-30 bg-muted/50",
                        dragOverId === opt._id && "border-t-2 border-primary bg-primary/5"
                      )}
                    >
                      {/* 3 Horizontal Lines Drag Handle */}
                      <TableCell className="w-[44px] text-center p-2">
                        <div
                          className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/80"
                          title="Drag to reorder"
                        >
                          <ThreeHorizontalLinesIcon className="h-4 w-4 opacity-50 hover:opacity-100" />
                        </div>
                      </TableCell>

                      {/* Label & Value */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          {opt.color ? (
                            <span
                              className="h-3 w-3 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: opt.color }}
                            />
                          ) : null}
                          <div>
                            <span className="text-xs font-semibold text-foreground">
                              {opt.label}
                            </span>
                            {(opt.metadata?.portalUrl || opt.metadata?.url) && (
                              <a
                                href={opt.metadata?.portalUrl || opt.metadata?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[260px]">
                                  {opt.metadata?.portalUrl || opt.metadata?.url}
                                </span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-70 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate hidden md:table-cell py-2.5">
                        {opt.description || "—"}
                      </TableCell>

                      {/* Default vs Custom */}
                      <TableCell className="py-2.5">
                        {opt.isSystemDefault ? (
                          <Badge variant="outline" className="text-[10px] font-normal bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200">
                            Standard
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200">
                            Custom
                          </Badge>
                        )}
                      </TableCell>

                      {/* Active Status Switch */}
                      <TableCell className="text-center py-2.5">
                        <Switch
                          checked={opt.isActive}
                          onCheckedChange={() => handleToggleActive(opt)}
                          className="scale-75"
                          title={opt.isActive ? "Click to deactivate" : "Click to activate"}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(opt)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit option"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(opt)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Delete or de-activate option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {optionToEdit ? "Edit Configuration Option" : `Add New ${currentCategory?.name || currentCategory?.title || "Option"}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define the option name, description, and visual styling for your organization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOption} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="opt-form-label" className="text-xs font-medium">
                Option Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="opt-form-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder={currentCategory?.placeholder || "e.g. Current Account, Shelf A-1, Class 3..."}
                className="text-xs h-9"
                autoFocus
                required
              />
            </div>

            {/* If adding or editing a portal, allow specifying the portal website URL */}
            {activeCategoryKey === "portals_and_authorities" && (
              <div className="space-y-1">
                <Label htmlFor="opt-form-url" className="text-xs font-medium flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>Portal Website Link (Optional)</span>
                </Label>
                <Input
                  id="opt-form-url"
                  type="url"
                  value={formPortalUrl}
                  onChange={(e) => setFormPortalUrl(e.target.value)}
                  placeholder="https://services.gst.gov.in/services/login"
                  className="text-xs h-9"
                />
                <p className="text-[11px] text-muted-foreground">
                  The statutory login website for this portal. Credentials added for this portal will auto-link to this URL.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="opt-form-desc" className="text-xs font-medium">
                Description / Notes (Optional)
              </Label>
              <Textarea
                id="opt-form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Team instructions or details about this option..."
                className="text-xs min-h-[60px]"
              />
            </div>

            {/* Optional Color Picker for Visual Categories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Color Badge (Optional)</Label>
                {formColor && (
                  <button
                    type="button"
                    onClick={() => setFormColor(null)}
                    className="text-[11px] text-muted-foreground hover:underline"
                  >
                    Clear Color
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform border border-black/10 dark:border-white/10 flex items-center justify-center",
                      formColor === c ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {formColor === c && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                disabled={isCreating || isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || isUpdating || !formLabel.trim()}
                className="text-xs gap-1.5"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save Option
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reference-Safe Deletion Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Remove Configuration Option?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Are you sure you want to remove &ldquo;<strong>{optionToDelete?.label}</strong>&rdquo;?
              </p>
              <p className="bg-muted p-2 rounded text-[11px]">
                🛡️ <strong>Safety Guarantee:</strong> If this option is already used in existing client records, DSC tokens, documents, or accounting ledgers, it will be <em>safely deactivated</em> rather than deleted, so no historical records are broken.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-xs"
            >
              {isDeleting ? "Processing..." : "Confirm Removal"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

