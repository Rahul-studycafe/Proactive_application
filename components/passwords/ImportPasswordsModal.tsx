"use client";

import { useState, useRef } from "react";
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
import { useBulkImportPasswordsMutation } from "@/lib/services/api";
import { BulkImportPasswordsResponse } from "@/lib/types/passwords";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ImportPasswordsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClientName?: string;
  defaultClientFileNo?: string;
}

export function ImportPasswordsModal({
  open,
  onOpenChange,
  defaultClientName,
  defaultClientFileNo,
}: ImportPasswordsModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<BulkImportPasswordsResponse | null>(
    null,
  );
  const [showSkipped, setShowSkipped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkImport, { isLoading }] = useBulkImportPasswordsMutation();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExts = [".xlsx", ".xls", ".csv"];
    const fileName = file.name.toLowerCase();
    const isValid = validExts.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      toast.error(
        "Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file",
      );
      return;
    }

    setSelectedFile(file);
    setResult(null);
  };

  const downloadSampleTemplate = () => {
    const clientIdentifier =
      defaultClientFileNo || defaultClientName || "CLI-001";
    const csvContent =
      "Client File No,Portal Name,Username,Password,Portal URL,Notes\n" +
      `${clientIdentifier},GST Portal,27AAAAA0000A1Z5,GstPass@2026,https://services.gst.gov.in,Primary GSTIN\n` +
      `${clientIdentifier},Income Tax e-Filing,ABCDE1234F,Itax@2026,https://eportal.incometax.gov.in,Director PAN\n` +
      `${clientIdentifier},MCA / ROC,V2_LOGIN,McaPass#123,https://www.mca.gov.in,V2 User Account\n` +
      `${clientIdentifier},TRACES,ABCDE1234F_TAN,Traces@2026,https://www.tdscpc.gov.in,TDS Portal Login\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pms_passwords_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Sample import template downloaded");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await bulkImport(formData).unwrap();
      setResult(res);
      toast.success(
        `Imported ${res.importedCount} new, updated ${res.updatedCount} credentials`,
      );
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Failed to process spreadsheet";
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Bulk Import Passwords
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Upload spreadsheet with client credentials for batch
                  encryption.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleTemplate}
              className="text-xs h-8 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sample Template</span>
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              {/* Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                    : selectedFile
                      ? "border-emerald-500/60 bg-emerald-500/5"
                      : "border-border/80 hover:border-emerald-500/40 hover:bg-muted/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready to
                        ingest
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-xs h-7 text-destructive hover:bg-destructive/10 mt-1"
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drag and drop your spreadsheet here
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Supports <span className="font-medium">.xlsx</span>,{" "}
                        <span className="font-medium">.xls</span>, and{" "}
                        <span className="font-medium">.csv</span> up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported Columns Guide */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/50 text-xs space-y-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  Expected Column Headers:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Client File No / Name",
                    "Portal Name",
                    "Username",
                    "Password",
                    "Portal URL",
                    "Notes",
                  ].map((col) => (
                    <Badge
                      key={col}
                      variant="secondary"
                      className="text-[11px] font-mono"
                    >
                      {col}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Passwords will be encrypted individually at rest using
                  AES-256-CBC.
                </p>
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={!selectedFile || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Encrypting...</span>
                    </div>
                  ) : (
                    "Upload & Ingest"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm text-foreground">
                  Batch Import Completed
                </h4>
                <p className="text-xs text-muted-foreground">
                  Processed {result.totalRows} spreadsheet row(s)
                </p>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    New Credentials Added
                  </span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {result.importedCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Updated Credentials
                  </span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {result.updatedCount}
                  </p>
                </div>
              </div>

              {/* Skipped / Errors if any */}
              {result.skippedErrors && result.skippedErrors.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSkipped(!showSkipped)}
                    className="w-full flex items-center justify-between p-3 text-xs font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>
                        {result.skippedErrors.length} Row(s) Skipped / Failed
                      </span>
                    </div>
                    {showSkipped ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showSkipped && (
                    <div className="px-3 pb-3 max-h-40 overflow-y-auto space-y-1 border-t border-amber-500/20 pt-2 text-[11px] font-mono text-amber-800 dark:text-amber-200">
                      {result.skippedErrors.map((err, idx) => (
                        <div key={idx} className="p-1 rounded bg-background/50">
                          {err}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleClose}
                  className="w-full sm:w-auto"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
