"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KeyRound,
  Search,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  Building2,
  ShieldAlert,
  FileCheck,
  AlertTriangle,
  Clock,
  HardDrive,
  MapPin,
  MoreVertical,
  ArrowRightLeft,
  History,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useGetDscListQuery,
  useGetDscKpiQuery,
  useDeleteDscMutation,
} from "@/lib/services/api";
import { DSCItem, DSCStatus } from "@/lib/types/dsc";
import { CreateDSCModal } from "@/components/dsc/CreateDSCModal";
import { DSCHandoverModal } from "@/components/dsc/DSCHandoverModal";
import { DSCHistorySheet } from "@/components/dsc/DSCHistorySheet";
import { DSCExpiryRibbon } from "@/components/dsc/DSCExpiryRibbon";

export default function DSCDirectoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<string>("all");
  const [activeRibbonFilter, setActiveRibbonFilter] = useState<string>("all");

  // Modal / Sheet States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDsc, setEditingDsc] = useState<DSCItem | null>(null);

  const [handoverDsc, setHandoverDsc] = useState<DSCItem | null>(null);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const [historyDsc, setHistoryDsc] = useState<DSCItem | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);

  const [deleteDsc] = useDeleteDscMutation();

  const queryParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      expiringWithinDays:
        expiryFilter !== "all" ? Number(expiryFilter) : undefined,
    };
  }, [search, statusFilter, expiryFilter]);

  const {
    data: listData,
    isLoading: isListLoading,
    isFetching,
    refetch: refetchList,
  } = useGetDscListQuery(queryParams);

  const { data: kpiData, refetch: refetchKpi } = useGetDscKpiQuery();

  const dscs: DSCItem[] = listData?.dscs || [];

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setExpiryFilter("all");
    setActiveRibbonFilter("all");
  };

  const handleRibbonFilterChange = (filter: {
    status?: string;
    expiringWithinDays?: number;
    label: string;
  }) => {
    setActiveRibbonFilter(filter.label);
    if (filter.status) {
      setStatusFilter(filter.status);
    } else {
      setStatusFilter("all");
    }
    if (filter.expiringWithinDays) {
      setExpiryFilter(filter.expiringWithinDays.toString());
    } else {
      setExpiryFilter("all");
    }
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
    <div className="flex flex-col gap-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Digital Signature Certificates (DSC)
              </h1>
              <p className="text-sm text-muted-foreground">
                Client hardware USB token inventory, physical office safe
                custody & expiry automation.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchList();
              refetchKpi();
            }}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingDsc(null);
              setIsCreateModalOpen(true);
            }}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Register DSC
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Ribbon */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total DSC Tokens
              </span>
              <HardDrive className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">{kpiData?.total ?? 0}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Registered in organization
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                In Office Custody
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {kpiData?.inOffice ?? 0}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Available in office safe/drawers
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                With Client
              </span>
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
              {kpiData?.withClient ?? 0}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Signed out for filing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Expiring in ≤30 Days
              </span>
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
              {kpiData?.expiringIn30Days ?? 0}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Requires renewal action
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Expired Tokens
              </span>
              <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-700 dark:text-rose-400">
              {kpiData?.expired ?? 0}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Validity lapsed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Expiring Filters & 1-Click Renewal Ribbon (F-74 & F-75) */}
      <DSCExpiryRibbon
        kpiData={kpiData}
        activeFilter={activeRibbonFilter}
        onFilterChange={handleRibbonFilterChange}
      />

      {/* 4. Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by certificate name, dongle serial no, slot location, or holder..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-[160px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
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

          {/* Expiry Window Filter */}
          <div className="w-[180px]">
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Expiry Window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Validity Windows</SelectItem>
                <SelectItem value="7">Expiring in 7 Days</SelectItem>
                <SelectItem value="15">Expiring in 15 Days</SelectItem>
                <SelectItem value="30">Expiring in 30 Days</SelectItem>
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

      {/* 5. DSC Inventory Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[230px]">Certificate & Client</TableHead>
              <TableHead className="w-[150px]">Token Details</TableHead>
              <TableHead className="w-[150px]">Storage Location</TableHead>
              <TableHead className="w-[170px]">Validity & Expiry</TableHead>
              <TableHead className="w-[120px]">Custody Status</TableHead>
              <TableHead className="w-[140px]">Current Holder</TableHead>
              <TableHead className="w-[70px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isListLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-28" />
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
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <p className="text-base font-medium">
                      No DSC records found
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {search ||
                      statusFilter !== "all" ||
                      expiryFilter !== "all"
                        ? "Try adjusting your search criteria or resetting filters."
                        : "There are currently no digital signature certificates logged in the directory."}
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
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingDsc(null);
                          setIsCreateModalOpen(true);
                        }}
                        className="text-xs gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Register First DSC
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              dscs.map((dsc) => {
                const client =
                  typeof dsc.clientId === "object" ? dsc.clientId : null;
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
                    {/* Certificate & Client */}
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">
                        {dsc.certificateName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <span className="font-medium text-foreground/80">
                          {client?.name || "Unassigned Client"}
                        </span>
                        {client?.entityType && (
                          <span className="text-[10px] text-muted-foreground/70">
                            • {client.entityType}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Token Details */}
                    <TableCell>
                      <div className="text-xs font-medium text-foreground">
                        {dsc.tokenType}{" "}
                        <span className="text-muted-foreground text-[11px]">
                          ({dsc.certificateClass})
                        </span>
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
                            {dsc.currentHolderName ||
                              client?.name ||
                              "Client Rep"}
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

                          <DropdownMenuSeparator />

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

                          <DropdownMenuItem
                            onClick={() => handleDelete(dsc)}
                            className="gap-2 text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Decommission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer Count */}
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground bg-muted/20">
          <span>
            Showing <strong className="text-foreground">{dscs.length}</strong>{" "}
            of{" "}
            <strong className="text-foreground">
              {listData?.total ?? dscs.length}
            </strong>{" "}
            DSC tokens
          </span>
          {listData?.totalPages && listData.totalPages > 1 && (
            <span>
              Page {listData.page} of {listData.totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Modals & Slide-over Sheets */}
      <CreateDSCModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        dscToEdit={editingDsc}
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
    </div>
  );
}
