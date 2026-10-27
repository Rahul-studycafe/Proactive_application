"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStorageLocationsQuery } from "@/lib/services/api";
import { Archive, Search, AlertCircle, CheckCircle2, ArrowRight, FolderKanban, RefreshCw } from "lucide-react";
import { StorageLocationSummary } from "@/lib/types/physical-document";

interface StorageLocationsViewProps {
  onSelectLocation: (location: string) => void;
}

export function StorageLocationsView({ onSelectLocation }: StorageLocationsViewProps) {
  const { data: locations = [], isLoading, isFetching, refetch } = useGetStorageLocationsQuery();
  const [search, setSearch] = useState("");

  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter((loc) => loc.location.toLowerCase().includes(q));
  }, [locations, search]);

  const totalActive = useMemo(
    () => locations.reduce((acc, curr) => acc + (curr.activeCount || 0), 0),
    [locations]
  );
  const totalOverdue = useMemo(
    () => locations.reduce((acc, curr) => acc + (curr.overdueCount || 0), 0),
    [locations]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search storage cabinet, shelf, locker..."
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
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{locations.length} Units</span>
          <span>•</span>
          <span className="font-medium text-foreground">{totalActive} in Custody</span>
          {totalOverdue > 0 && (
            <>
              <span>•</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {totalOverdue} Overdue
              </span>
            </>
          )}
        </div>
      </div>

      {/* Grid of Storage Locations */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Archive className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <div className="text-lg font-medium">No storage locations found</div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {search
                ? `No filing cabinets matching "${search}".`
                : "Record documents in the register desk to automatically populate your office storage locations."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const hasOverdue = (loc.overdueCount || 0) > 0;
            return (
              <Card
                key={loc.location}
                className={`transition-all hover:shadow-md cursor-pointer border ${
                  hasOverdue
                    ? "border-rose-200 dark:border-rose-900/60 hover:border-rose-300"
                    : "hover:border-primary/50"
                }`}
                onClick={() => onSelectLocation(loc.location)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                          {loc.location}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Office Physical Storage
                        </CardDescription>
                      </div>
                    </div>
                    {hasOverdue && (
                      <Badge variant="destructive" className="text-xs font-medium">
                        {loc.overdueCount} Overdue
                      </Badge>
                    )}
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
                      <div className={`text-base font-bold ${hasOverdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}>
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
    </div>
  );
}
