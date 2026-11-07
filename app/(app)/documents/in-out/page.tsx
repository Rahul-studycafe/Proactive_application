"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FolderSync,
  Plus,
  RefreshCw,
  Search,
  X,
  FileCheck,
  AlertTriangle,
  Clock,
  MapPin,
  MoreVertical,
  CheckCircle2,
  Printer,
  Pencil,
  Trash2,
  Download,
  Radar,
  ArrowDownLeft,
  ArrowUpRight,
  Archive,
  Grid,
  ListFilter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetPhysicalDocsQuery,
  useDeletePhysicalDocMutation,
  useTriggerOverdueDocsScanMutation,
} from "@/lib/services/api";
import {
  PhysicalDocument,
  PhysicalDocCategory,
  PhysicalDocType,
} from "@/lib/types/physical-document";
import { InOutEntryModal } from "@/components/documents/InOutEntryModal";
import { RecordReturnModal } from "@/components/documents/RecordReturnModal";
import { StorageLocationsView } from "@/components/documents/StorageLocationsView";
import { MovementHistoryModal } from "@/components/documents/MovementHistoryModal";
import { History as HistoryIcon } from "lucide-react";
import { withPermission } from "@/components/shared/withPermission";
import { Can } from "@/contexts/PermissionsContext";

function DocsInOutPage() {
  const [activeView, setActiveView] = useState<"register" | "storage">(
    "register",
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<PhysicalDocument | null>(null);

  const [returnDoc, setReturnDoc] = useState<PhysicalDocument | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [deleteDoc] = useDeletePhysicalDocMutation();
  const [triggerScan, { isLoading: isScanning }] =
    useTriggerOverdueDocsScanMutation();

  const queryParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      documentType: docTypeFilter !== "all" ? docTypeFilter : undefined,
      location: selectedLocation || undefined,
      limit: 100,
    };
  }, [search, categoryFilter, statusFilter, docTypeFilter, selectedLocation]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetPhysicalDocsQuery(queryParams);

  const documents: PhysicalDocument[] = listData?.documents || [];
  const overdueCount = listData?.overdueCount || 0;

  // KPI Computations
  const stats = useMemo(() => {
    const total = listData?.total || documents.length;
    let inCustody = 0;
    let returned = 0;
    let overdue = overdueCount;

    documents.forEach((d) => {
      if (d.status === "In Custody") inCustody++;
      if (d.status === "Returned") returned++;
      if (d.status === "Overdue") overdue = Math.max(overdue, 1);
    });

    return { total, inCustody, returned, overdue };
  }, [documents, listData, overdueCount]);

  const handleScanOverdue = async () => {
    try {
      const res = await triggerScan().unwrap();
      toast.success(
        `Scanned ${res.scannedCount} documents. ${res.overdueMarkedCount} marked overdue.`,
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to trigger overdue scanner");
    }
  };

  const handleExportCsv = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const exportUrl = `${baseUrl}/api/v1/docs-in-out/export${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    window.open(exportUrl, "_blank");
  };

  const handleDelete = async (doc: PhysicalDocument) => {
    if (
      !confirm(
        `Are you sure you want to delete the record for "${doc.documentName}"?`,
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc._id).unwrap();
      toast.success("Document custody record deleted successfully.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete record");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDocTypeFilter("all");
    setSelectedLocation(null);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    docTypeFilter !== "all" ||
    selectedLocation !== null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderSync className="h-6 w-6 text-primary" />
            Documents In-Out Register
          </h1>
          <p className="text-sm text-muted-foreground">
            Track custody of client original deeds, passbooks, physical cheque
            books, and company seals.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanOverdue}
            disabled={isScanning}
            title="Scan for overdue returnable documents"
            id="scan-overdues-btn"
          >
            <Radar
              className={`h-4 w-4 mr-1.5 ${isScanning ? "animate-spin text-primary" : ""}`}
            />
            {isScanning ? "Scanning..." : "Scan Overdues"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            id="export-csv-btn"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>

          <Can do="document:create">
            <Button
              size="sm"
              id="log-in-out-btn"
              onClick={() => {
                setDocToEdit(null);
                setIsEntryModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Log In / Out
            </Button>
          </Can>
        </div>
      </div>

      {/* Overdue Warning Alert Bar (F-84) */}
      {overdueCount > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">
                {overdueCount} Returnable Document{overdueCount > 1 ? "s" : ""}{" "}
                Overdue
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                Original client assets have passed their agreed return date and
                are still pending handover.
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-100 shrink-0"
            onClick={() => {
              setActiveView("register");
              setStatusFilter("Overdue");
            }}
          >
            Filter Overdue Items
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Logged
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Physical items registered
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-400">
              In Office Custody
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.inCustody}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently held in cabinets
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Overdue Returns
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Past expected return date
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Returned & Acknowledged
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.returned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Safely handed back
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main View Tabs (Register Desk vs Storage Master F-83) */}
      <Tabs
        value={activeView}
        onValueChange={(val) => setActiveView(val as any)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <TabsList>
            <TabsTrigger
              value="register"
              className="flex items-center gap-1.5"
              id="tab-register-desk"
            >
              <ListFilter className="h-4 w-4" />
              <span>Register Desk</span>
            </TabsTrigger>
            <TabsTrigger
              value="storage"
              className="flex items-center gap-1.5"
              id="tab-storage-locations"
            >
              <Grid className="h-4 w-4" />
              <span>Office Storage Units</span>
            </TabsTrigger>
          </TabsList>

          {selectedLocation && (
            <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              <span>
                Location filter: <strong>{selectedLocation}</strong>
              </span>
              <button
                onClick={() => setSelectedLocation(null)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: REGISTER DESK */}
        <TabsContent value="register" className="space-y-4 m-0">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search document name, bearer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  id="search-docs-input"
                />
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
                {["all", "Received", "Given"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      categoryFilter === cat
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] text-xs h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="In Custody">In Custody</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              {/* Document Type Filter */}
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-[150px] text-xs h-9">
                  <SelectValue placeholder="Doc Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Passbook">Passbook</SelectItem>
                  <SelectItem value="Cheque Book">Cheque Book</SelectItem>
                  <SelectItem value="Original Deeds">Original Deeds</SelectItem>
                  <SelectItem value="PAN Card">PAN Card</SelectItem>
                  <SelectItem value="Registration Certificate">
                    Registration Cert.
                  </SelectItem>
                  <SelectItem value="Company Seal">Company Seal</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[110px]">Category</TableHead>
                  <TableHead className="min-w-[200px]">
                    Document & Type
                  </TableHead>
                  <TableHead className="min-w-[160px]">Client</TableHead>
                  <TableHead className="min-w-[140px]">
                    Storage Location
                  </TableHead>
                  <TableHead className="min-w-[110px]">Date</TableHead>
                  <TableHead className="min-w-[130px]">Status / Due</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Archive className="h-10 w-10 text-muted-foreground/30" />
                        <div className="font-medium text-foreground">
                          No documents found
                        </div>
                        <p className="text-xs max-w-sm">
                          {hasActiveFilters
                            ? "Try adjusting your search filters to find what you are looking for."
                            : "No client physical assets have been logged yet. Click 'Log In / Out' above to add one."}
                        </p>
                        {!hasActiveFilters && (
                          <Button
                            size="sm"
                            className="mt-2"
                            id="empty-log-btn"
                            onClick={() => {
                              setDocToEdit(null);
                              setIsEntryModalOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Log First Asset
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => {
                    const client =
                      typeof doc.clientId === "object" ? doc.clientId : null;
                    const isOverdue = doc.status === "Overdue";
                    const isInCustody = doc.status === "In Custody";
                    const isReturned = doc.status === "Returned";

                    return (
                      <TableRow
                        key={doc._id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        {/* Category */}
                        <TableCell>
                          {doc.category === "Received" ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit"
                            >
                              <ArrowDownLeft className="h-3 w-3" />
                              <span>Received</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 flex items-center gap-1 w-fit"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                              <span>Given</span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* Document Name & Type */}
                        <TableCell>
                          <div className="font-medium text-foreground line-clamp-1">
                            {doc.documentName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-primary/80">
                              {doc.documentType}
                            </span>
                            {doc.isReturnable && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5"
                              >
                                Returnable
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Client */}
                        <TableCell>
                          {client ? (
                            <div>
                              <Link
                                href={`/clients/${client._id}?tab=docs-in-out`}
                                className="font-medium hover:underline text-foreground line-clamp-1"
                              >
                                {client.name}
                              </Link>
                              {(client.clientNumber || client.fileNo) && (
                                <div className="text-xs text-muted-foreground">
                                  Client No: {client.clientNumber || client.fileNo}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>

                        {/* Storage Location */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span
                              className="truncate max-w-[150px]"
                              title={doc.location}
                            >
                              {doc.location}
                            </span>
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(doc.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>

                        {/* Status & Return Date */}
                        <TableCell>
                          {isOverdue && (
                            <div>
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 w-fit"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </Badge>
                              {doc.returnDate && (
                                <div className="text-[11px] text-destructive font-medium mt-0.5">
                                  Due{" "}
                                  {new Date(doc.returnDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {isInCustody && (
                            <div>
                              <Badge
                                variant="outline"
                                className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                              >
                                In Custody
                              </Badge>
                              {doc.returnDate && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  Due{" "}
                                  {new Date(doc.returnDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    },
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {isReturned && (
                            <div>
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Returned
                              </Badge>
                              {doc.actualReturnedDate && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  on{" "}
                                  {new Date(
                                    doc.actualReturnedDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {(isInCustody || isOverdue) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setReturnDoc(doc);
                                    setIsReturnModalOpen(true);
                                  }}
                                  className="text-emerald-600 focus:text-emerald-600 font-medium"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Record Return
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => {
                                  setHistoryDocId(doc._id);
                                  setIsHistoryModalOpen(true);
                                }}
                              >
                                <HistoryIcon className="h-4 w-4 mr-2" />
                                Movement History
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/documents/in-out/${doc._id}/slip`}
                                  className="flex items-center"
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print Handover Slip
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => {
                                  setDocToEdit(doc);
                                  setIsEntryModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Record
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleDelete(doc)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
          </div>
        </TabsContent>

        {/* TAB 2: OFFICE STORAGE LOCATIONS MASTER (F-83) */}
        <TabsContent value="storage" className="m-0">
          <StorageLocationsView
            onSelectLocation={(loc) => {
              setSelectedLocation(loc);
              setActiveView("register");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Entry Modal (New / Edit) */}
      <InOutEntryModal
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        docToEdit={docToEdit}
      />

      {/* Return Acknowledgment Modal (F-84) */}
      <RecordReturnModal
        open={isReturnModalOpen}
        onOpenChange={setIsReturnModalOpen}
        document={returnDoc}
      />

      {/* Movement History Modal */}
      <MovementHistoryModal
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        documentId={historyDocId}
      />
    </div>
  );
}

export default withPermission(DocsInOutPage, "document:view", {
  title: "Documents Register Access Restricted",
  description:
    "You do not have permission to view physical documents custody records. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
