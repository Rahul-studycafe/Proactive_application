"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileUp,
  Plus,
  RefreshCw,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MoreVertical,
  ExternalLink,
  Copy,
  Ban,
  Archive,
  Radar,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  useGetDocumentRequestsQuery,
  useResendDocumentRequestMutation,
  useCancelDocumentRequestMutation,
  useTriggerExpiredRequestsScanMutation,
} from "@/lib/services/api";
import { DocumentRequest } from "@/lib/types/document-request";
import { CreateDocRequestModal } from "@/components/documents/CreateDocRequestModal";
import { MagicLinkShareDialog } from "@/components/documents/MagicLinkShareDialog";

export default function DocumentRequestsHubPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareDialogRequest, setShareDialogRequest] = useState<DocumentRequest | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const [resendEmail] = useResendDocumentRequestMutation();
  const [cancelRequest] = useCancelDocumentRequestMutation();
  const [triggerScan, { isLoading: isScanning }] = useTriggerExpiredRequestsScanMutation();

  const queryParams = useMemo(() => {
    return {
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      limit: 100,
    };
  }, [search, statusFilter]);

  const {
    data: listData,
    isLoading,
    isFetching,
    refetch,
  } = useGetDocumentRequestsQuery(queryParams);

  const requests: DocumentRequest[] = listData?.requests || [];
  const summary = listData?.summary || {
    pending: 0,
    partiallyUploaded: 0,
    completed: 0,
    expired: 0,
    totalRequests: requests.length,
  };

  const handleScanExpired = async () => {
    try {
      const res = await triggerScan().unwrap();
      toast.success(
        `Scanned ${res.scannedCount} requests. ${res.expiredCount} marked expired.`
      );
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to trigger scan");
    }
  };

  const handleResend = async (req: DocumentRequest) => {
    try {
      const res = await resendEmail(req._id).unwrap();
      toast.success(
        res.emailDispatched
          ? "Reminder email dispatched to client!"
          : "Magic link ready (no client email registered)."
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resend reminder");
    }
  };

  const handleCancel = async (req: DocumentRequest) => {
    if (!confirm(`Cancel request #${req.requestNo}? The client magic link will be invalidated.`)) {
      return;
    }
    try {
      await cancelRequest(req._id).unwrap();
      toast.success("Document request cancelled and link revoked.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel request");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileUp className="h-6 w-6 text-primary" />
            Document Requests Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Collect checklists of required files from clients via passwordless mobile-friendly magic links.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScanExpired}
            disabled={isScanning}
            title="Scan for expired magic links"
            id="scan-expired-links-btn"
          >
            <Radar className={`h-4 w-4 mr-1.5 ${isScanning ? "animate-spin text-primary" : ""}`} />
            {isScanning ? "Scanning..." : "Scan Expired"}
          </Button>

          <Button
            size="sm"
            id="new-doc-request-btn"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Document Request
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated upload links</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200/50 dark:border-amber-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Pending Uploads
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {summary.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting client files</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-200/50 dark:border-blue-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Partially Uploaded
            </CardTitle>
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {summary.partiallyUploaded}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Some files received</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200/50 dark:border-emerald-900/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {summary.completed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">100% files collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search request title or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              id="search-requests-input"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] text-xs h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Partially Uploaded">Partially Uploaded</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh requests"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[120px]">Request No</TableHead>
              <TableHead className="min-w-[200px]">Title & Instructions</TableHead>
              <TableHead className="min-w-[160px]">Client</TableHead>
              <TableHead className="min-w-[150px]">Upload Progress</TableHead>
              <TableHead className="min-w-[120px]">Expires</TableHead>
              <TableHead className="min-w-[110px]">Status</TableHead>
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
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileUp className="h-10 w-10 text-muted-foreground/30" />
                    <div className="font-medium text-foreground">No document requests found</div>
                    <p className="text-xs max-w-sm">
                      {hasActiveFilters
                        ? "Try clearing or adjusting your search filters."
                        : "Send your first passwordless document request link to a client."}
                    </p>
                    {!hasActiveFilters && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Document Request
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => {
                const client = typeof req.clientId === "object" ? req.clientId : null;
                const totalFiles = req.progress?.totalFiles ?? req.items?.length ?? 0;
                const uploadedFiles =
                  req.progress?.uploadedFiles ??
                  req.items?.filter((it) => it.status === "Uploaded").length ??
                  0;
                const progressPct =
                  req.progress?.progressPercentage ??
                  (totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0);

                const isCompleted = req.status === "Completed";
                const isExpired = req.status === "Expired";
                const isCancelled = req.status === "Cancelled";
                const isPending = req.status === "Pending";
                const isPartial = req.status === "Partially Uploaded";

                const publicUrl =
                  req.uploadUrl ||
                  (typeof window !== "undefined"
                    ? `${window.location.origin}/public/upload/${req.token}`
                    : `/public/upload/${req.token}`);

                return (
                  <TableRow key={req._id} className="hover:bg-muted/40 transition-colors">
                    {/* Request No */}
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-primary">
                        #{req.requestNo}
                      </span>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      <div className="font-medium text-foreground line-clamp-1">
                        {req.title}
                      </div>
                      {req.instructions ? (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {req.instructions}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {totalFiles} items requested
                        </div>
                      )}
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      {client ? (
                        <div>
                          <Link
                            href={`/clients/${client._id}`}
                            className="font-medium hover:underline text-foreground line-clamp-1 text-sm"
                          >
                            {client.name}
                          </Link>
                          {client.email && (
                            <div className="text-xs text-muted-foreground">
                              {client.email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">
                            {uploadedFiles}/{totalFiles} Files
                          </span>
                          <span className="text-muted-foreground font-semibold">
                            {progressPct}%
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                    </TableCell>

                    {/* Expiry */}
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.expiresAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 w-fit"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed</span>
                        </Badge>
                      )}
                      {isPartial && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 flex items-center gap-1 w-fit"
                        >
                          <Clock className="h-3 w-3" />
                          <span>In Progress</span>
                        </Badge>
                      )}
                      {isPending && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 flex items-center gap-1 w-fit"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </Badge>
                      )}
                      {isExpired && (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expired</span>
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-muted-foreground">
                          <Ban className="h-3 w-3" />
                          <span>Cancelled</span>
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onClick={() => {
                              setShareDialogRequest(req);
                              setIsShareDialogOpen(true);
                            }}
                            className="font-medium"
                          >
                            <Copy className="h-4 w-4 mr-2 text-primary" />
                            Share Magic Link
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Client Portal
                            </a>
                          </DropdownMenuItem>

                          {!isCompleted && !isCancelled && !isExpired && (
                            <DropdownMenuItem onClick={() => handleResend(req)}>
                              <Send className="h-4 w-4 mr-2" />
                              Resend Email Reminder
                            </DropdownMenuItem>
                          )}

                          {!isCompleted && !isCancelled && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleCancel(req)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancel & Revoke Link
                              </DropdownMenuItem>
                            </>
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

      {/* Create Modal */}
      <CreateDocRequestModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={(createdReq) => {
          setShareDialogRequest(createdReq);
          setIsShareDialogOpen(true);
        }}
      />

      {/* Magic Link Share Dialog */}
      <MagicLinkShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        request={shareDialogRequest}
      />
    </div>
  );
}
