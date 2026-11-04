"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  useGetStorageLocationsQuery,
  useDeleteStorageLocationMutation,
} from "@/lib/services/api";
import { StorageLocationSummary } from "@/lib/types/physical-document";
import { StorageUnitModal } from "@/components/documents/StorageUnitModal";
import {
  Archive,
  Search,
  ArrowRight,
  FolderKanban,
  RefreshCw,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Building,
  ShieldCheck,
  Layers,
  Lock,
} from "lucide-react";

interface StorageLocationsViewProps {
  onSelectLocation: (location: string) => void;
}

export function StorageLocationsView({
  onSelectLocation,
}: StorageLocationsViewProps) {
  const {
    data: locations = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetStorageLocationsQuery();

  const [deleteUnit, { isLoading: isDeleting }] =
    useDeleteStorageLocationMutation();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<StorageLocationSummary | null>(
    null,
  );

  const [unitToDelete, setUnitToDelete] =
    useState<StorageLocationSummary | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.location.toLowerCase().includes(q) ||
        (loc.roomOrFloor && loc.roomOrFloor.toLowerCase().includes(q)) ||
        (loc.unitType && loc.unitType.toLowerCase().includes(q)),
    );
  }, [locations, search]);

  const totalActive = useMemo(
    () => locations.reduce((acc, curr) => acc + (curr.activeCount || 0), 0),
    [locations],
  );
  const totalOverdue = useMemo(
    () => locations.reduce((acc, curr) => acc + (curr.overdueCount || 0), 0),
    [locations],
  );

  const handleEdit = (unit: StorageLocationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setUnitToEdit(unit);
    setIsModalOpen(true);
  };

  const handleDeletePrompt = (
    unit: StorageLocationSummary,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (unit.activeCount > 0) {
      toast.error(
        `Cannot delete "${unit.location}" while ${unit.activeCount} document(s) are actively in custody. Reassign them first.`,
      );
      return;
    }
    setUnitToDelete(unit);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!unitToDelete?._id) {
      toast.error("Unit cannot be removed because it has no master ID.");
      return;
    }
    try {
      await deleteUnit(unitToDelete._id).unwrap();
      toast.success(
        `Storage unit "${unitToDelete.location}" removed successfully.`,
      );
      setIsDeleteAlertOpen(false);
      setUnitToDelete(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to delete storage unit",
      );
    }
  };

  const getUnitIcon = (unitType?: string) => {
    switch (unitType) {
      case "Safe Box":
      case "Locker":
        return <Lock className="h-5 w-5" />;
      case "Shelf":
      case "Drawer":
        return <Layers className="h-5 w-5" />;
      case "Archive Room":
        return <Building className="h-5 w-5" />;
      default:
        return <FolderKanban className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search storage cabinet, shelf, locker, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh locations"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span>{locations.length} Units</span>
            <span>•</span>
            <span className="font-medium text-foreground">
              {totalActive} in Custody
            </span>
            {totalOverdue > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {totalOverdue} Overdue
                </span>
              </>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => {
              setUnitToEdit(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Storage Unit
          </Button>
        </div>
      </div>

      {/* Grid of Storage Locations */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Archive className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div className="text-lg font-medium">No storage units found</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `No units matching "${search}".`
                : "Add filing cabinets, lockers, and safe boxes to organize physical assets."}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => {
                  setUnitToEdit(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add First Storage Unit
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const hasOverdue = (loc.overdueCount || 0) > 0;
            return (
              <Card
                key={loc.location}
                className={`transition-all hover:shadow-md cursor-pointer border group relative ${
                  hasOverdue
                    ? "border-rose-200 dark:border-rose-900/60 hover:border-rose-300"
                    : "hover:border-primary/50"
                }`}
                onClick={() => onSelectLocation(loc.location)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {getUnitIcon(loc.unitType)}
                      </div>
                      <div className="truncate">
                        <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                          {loc.location}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5 truncate">
                          <span>{loc.unitType || "Office Storage"}</span>
                          {loc.roomOrFloor && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {loc.roomOrFloor}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hasOverdue && (
                        <Badge
                          variant="destructive"
                          className="text-xs font-medium"
                        >
                          {loc.overdueCount} Overdue
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => handleEdit(loc, e)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Unit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onSelectLocation(loc.location)}
                          >
                            <FolderKanban className="h-4 w-4 mr-2" />
                            View Documents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => handleDeletePrompt(loc, e)}
                            className="text-destructive focus:text-destructive"
                            disabled={loc.activeCount > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Unit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 text-center text-xs">
                    <div>
                      <div className="text-base font-bold text-foreground">
                        {loc.activeCount}
                      </div>
                      <div className="text-muted-foreground">In Custody</div>
                    </div>
                    <div className="border-x border-border/60">
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {loc.returnedCount}
                      </div>
                      <div className="text-muted-foreground">Returned</div>
                    </div>
                    <div>
                      <div
                        className={`text-base font-bold ${
                          hasOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {loc.overdueCount}
                      </div>
                      <div className="text-muted-foreground">Overdue</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-primary font-medium pt-1">
                    <span>View all documents in this unit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Storage Unit Modal */}
      <StorageUnitModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        unitToEdit={unitToEdit}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Storage Unit?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the storage unit{" "}
              <strong>&quot;{unitToDelete?.location}&quot;</strong>? This unit
              does not have any active documents in custody.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Storage Unit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
