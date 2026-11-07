"use client";

import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import {
  FileText,
  FileUp,
  Plus,
  Send,
  Search,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  ExternalLink,
  Copy,
  Trash2,
  FolderSync,
  FileCheck2,
  Loader2,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Eye,
  RefreshCw,
  Ban,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetClientDocumentsQuery,
  useUploadClientDocumentMutation,
  useDeleteClientDocumentMutation,
  useGetDocumentRequestsQuery,
  useResendDocumentRequestMutation,
  useCancelDocumentRequestMutation,
  useGetPhysicalDocsQuery,
} from "@/lib/services/api";
import { DocumentRequest } from "@/lib/types/document-request";
import { CreateDocRequestModal } from "@/components/documents/CreateDocRequestModal";
import { MagicLinkShareDialog } from "@/components/documents/MagicLinkShareDialog";
import { ViewReceivedFilesModal } from "@/components/documents/ViewReceivedFilesModal";
import { ClientDocsInOutTab } from "./ClientDocsInOutTab";
import { formatDate } from "@/lib/utils";
import { usePermissions, Can } from "@/contexts/PermissionsContext";

interface ClientDocumentsTabProps {
  clientId: string;
  clientName?: string;
  initialSubTab?: "vault" | "requests" | "physical";
}

const getFileIcon = (fileName: string) => {
  if (!fileName) return <File className="h-5 w-5 text-muted-foreground" />;
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "doc":
    case "docx":
    case "txt":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return <FileImage className="h-5 w-5 text-purple-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

const getRequestStatusBadge = (status: DocumentRequest["status"]) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
        </Badge>
      );
    case "Partially Uploaded":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200">
          <Clock className="h-3 w-3 mr-1" /> Partial
        </Badge>
      );
    case "Expired":
      return (
        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Expired
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Ban className="h-3 w-3 mr-1" /> Cancelled
        </Badge>
      );
    case "Pending":
    default:
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
  }
};

export function ClientDocumentsTab({
  clientId,
  clientName,
  initialSubTab,
}: ClientDocumentsTabProps) {
  const { can, isSuperAdmin } = usePermissions();

  const canViewVault = isSuperAdmin || can("document:view") || can("document:create");
  const canRequestDocs = isSuperAdmin || can("document:request");
  const canPhysicalManage = isSuperAdmin || can("document:physical_manage");

  const defaultSubTab =
    initialSubTab ||
    (canViewVault
      ? "vault"
      : canRequestDocs
        ? "requests"
        : canPhysicalManage
          ? "physical"
          : "vault");

  const [subTab, setSubTab] = useState<"vault" | "requests" | "physical">(
    defaultSubTab,
  );

  // --- 1. Digital Vault Queries & Mutations ---
  const {
    data: documentsResponse,
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useGetClientDocumentsQuery({ clientId });
  const rawDocuments = Array.isArray(documentsResponse)
    ? documentsResponse
    : documentsResponse?.data || [];

  const [uploadDoc, { isLoading: isUploading }] =
    useUploadClientDocumentMutation();
  const [deleteDoc] = useDeleteClientDocumentMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vaultSearch, setVaultSearch] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!vaultSearch.trim()) return rawDocuments;
    const q = vaultSearch.toLowerCase();
    return rawDocuments.filter(
      (doc: any) =>
        doc.fileName?.toLowerCase().includes(q) ||
        doc.uploadedBy?.name?.toLowerCase().includes(q),
    );
  }, [rawDocuments, vaultSearch]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("category", "document");
      formData.append("file", file);

      await uploadDoc({
        clientId,
        data: formData,
      }).unwrap();

      toast.success("Document uploaded successfully to client vault");
      refetchDocs();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload document");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDoc({ id, clientId }).unwrap();
      toast.success("Document removed from vault");
      refetchDocs();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete document");
    }
  };

  // --- 2. Client Requests Queries & Modals ---
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shareDialogRequest, setShareDialogRequest] =
    useState<DocumentRequest | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [viewFilesRequest, setViewFilesRequest] =
    useState<DocumentRequest | null>(null);
  const [isViewFilesModalOpen, setIsViewFilesModalOpen] = useState(false);

  const requestQueryParams = useMemo(() => {
    return {
      clientId,
      search: requestSearch.trim() || undefined,
      status: requestStatusFilter !== "all" ? requestStatusFilter : undefined,
      limit: 50,
    };
  }, [clientId, requestSearch, requestStatusFilter]);

  const {
    data: requestsData,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useGetDocumentRequestsQuery(requestQueryParams);

  const requests: DocumentRequest[] = requestsData?.requests || [];
  const activeRequestsCount = useMemo(() => {
    return requests.filter(
      (r) => r.status === "Pending" || r.status === "Partially Uploaded",
    ).length;
  }, [requests]);

  const [resendEmail] = useResendDocumentRequestMutation();
  const [cancelRequest] = useCancelDocumentRequestMutation();

  const handleResend = async (req: DocumentRequest) => {
    try {
      const res = await resendEmail(req._id).unwrap();
      toast.success(
        res.emailDispatched
          ? "Reminder email dispatched to client!"
          : "Magic link ready (no client email configured).",
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resend reminder");
    }
  };

  const handleCancel = async (req: DocumentRequest) => {
    if (
      !confirm(
        `Are you sure you want to cancel document request #${req.requestNo}? This will revoke the client's upload link.`,
      )
    ) {
      return;
    }
    try {
      await cancelRequest(req._id).unwrap();
      toast.success(`Request #${req.requestNo} cancelled`);
      refetchRequests();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel request");
    }
  };

  const handleRequestCreated = (
    newReq: DocumentRequest & { uploadUrl: string; emailDispatched: boolean },
  ) => {
    refetchRequests();
    setShareDialogRequest(newReq);
    setIsShareDialogOpen(true);
  };

  // --- 3. Physical Docs Overview Query ---
  const { data: physicalDocsData } = useGetPhysicalDocsQuery({
    clientId,
    limit: 100,
  });
  const inCustodyCount = useMemo(() => {
    const list = physicalDocsData?.documents || [];
    return list.filter((d: any) => d.status === "In Custody").length;
  }, [physicalDocsData]);

  return (
    <div className="space-y-6">
      {/* Hidden file input for staff manual upload */}
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {/* Top Header & Unified Action Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold">Document Center</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage vault files, request checklists from client, and track
            physical custody.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Can do="document:request">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-medium"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Send className="h-3.5 w-3.5 text-primary" />
              Request from Client
            </Button>
          </Can>

          <Can do="document:create">
            <Button
              size="sm"
              className="gap-2 text-xs font-medium"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Upload Document
            </Button>
          </Can>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex items-center gap-2 border-b pb-3">
        {canViewVault && (
          <button
            type="button"
            onClick={() => setSubTab("vault")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === "vault"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Digital Vault</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subTab === "vault"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground border"
              }`}
            >
              {rawDocuments.length}
            </span>
          </button>
        )}

        {canRequestDocs && (
          <button
            type="button"
            onClick={() => setSubTab("requests")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === "requests"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>Client Requests</span>
            {activeRequestsCount > 0 ? (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  subTab === "requests"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                {activeRequestsCount} Active
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  subTab === "requests"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground border"
                }`}
              >
                {requests.length}
              </span>
            )}
          </button>
        )}

        {canPhysicalManage && (
          <button
            type="button"
            onClick={() => setSubTab("physical")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === "physical"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FolderSync className="h-3.5 w-3.5" />
            <span>Physical In-Out Register</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subTab === "physical"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground border"
              }`}
            >
              {inCustodyCount} in custody
            </span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: DIGITAL VAULT */}
      {subTab === "vault" && (
        <Card className="shadow-sm border-border">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search uploaded files..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
              {vaultSearch && (
                <button
                  type="button"
                  onClick={() => setVaultSearch("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span>
                Showing <strong>{filteredDocuments.length}</strong> of{" "}
                {rawDocuments.length} files
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => refetchDocs()}
                title="Refresh Vault"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {isDocsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileText className="h-6 w-6 opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {vaultSearch
                      ? "No matching documents found"
                      : "No documents in client vault"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {vaultSearch
                      ? "Try adjusting your search keywords."
                      : "Upload files directly or send a document collection request to your client."}
                  </p>
                </div>
                {!vaultSearch && (
                  <div className="flex items-center gap-2.5 mt-2">
                    <Can do="document:create">
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Upload Document
                      </Button>
                    </Can>
                    <Can do="document:request">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="gap-2 text-xs"
                      >
                        <Send className="h-3.5 w-3.5" /> Request from Client
                      </Button>
                    </Can>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredDocuments.map((doc: any) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                      <div className="shrink-0 p-2 rounded-lg bg-muted/60">
                        {getFileIcon(doc.fileName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate max-w-md">
                          {doc.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>
                            {doc.uploadedBy?.name
                              ? `Uploaded by ${doc.uploadedBy.name}`
                              : "Uploaded via client portal"}
                          </span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.category && (
                            <>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-normal uppercase"
                              >
                                {doc.category}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Can do="document:delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDocument(doc._id)}
                          title="Delete Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Can>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SUB-TAB 2: CLIENT REQUESTS */}
      {subTab === "requests" && (
        <Card className="shadow-sm border-border">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
                {requestSearch && (
                  <button
                    type="button"
                    onClick={() => setRequestSearch("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select
                value={requestStatusFilter}
                onValueChange={setRequestStatusFilter}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partially Uploaded">Partial</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Can do="document:request">
              <Button
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Send className="h-3.5 w-3.5" /> New Request
              </Button>
            </Can>
          </div>

          <CardContent className="p-0">
            {isRequestsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <FileUp className="h-6 w-6 opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {requestSearch || requestStatusFilter !== "all"
                      ? "No matching requests found"
                      : "No document requests sent to this client"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Send a customized multi-file checklist with a zero-login
                    magic link to collect files from this client.
                  </p>
                </div>
                <Can do="document:request">
                  <Button
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 text-xs mt-2"
                  >
                    <Send className="h-3.5 w-3.5" /> Request Documents Now
                  </Button>
                </Can>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[110px] text-xs">
                        Request #
                      </TableHead>
                      <TableHead className="text-xs">Title & Items</TableHead>
                      <TableHead className="w-[180px] text-xs">
                        Progress
                      </TableHead>
                      <TableHead className="w-[120px] text-xs">
                        Expires
                      </TableHead>
                      <TableHead className="w-[120px] text-xs">
                        Status
                      </TableHead>
                      <TableHead className="w-[130px] text-right text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => {
                      const totalItems = req.items?.length || 0;
                      const uploadedItems =
                        req.items?.filter((i) => i.status === "Uploaded")
                          .length || 0;
                      const percent =
                        totalItems > 0
                          ? Math.round((uploadedItems / totalItems) * 100)
                          : 0;

                      return (
                        <TableRow key={req._id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            <button
                              type="button"
                              onClick={() => {
                                setViewFilesRequest(req);
                                setIsViewFilesModalOpen(true);
                              }}
                              className="hover:underline cursor-pointer focus:outline-none"
                              title="Click to view details & files"
                            >
                              #{req.requestNo}
                            </button>
                          </TableCell>

                          <TableCell>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewFilesRequest(req);
                                  setIsViewFilesModalOpen(true);
                                }}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                              >
                                {req.title}
                              </button>
                              {req.instructions && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {req.instructions}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {req.items.slice(0, 3).map((it, idx) => (
                                  <button
                                    type="button"
                                    key={idx}
                                    onClick={() => {
                                      setViewFilesRequest(req);
                                      setIsViewFilesModalOpen(true);
                                    }}
                                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors hover:opacity-80 cursor-pointer ${
                                      it.status === "Uploaded"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                    title={
                                      it.status === "Uploaded"
                                        ? "Click to view received file"
                                        : "Awaiting client upload"
                                    }
                                  >
                                    {it.status === "Uploaded" ? (
                                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                    ) : (
                                      <Clock className="h-2.5 w-2.5" />
                                    )}
                                    <span className="truncate max-w-[120px]">
                                      {it.name}
                                    </span>
                                  </button>
                                ))}
                                {req.items.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground self-center">
                                    +{req.items.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-foreground">
                                  {uploadedItems} of {totalItems}
                                </span>
                                <span className="text-muted-foreground">
                                  {percent}%
                                </span>
                              </div>
                              <Progress value={percent} className="h-1.5" />
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(req.expiresAt)}
                          </TableCell>

                          <TableCell>
                            {getRequestStatusBadge(req.status)}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {uploadedItems > 0 ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10 hover:border-primary font-medium"
                                  onClick={() => {
                                    setViewFilesRequest(req);
                                    setIsViewFilesModalOpen(true);
                                  }}
                                  title="View uploaded documents"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View Files
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setViewFilesRequest(req);
                                    setIsViewFilesModalOpen(true);
                                  }}
                                  title="View checklist & status"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Details
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setViewFilesRequest(req);
                                      setIsViewFilesModalOpen(true);
                                    }}
                                    className="gap-2 cursor-pointer font-medium"
                                  >
                                    <Eye className="h-4 w-4 text-primary" />
                                    {uploadedItems > 0
                                      ? "View Received Files"
                                      : "View Request Checklist"}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => {
                                      setShareDialogRequest(req);
                                      setIsShareDialogOpen(true);
                                    }}
                                    className="gap-2 cursor-pointer"
                                  >
                                    <Share2 className="h-4 w-4 text-primary" />
                                    Share / Copy Link
                                  </DropdownMenuItem>

                                  {req.token && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        window.open(
                                          `/public/upload/${req.token}`,
                                          "_blank",
                                        )
                                      }
                                      className="gap-2 cursor-pointer"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Open Portal
                                    </DropdownMenuItem>
                                  )}

                                  {canRequestDocs && (
                                    <DropdownMenuItem
                                      onClick={() => handleResend(req)}
                                      className="gap-2 cursor-pointer"
                                    >
                                      <Send className="h-4 w-4" />
                                      Send Reminder
                                    </DropdownMenuItem>
                                  )}

                                  {canRequestDocs &&
                                    req.status !== "Completed" &&
                                    req.status !== "Cancelled" && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleCancel(req)}
                                          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                        >
                                          <Ban className="h-4 w-4" />
                                          Cancel Request
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SUB-TAB 3: PHYSICAL IN-OUT REGISTER */}
      {subTab === "physical" && <ClientDocsInOutTab clientId={clientId} />}

      {/* Create Request Modal */}
      <CreateDocRequestModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        defaultClientId={clientId}
        onSuccess={handleRequestCreated}
      />

      {/* Magic Link Share & WhatsApp Dialog */}
      <MagicLinkShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        request={shareDialogRequest}
      />

      {/* View Received Files Modal */}
      <ViewReceivedFilesModal
        open={isViewFilesModalOpen}
        onOpenChange={setIsViewFilesModalOpen}
        request={viewFilesRequest}
      />
    </div>
  );
}
