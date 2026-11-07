"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  Building2,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Clock,
  MapPin,
  MoreVertical,
  ArrowRightLeft,
  History,
  Pencil,
  Trash2,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDscListQuery, useDeleteDscMutation } from "@/lib/services/api";
import { DSCItem, DSCStatus } from "@/lib/types/dsc";
import { CreateDSCModal } from "@/components/dsc/CreateDSCModal";
import { DSCHandoverModal } from "@/components/dsc/DSCHandoverModal";
import { DSCHistorySheet } from "@/components/dsc/DSCHistorySheet";
import { usePermissions, Can } from "@/contexts/PermissionsContext";

interface ClientDSCTabProps {
  clientId: string;
}

export function ClientDSCTab({ clientId }: ClientDSCTabProps) {
  const { can, isSuperAdmin } = usePermissions();
  const canRegisterDsc = isSuperAdmin || can("dsc:create");
  const canEditDsc = isSuperAdmin || can("dsc:edit");
  const canDeleteDsc = isSuperAdmin || can("dsc:delete");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDsc, setEditingDsc] = useState<DSCItem | null>(null);

  const [handoverDsc, setHandoverDsc] = useState<DSCItem | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const [historyDsc, setHistoryDsc] = useState<DSCItem | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);

  const [deleteDsc] = useDeleteDscMutation();

  const queryParams = useMemo(() => {
    return {
      clientId,
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      expiringWithinDays:
        expiryFilter !== "all" ? Number(expiryFilter) : undefined,
    };
  }, [clientId, search, statusFilter, expiryFilter]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetDscListQuery(queryParams);

  const dscs: DSCItem[] = listData?.dscs || [];

  // Summary Metrics for this client
  const metrics = useMemo(() => {
    const total = dscs.length;
    const inOffice = dscs.filter((d) => d.status === "In Office").length;
    const withClient = dscs.filter((d) => d.status === "With Client").length;
    const expired = dscs.filter((d) => d.status === "Expired").length;

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringIn30Days = dscs.filter((d) => {
      const exp = new Date(d.expiryDate);
      return (
        ["In Office", "With Client"].includes(d.status) &&
        exp >= now &&
        exp <= thirtyDaysLater
      );
    }).length;

    return { total, inOffice, withClient, expired, expiringIn30Days };
  }, [dscs]);

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setExpiryFilter("all");
  };

  const handleDelete = async (dsc: DSCItem) => {
    if (
      !window.confirm(
        `Are you sure you want to decommission DSC token "${dsc.certificateName}"?`,
      )
    ) {
      return;
    }
    try {
      await deleteDsc(dsc._id).unwrap();
      toast.success("DSC token decommissioned successfully");
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to delete DSC token",
      );
    }
  };

  const getStatusBadge = (status: DSCStatus) => {
    switch (status) {
      case "In Office":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> In Office
          </Badge>
        );
      case "With Client":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400">
            <Building2 className="mr-1 h-3 w-3" /> With Client
          </Badge>
        );
      case "Expired":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            <ShieldAlert className="mr-1 h-3 w-3" /> Expired
          </Badge>
        );
      case "Renewed":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 hover:bg-purple-500/25 border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400">
            <FileCheck className="mr-1 h-3 w-3" /> Renewed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExpiryPill = (expiryDateStr: string, status: DSCStatus) => {
    const now = new Date();
    const expiry = new Date(expiryDateStr);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || status === "Expired") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {diffDays <= 0 ? `Expired (${Math.abs(diffDays)}d ago)` : "Expired"}
        </span>
      );
    }
    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
          <Clock className="h-3.5 w-3.5" />
          Expires in {diffDays} {diffDays === 1 ? "day" : "days"}
        </span>
      );
    }
    if (diffDays <= 15) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5" />
          Expires in {diffDays} days
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <Clock className="h-3.5 w-3.5" />
          Expires in {diffDays} days
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        Valid ({diffDays} days left)
      </span>
    );
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Digital Signature Certificates (DSC) Register
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-mono">
            {listData?.total ?? dscs.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 p-0"
            title="Refresh list"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>

          {canRegisterDsc && (
            <Button
              size="sm"
              onClick={() => {
                setEditingDsc(null);
                setIsCreateModalOpen(true);
              }}
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-4 w-4" />
              Register DSC
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Quick Summary Pill Bar */}
        {dscs.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground block uppercase">
                In Office Custody
              </span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {metrics.inOffice}
              </span>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground block uppercase">
                With Client / Staff
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {metrics.withClient}
              </span>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground block uppercase">
                Expiring ≤30 Days
              </span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {metrics.expiringIn30Days}
              </span>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <span className="text-[11px] font-medium text-muted-foreground block uppercase">
                Expired
              </span>
              <span className="text-lg font-bold text-rose-700 dark:text-rose-400">
                {metrics.expired}
              </span>
            </div>
          </div>
        )}

        {/* Filter bar */}
        {(dscs.length > 0 ||
          search ||
          statusFilter !== "all" ||
          expiryFilter !== "all") && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search token name, serial, shelf location..."
                className="pl-8 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-[140px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="In Office">In Office</SelectItem>
                    <SelectItem value="With Client">With Client</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[150px]">
                <Select value={expiryFilter} onValueChange={setExpiryFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Validity Window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="7">Expires in 7d</SelectItem>
                    <SelectItem value="15">Expires in 15d</SelectItem>
                    <SelectItem value="30">Expires in 30d</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(search || statusFilter !== "all" || expiryFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Table / Empty State */}
        <div className="rounded-lg border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[240px]">Certificate Name</TableHead>
                <TableHead className="w-[160px]">Hardware Token</TableHead>
                <TableHead className="w-[160px]">Office Location</TableHead>
                <TableHead className="w-[180px]">Validity & Expiry</TableHead>
                <TableHead className="w-[130px]">Custody Status</TableHead>
                <TableHead className="w-[150px]">Current Holder</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-4 w-36 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 ml-auto rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : dscs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-52 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <KeyRound className="h-8 w-8 mb-1 opacity-20" />
                      <p className="text-sm font-medium">
                        No digital signature certificates found
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search ||
                        statusFilter !== "all" ||
                        expiryFilter !== "all"
                          ? "No DSC records match your search filter criteria."
                          : "No DSC USB tokens have been registered for this client yet."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {(search ||
                          statusFilter !== "all" ||
                          expiryFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="text-xs"
                          >
                            Clear Filters
                          </Button>
                        )}
                        {canRegisterDsc && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setEditingDsc(null);
                              setIsCreateModalOpen(true);
                            }}
                            className="text-xs gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Register DSC
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                dscs.map((dsc) => {
                  const formattedExpiry = new Date(
                    dsc.expiryDate,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedIssue = new Date(
                    dsc.issueDate,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <TableRow
                      key={dsc._id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Certificate Name */}
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground">
                          {dsc.certificateName}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Class:{" "}
                          <span className="font-medium text-foreground/80">
                            {dsc.certificateClass}
                          </span>
                        </div>
                      </TableCell>

                      {/* Token Details */}
                      <TableCell>
                        <div className="text-xs font-medium text-foreground">
                          {dsc.tokenType}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {dsc.tokenSerialNumber
                            ? `#${dsc.tokenSerialNumber}`
                            : "No Serial #"}
                        </div>
                        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                          CA: {dsc.issuingAuthority}
                        </div>
                      </TableCell>

                      {/* Storage Location */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{dsc.physicalLocation}</span>
                        </div>
                      </TableCell>

                      {/* Validity & Expiry */}
                      <TableCell>
                        <div className="text-xs font-medium text-foreground">
                          {formattedExpiry}
                        </div>
                        <div className="mt-1">
                          {getExpiryPill(dsc.expiryDate, dsc.status)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Issued: {formattedIssue}
                        </div>
                      </TableCell>

                      {/* Custody Status */}
                      <TableCell>{getStatusBadge(dsc.status)}</TableCell>

                      {/* Current Holder */}
                      <TableCell>
                        <div className="text-xs">
                          {dsc.status === "With Client" ? (
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {dsc.currentHolderName || "Client Rep"}
                            </span>
                          ) : dsc.status === "In Office" ? (
                            <span className="text-muted-foreground">
                              Office Custody
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        {dsc.notes && (
                          <div
                            className="text-[10px] text-muted-foreground truncate max-w-[130px] mt-0.5"
                            title={dsc.notes}
                          >
                            {dsc.notes}
                          </div>
                        )}
                      </TableCell>

                      {/* Row Action Dropdown */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {canEditDsc && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setHandoverDsc(dsc);
                                  setIsHandoverModalOpen(true);
                                }}
                                className="gap-2 text-xs"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                                Log Handover
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setHistoryDsc(dsc);
                                setIsHistorySheetOpen(true);
                              }}
                              className="gap-2 text-xs"
                            >
                              <History className="h-3.5 w-3.5 text-amber-600" />
                              Custody History
                            </DropdownMenuItem>

                            {(canEditDsc || canDeleteDsc) && (
                              <DropdownMenuSeparator />
                            )}

                            {canEditDsc && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingDsc(dsc);
                                  setIsCreateModalOpen(true);
                                }}
                                className="gap-2 text-xs"
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Details
                              </DropdownMenuItem>
                            )}

                            {canDeleteDsc && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(dsc)}
                                className="gap-2 text-xs text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Decommission
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Modals & Slide-over Sheets */}
      <CreateDSCModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        dscToEdit={editingDsc}
        defaultClientId={clientId}
      />

      <DSCHandoverModal
        open={isHandoverModalOpen}
        onOpenChange={setIsHandoverModalOpen}
        dsc={handoverDsc}
      />

      <DSCHistorySheet
        open={isHistorySheetOpen}
        onOpenChange={setIsHistorySheetOpen}
        dsc={historyDsc}
      />
    </Card>
  );
}
