"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadAttendanceCsv } from "@/lib/utils/download-stream";

export interface ExportAttendanceButtonProps {
  month: string | number;
  year: string | number;
  className?: string;
  variant?: "outline" | "default" | "secondary";
}

export function ExportAttendanceButton({
  month,
  year,
  className,
  variant = "outline",
}: ExportAttendanceButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = async () => {
    setIsDownloading(true);
    try {
      await downloadAttendanceCsv(month, year);
      toast.success(`Payroll CSV exported for ${month}/${year}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export payroll CSV");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleExport}
      disabled={isDownloading}
      className={`gap-2 ${className || ""}`}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      )}
      <span>Export Payroll CSV</span>
    </Button>
  );
}
