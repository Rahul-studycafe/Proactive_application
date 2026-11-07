"use client";

import { useGetPackagesQuery } from "@/lib/services/api";
import { Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { usePermissions, Can } from "@/contexts/PermissionsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecurrenceBadge } from "@/components/services/RecurrenceBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PackagesTable() {
  const { can, isSuperAdmin } = usePermissions();
  const canEdit = isSuperAdmin || can("package:edit");
  const canDelete = isSuperAdmin || can("package:delete");
  const hasRowActions = canEdit || canDelete;

  const { data: response, isLoading } = useGetPackagesQuery(undefined);
  const packages = Array.isArray(response) ? response : [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card mt-4">
        No packages found. Create a package to bundle your services.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package Name</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Services Included</TableHead>
            <TableHead>Price</TableHead>
            {hasRowActions && <TableHead className="w-[50px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg: any) => (
            <TableRow key={pkg._id}>
              <TableCell className="font-medium">
                <div>{pkg.name}</div>
                {!pkg.isActive && (
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    Disabled
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <RecurrenceBadge frequency={pkg.frequency} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[300px]">
                  {pkg.serviceIds.slice(0, 3).map((s: any) => (
                    <Badge
                      key={s._id}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {s.name}
                    </Badge>
                  ))}
                  {pkg.serviceIds.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{pkg.serviceIds.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    ₹{pkg.defaultBillingAmount || 0}
                  </span>
                  {pkg.sacCode && (
                    <span className="text-xs text-muted-foreground">
                      SAC: {pkg.sacCode} ({pkg.gstPercentage}%)
                    </span>
                  )}
                </div>
              </TableCell>
              {hasRowActions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Can do="package:edit">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </Can>
                      <Can do="package:delete">
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </Can>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
