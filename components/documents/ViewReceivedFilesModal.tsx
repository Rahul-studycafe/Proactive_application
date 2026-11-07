"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useGetDocumentRequestByIdQuery } from "@/lib/services/api";
import {
  DocumentRequest,
  RequestedFileItem,
  UploadedDocumentRef,
} from "@/lib/types/document-request";
import {
  Eye,
  Download,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Calendar,
  User,
  FolderOpen,
} from "lucide-react";

interface ViewReceivedFilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: DocumentRequest | null;
}

export function getDocumentDownloadUrl(fileUrl?: string): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
    "http://localhost:5000";
  return `${backendBase}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
    case "xlsx":
    case "xls":
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return <FileImage className="h-5 w-5 text-blue-500 shrink-0" />;
    case "zip":
    case "rar":
    case "7z":
      return <FileArchive className="h-5 w-5 text-amber-500 shrink-0" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
}

export function ViewReceivedFilesModal({
  open,
  onOpenChange,
  request,
}: ViewReceivedFilesModalProps) {
  const [copied, setCopied] = useState(false);

  // Fetch full populated request data to guarantee uploadedDocumentId is populated
  const { data: liveRequest, isLoading } = useGetDocumentRequestByIdQuery(
    request?._id || "",
    {
      skip: !open || !request?._id,
      refetchOnMountOrArgChange: true,
    }
  );

  const activeRequest: DocumentRequest | null =
    liveRequest || request || null;

  if (!activeRequest) return null;

  const totalItems = activeRequest.items?.length || 0;
  const uploadedItems =
    activeRequest.items?.filter((it) => it.status === "Uploaded").length || 0;
  const progressPercent =
    totalItems > 0 ? Math.round((uploadedItems / totalItems) * 100) : 0;

  const clientName =
    typeof activeRequest.clientId === "object"
      ? activeRequest.clientId?.name
      : undefined;
  const clientEmail =
    typeof activeRequest.clientId === "object"
      ? activeRequest.clientId?.email
      : undefined;

  const frontendUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:8080";

  const publicUrl =
    activeRequest.uploadUrl ||
    `${frontendUrl}/public/upload/${activeRequest.token}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Client magic link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenFile = (rawUrl?: string, fileName?: string) => {
    if (!rawUrl) {
      toast.error("File URL is not available");
      return;
    }
    const fullUrl = getDocumentDownloadUrl(rawUrl);
    window.open(fullUrl, "_blank");
  };

  const handleDownloadFile = async (rawUrl?: string, fileName?: string) => {
    if (!rawUrl) {
      toast.error("File URL is not available");
      return;
    }
    const fullUrl = getDocumentDownloadUrl(rawUrl);
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error("Network response error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch {
      // Fallback: open directly in new window
      window.open(fullUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                  #{activeRequest.requestNo}
                </span>
                {activeRequest.status === "Completed" && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Completed (100%)
                  </Badge>
                )}
                {activeRequest.status === "Partially Uploaded" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300"
                  >
                    <Clock className="h-3 w-3 mr-1" /> Partially Uploaded
                  </Badge>
                )}
                {activeRequest.status === "Pending" && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300"
                  >
                    <Clock className="h-3 w-3 mr-1" /> Pending Client Upload
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-semibold text-foreground pt-1">
                {activeRequest.title}
              </DialogTitle>
              {activeRequest.instructions && (
                <DialogDescription className="text-xs text-muted-foreground line-clamp-2">
                  {activeRequest.instructions}
                </DialogDescription>
              )}
            </div>
          </div>

          {/* Quick Context Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 text-xs text-muted-foreground">
            {clientName && (
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-medium text-foreground">
                  {clientName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>
                Expires:{" "}
                {new Date(activeRequest.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                {uploadedItems} of {totalItems} items received
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pt-2">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </DialogHeader>

        {/* Checklist & Received Files List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Requested Items & Files ({totalItems})
            </h4>
            <span className="text-xs text-muted-foreground">
              {uploadedItems} received • {totalItems - uploadedItems} pending
            </span>
          </div>

          <div className="space-y-3">
            {activeRequest.items?.map((item: RequestedFileItem, idx: number) => {
              const isUploaded = item.status === "Uploaded";
              const isPending = item.status === "Pending";

              // Check if uploadedDocumentId is populated object or string ID
              const docRef: UploadedDocumentRef | undefined =
                item.uploadedDocumentId &&
                typeof item.uploadedDocumentId === "object"
                  ? (item.uploadedDocumentId as UploadedDocumentRef)
                  : undefined;

              const displayFileName =
                docRef?.fileName ||
                (isUploaded ? `${item.name} (Uploaded File)` : undefined);
              const fileUrl = docRef?.fileUrl;

              return (
                <div
                  key={item._id || idx}
                  className={`rounded-xl border p-4 transition-all ${
                    isUploaded
                      ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Item Information */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {item.name}
                        </span>
                        {item.isRequired ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            Required
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                          >
                            Optional
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      {item.acceptedFormats && item.acceptedFormats.length > 0 && (
                        <p className="text-[11px] text-muted-foreground/80 font-mono">
                          Formats: {item.acceptedFormats.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isUploaded ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 gap-1 text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Received
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 gap-1 text-xs"
                        >
                          <Clock className="h-3 w-3 text-amber-500" />
                          Awaiting File
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Uploaded File Details & Actions Box */}
                  {isUploaded && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 dark:bg-black/20 rounded-lg p-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getFileIcon(displayFileName || "file.pdf")}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-sm">
                            {displayFileName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            {item.uploadedAt && (
                              <span>
                                Uploaded on{" "}
                                {new Date(item.uploadedAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {fileUrl ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs bg-background text-primary border-primary/30 hover:bg-primary/5 hover:text-primary"
                              onClick={() => handleOpenFile(fileUrl, displayFileName)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={() =>
                                handleDownloadFile(fileUrl, displayFileName)
                              }
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() =>
                              window.open(publicUrl, "_blank")
                            }
                            title="Inspect in client portal"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open in Portal
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/10 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied Link
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy Client Link
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.open(publicUrl, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Portal
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

