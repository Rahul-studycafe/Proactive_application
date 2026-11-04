"use client";

import { use, useState, useRef } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UploadCloud,
  FileCheck2,
  XCircle,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  File,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetPublicDocumentRequestQuery,
  useUploadPublicDocumentFileMutation,
} from "@/lib/services/api";
import { RequestedFileItem } from "@/lib/types/document-request";

interface PublicUploadPageProps {
  params: Promise<{ token: string }>;
}

export default function PublicUploadPage({ params }: PublicUploadPageProps) {
  const { token } = use(params);

  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useGetPublicDocumentRequestQuery(token);

  const [uploadFile, { isLoading: isUploading }] =
    useUploadPublicDocumentFileMutation();

  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="max-w-xl w-full space-y-4">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    const errorMsg =
      (error as any)?.data?.message ||
      "This document request link is invalid, expired, or was cancelled by the firm.";

    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6 space-y-4 shadow-sm border-rose-200 dark:border-rose-900/50">
          <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-xl">Upload Portal Unavailable</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              {errorMsg}
            </CardDescription>
          </div>
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Please contact your accounting advisor or firm coordinator to
              request a renewed upload link.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const {
    items = [],
    client,
    firm,
    title,
    instructions,
    requestNo,
    expiresAt,
  } = request;

  const totalFiles = items.length;
  const uploadedFiles = items.filter((it) => it.status === "Uploaded").length;
  const requiredItems = items.filter((it) => it.isRequired);
  const requiredUploaded = requiredItems.filter(
    (it) => it.status === "Uploaded",
  ).length;

  const isFullyComplete =
    uploadedFiles === totalFiles ||
    (requiredItems.length > 0 && requiredUploaded === requiredItems.length);

  const progressPercent =
    totalFiles > 0 ? Math.round((uploadedFiles / totalFiles) * 100) : 0;

  const handleFileSelection = async (
    itemId: string,
    file: File,
    item: RequestedFileItem,
  ) => {
    // 1. Check size (< 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File "${file.name}" exceeds the maximum 25MB limit.`);
      return;
    }

    // 2. Check format against acceptedFormats
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const allowed = item.acceptedFormats?.map((f) =>
      f.toLowerCase().trim(),
    ) || [".pdf", ".xlsx", ".csv", ".zip", ".png", ".jpg"];

    if (!allowed.includes(ext)) {
      toast.error(
        `File format "${ext}" is not accepted for this item. Allowed formats: ${allowed.join(", ")}`,
      );
      return;
    }

    try {
      setUploadingItemId(itemId);
      await uploadFile({
        token,
        itemId,
        file,
      }).unwrap();

      toast.success(`"${file.name}" uploaded successfully!`);
      refetch();
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to upload file",
      );
    } finally {
      setUploadingItemId(null);
    }
  };

  const getFileIcon = (formats?: string[]) => {
    if (!formats || formats.includes(".pdf")) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    if (formats.some((f) => [".xlsx", ".csv", ".xls"].includes(f))) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    if (formats.some((f) => [".png", ".jpg", ".jpeg"].includes(f))) {
      return <FileImage className="h-5 w-5 text-purple-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Firm Branding Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-foreground">
                {firm?.name || "Accounting Office"}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Verified Client Document Portal</span>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-xs font-mono font-medium">
            Ref: {requestNo}
          </Badge>
        </div>

        {/* Main Upload Card */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Requested for:{" "}
                  <strong className="text-foreground">
                    {client?.name || "Client"}
                  </strong>
                </CardDescription>
              </div>

              <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 w-fit">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Valid till{" "}
                  {new Date(expiresAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {instructions && (
              <div className="mt-3 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground leading-relaxed border">
                <strong>Instructions:</strong> {instructions}
              </div>
            )}

            {/* Progress Bar */}
            <div className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">Upload Progress</span>
                <span className="text-primary font-bold">
                  {uploadedFiles} of {totalFiles} files ({progressPercent}%)
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Completion Banner (F-89) */}
            {isFullyComplete && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-900 dark:text-emerald-200 flex items-start gap-3.5 shadow-sm">
                <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    All Required Documents Submitted!
                  </div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                    Thank you, {client?.name}! Your accountant at {firm?.name}{" "}
                    has been notified and will review your files shortly. You
                    may close this page.
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Items */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const isItemUploaded = item.status === "Uploaded";
                const isCurrentUploading = uploadingItemId === item._id;
                const isDragOver = activeDragItemId === item._id;

                return (
                  <div
                    key={item._id || index}
                    className={`rounded-xl border p-4 transition-all ${
                      isItemUploaded
                        ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/60"
                        : isDragOver
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "bg-card hover:border-primary/40"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!isItemUploaded)
                        setActiveDragItemId(item._id || String(index));
                    }}
                    onDragLeave={() => setActiveDragItemId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setActiveDragItemId(null);
                      if (isItemUploaded) return;
                      const droppedFile = e.dataTransfer.files[0];
                      if (droppedFile && item._id) {
                        handleFileSelection(item._id, droppedFile, item);
                      }
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isItemUploaded ? (
                            <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                              {getFileIcon(item.acceptedFormats)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {item.name}
                            </span>
                            {item.isRequired ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                              >
                                Required
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 text-muted-foreground"
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

                          {item.acceptedFormats &&
                            item.acceptedFormats.length > 0 && (
                              <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                <span>Formats:</span>
                                <span className="font-mono text-foreground/80">
                                  {item.acceptedFormats.join(", ")}
                                </span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Upload Button or Status */}
                      <div className="shrink-0 flex items-center sm:self-center">
                        <input
                          type="file"
                          className="hidden"
                          ref={(el) => {
                            if (item._id) fileInputRefs.current[item._id] = el;
                          }}
                          accept={item.acceptedFormats?.join(",")}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && item._id) {
                              handleFileSelection(item._id, file, item);
                            }
                          }}
                        />

                        {isItemUploaded ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 text-xs py-1 px-2.5 flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Uploaded</span>
                            </Badge>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (item._id)
                                  fileInputRefs.current[item._id]?.click();
                              }}
                              disabled={isUploading}
                            >
                              Replace
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="text-xs h-9"
                            disabled={isUploading}
                            onClick={() => {
                              if (item._id)
                                fileInputRefs.current[item._id]?.click();
                            }}
                          >
                            {isCurrentUploading ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <UploadCloud className="h-4 w-4 mr-1.5" />
                                Choose File
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Trust Note */}
            <div className="pt-4 border-t text-center text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  256-bit encrypted transfer directly to practice document vault
                </span>
              </div>
              <div>Max file size 25MB per document.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
