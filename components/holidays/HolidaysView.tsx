"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useSeedDefaultHolidaysMutation,
} from "@/lib/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { BackButton } from "@/components/shared/BackButton";

export interface HolidayItem {
  _id: string;
  name: string;
  date: string;
  type: "National" | "Festival" | "Optional" | "Other";
  description?: string;
}

const HOLIDAY_TYPES = ["National", "Festival", "Optional", "Other"] as const;

export interface HolidaysViewProps {
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
}

export function HolidaysView({
  onBack,
  backHref,
  backLabel = "Back to Settings",
  showBack,
}: HolidaysViewProps = {}) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  // Query & Mutations
  const {
    data: holidays = [],
    isLoading,
    isFetching,
  } = useGetHolidaysQuery({
    year: selectedYear,
  });
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: isUpdating }] = useUpdateHolidayMutation();
  const [deleteHoliday, { isLoading: isDeleting }] = useDeleteHolidayMutation();
  const [seedHolidays, { isLoading: isSeeding }] =
    useSeedDefaultHolidaysMutation();

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(
    null,
  );
  const [deletingHoliday, setDeletingHoliday] = useState<HolidayItem | null>(
    null,
  );
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    date: string;
    type: "National" | "Festival" | "Optional" | "Other";
    description: string;
  }>({
    name: "",
    date: `${selectedYear}-01-01`,
    type: "National",
    description: "",
  });

  const openAddModal = () => {
    setFormData({
      name: "",
      date: `${selectedYear}-01-01`,
      type: "National",
      description: "",
    });
    setIsAddOpen(true);
  };

  const openEditModal = (holiday: HolidayItem) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || "",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) {
      toast.error("Please provide both holiday name and date");
      return;
    }
    try {
      await createHoliday(formData).unwrap();
      toast.success(`Holiday "${formData.name}" added successfully`);
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to create holiday",
      );
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;
    if (!formData.name.trim() || !formData.date) {
      toast.error("Please provide both holiday name and date");
      return;
    }
    try {
      await updateHoliday({ id: editingHoliday._id, ...formData }).unwrap();
      toast.success(`Holiday updated successfully`);
      setEditingHoliday(null);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to update holiday",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingHoliday) return;
    try {
      await deleteHoliday(deletingHoliday._id).unwrap();
      toast.success(`Holiday "${deletingHoliday.name}" deleted`);
      setDeletingHoliday(null);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to delete holiday",
      );
    }
  };

  const handleSeedDefault = async () => {
    try {
      const res = await seedHolidays({
        year: selectedYear,
        region: "national",
      }).unwrap();
      const count = res?.seededCount ?? 5;
      toast.success(
        `Successfully seeded ${count} national holidays for ${selectedYear}`,
      );
      setIsSeedConfirmOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to seed default holidays",
      );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "National":
        return "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "Festival":
        return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "Optional":
        return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400";
    }
  };

  const shouldShowBack = showBack === true;

  return (
    <div className="space-y-6">
      {shouldShowBack && (
        <BackButton href={backHref} onClick={onBack} label={backLabel} />
      )}
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Official Holidays Master
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure gazetted and festive office closures for operational and
            payroll calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32 bg-card">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[
                currentYear - 1,
                currentYear,
                currentYear + 1,
                currentYear + 2,
              ].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Statutory Seed Button */}
          {/* <Button
            variant="outline"
            onClick={() => setIsSeedConfirmOpen(true)}
            disabled={isSeeding}
            className="border-primary/30 text-primary hover:bg-primary/5"
          >
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
            )}
            Seed Statutory Holidays
          </Button> */}

          {/* Add Holiday Button */}
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Holiday
          </Button>
        </div>
      </div>

      {/* Holidays Data Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading || isFetching ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading {selectedYear} holidays...
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">
              No holidays recorded for {selectedYear}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              You haven't defined holidays for this year yet. Use the one-click
              statutory seeder or add holidays manually.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSeedConfirmOpen(true)}
              >
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Seed National Holidays
              </Button>
              <Button size="sm" onClick={openAddModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-48 font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Holiday Name</TableHead>
                <TableHead className="w-36 font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="w-24 text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h: HolidayItem) => {
                const dateObj = new Date(`${h.date}T00:00:00Z`);
                const formattedDate = !isNaN(dateObj.getTime())
                  ? format(dateObj, "dd MMM yyyy, EEEE")
                  : h.date;

                return (
                  <TableRow
                    key={h._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{formattedDate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeBadge(h.type)}>
                        {h.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(h)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingHoliday(h)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add / Edit Holiday Dialog */}
      <Dialog
        open={isAddOpen || !!editingHoliday}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingHoliday(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={editingHoliday ? handleUpdate : handleCreate}>
            <DialogHeader>
              <DialogTitle>
                {editingHoliday ? "Edit Holiday" : "Add Office Holiday"}
              </DialogTitle>
              <DialogDescription>
                Holidays are excluded from working day expectations and credited
                toward payable days.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Holiday Name *</Label>
                <Input
                  id="holiday-name"
                  placeholder="e.g. Republic Day, Diwali"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="holiday-date">Date (YYYY-MM-DD) *</Label>
                  <Input
                    id="holiday-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holiday-type">Category *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, type: val })
                    }
                  >
                    <SelectTrigger id="holiday-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOLIDAY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="holiday-desc">Description (Optional)</Label>
                <Input
                  id="holiday-desc"
                  placeholder="e.g. National gazetted office closure"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingHoliday(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingHoliday ? "Save Changes" : "Create Holiday"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Alert Dialog */}
      <AlertDialog
        open={!!deletingHoliday}
        onOpenChange={(open) => !open && setDeletingHoliday(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                "{deletingHoliday?.name}"
              </span>{" "}
              ({deletingHoliday?.date})? This date will no longer count as a
              paid holiday closure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Holiday"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Seed Default Holidays Confirmation Dialog */}
      <AlertDialog open={isSeedConfirmOpen} onOpenChange={setIsSeedConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Seed Statutory National Holidays ({selectedYear})
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-2">
                <span>
                  This will automatically pre-populate the 5 official Indian
                  gazetted national holidays for <strong>{selectedYear}</strong>
                  :
                </span>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>Republic Day (Jan 26)</li>
                  <li>May Day / Labor Day (May 01)</li>
                  <li>Independence Day (Aug 15)</li>
                  <li>Mahatma Gandhi Jayanti (Oct 02)</li>
                  <li>Christmas (Dec 25)</li>
                </ul>
                <span className="block text-xs text-muted-foreground">
                  Existing entries on these dates will be updated idempotently
                  without duplication.
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedDefault} disabled={isSeeding}>
              {isSeeding ? "Seeding..." : "Confirm & Pre-Populate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
