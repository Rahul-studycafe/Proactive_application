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
  ArrowDownLeft,
  ArrowUpRight,
  Archive,
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
import {
  useGetPhysicalDocsQuery,
  useDeletePhysicalDocMutation,
} from "@/lib/services/api";
import { PhysicalDocument } from "@/lib/types/physical-document";
import { InOutEntryModal } from "@/components/documents/InOutEntryModal";
import { RecordReturnModal } from "@/components/documents/RecordReturnModal";
import { MovementHistoryModal } from "@/components/documents/MovementHistoryModal";
import { History as HistoryIcon } from "lucide-react";
import { usePermissions, Can } from "@/contexts/PermissionsContext";

interface ClientDocsInOutTabProps {
  clientId: string;
}

export function ClientDocsInOutTab({ clientId }: ClientDocsInOutTabProps) {
  const { can, isSuperAdmin } = usePermissions();
  const canManagePhysical = isSuperAdmin || can("document:physical_manage");
  const canDeletePhysical = isSuperAdmin || can("document:delete");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<PhysicalDocument | null>(null);

  const [returnDoc, setReturnDoc] = useState<PhysicalDocument | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [historyDocId, setHistoryDocId] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [deleteDoc] = useDeletePhysicalDocMutation();

  const queryParams = useMemo(() => {
    return {
      clientId,
      search: search.trim() || undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: 100,
    };
  }, [clientId, search, categoryFilter, statusFilter]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetPhysicalDocsQuery(queryParams);

  const documents: PhysicalDocument[] = listData?.documents || [];

  // Summary Metrics for this client
  const stats = useMemo(() => {
    let inCustody = 0;
    let returned = 0;
    let overdue = 0;

    documents.forEach((d) => {
      if (d.status === "In Custody") inCustody++;
      if (d.status === "Returned") returned++;
      if (d.status === "Overdue") overdue++;
    });

    return { total: documents.length, inCustody, returned, overdue };
  }, [documents]);

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
      toast.success("Document record removed successfully.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete record");
    }
  };

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 pt-2">
      {/* Top Banner & KPI Row */}
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Physical items
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
            <p className="text-xs text-muted-foreground mt-0.5">
              In filing unit
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
            <p className="text-xs text-muted-foreground mt-0.5">
              Action required
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Returned
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.returned}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Handed back</p>
          </CardContent>
        </Card>
      </div>

      {/* Action and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search document name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Given">Given</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Custody">In Custody</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
              className="h-9 px-2 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
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

          {canManagePhysical && (
            <Button
              size="sm"
              className="h-9"
              id="log-client-doc-btn"
              onClick={() => {
                setDocToEdit(null);
                setIsEntryModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Log In / Out Asset
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead className="min-w-[180px]">Document & Type</TableHead>
              <TableHead className="min-w-[140px]">Office Location</TableHead>
              <TableHead className="min-w-[100px]">Date</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Archive className="h-10 w-10 text-muted-foreground/30" />
                    <div className="font-medium text-foreground">
                      No documents in register
                    </div>
                    <p className="text-xs max-w-sm">
                      {hasActiveFilters
                        ? "No document records match the active search and filter criteria."
                        : "No physical documents, deeds, or seals logged for this client yet."}
                    </p>
                    {!hasActiveFilters && canManagePhysical && (
                      <Button
                        size="sm"
                        className="mt-2"
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
                          className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit text-xs"
                        >
                          <ArrowDownLeft className="h-3 w-3" />
                          <span>Received</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 flex items-center gap-1 w-fit text-xs"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Given</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Document Name & Type */}
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1 text-sm">
                        {doc.documentName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-primary/80">
                          {doc.documentType}
                        </span>
                        {doc.isReturnable && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1"
                          >
                            Returnable
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Storage Location */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-foreground font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span
                          className="truncate max-w-[140px]"
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

                    {/* Status */}
                    <TableCell>
                      {isOverdue && (
                        <div>
                          <Badge
                            variant="destructive"
                            className="flex items-center gap-1 w-fit text-xs"
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
                            className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 text-xs"
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
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit text-xs"
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
                          {canManagePhysical && (isInCustody || isOverdue) && (
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

                          {(canManagePhysical || canDeletePhysical) && (
                            <DropdownMenuSeparator />
                          )}

                          {canManagePhysical && (
                            <DropdownMenuItem
                              onClick={() => {
                                setDocToEdit(doc);
                                setIsEntryModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Record
                            </DropdownMenuItem>
                          )}

                          {canDeletePhysical && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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

      {/* Entry Modal */}
      <InOutEntryModal
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        docToEdit={docToEdit}
        defaultClientId={clientId}
      />

      {/* Return Modal */}
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
