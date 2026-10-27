"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExcelExportButtonProps {
  reportType: "tasks" | "invoices" | "debtors-aging" | "services";
  queryParams?: Record<string, any>;
  fileName?: string;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
}

export function ExcelExportButton({
  reportType,
  queryParams = {},
  fileName,
  label = "Export Excel",
  variant = "outline",
  size = "sm",
  className = "",
  showIcon = true,
}: ExcelExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading(`Generating ${label || "Excel report"}...`);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

      // Filter out undefined/null/empty params
      const cleanParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && val !== "all") {
          cleanParams.append(key, String(val));
        }
      });

      const queryString = cleanParams.toString();
      const exportUrl = `${baseUrl}/reports/${reportType}/export${
        queryString ? `?${queryString}` : ""
      }`;

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(exportUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        let errorMsg = "Export request failed";
        try {
          const json = await response.json();
          errorMsg = json.message || errorMsg;
        } catch {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadName =
        fileName ||
        `${reportType}-report-${new Date().toISOString().split("T")[0]}.xlsx`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Excel report downloaded successfully", { id: toastId });
    } catch (err: any) {
      toast.error("Failed to download report", {
        id: toastId,
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isExporting}
      onClick={handleExport}
      className={`gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium ${className}`}
    >
      {isExporting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : showIcon ? (
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ) : null}
      <span>{label}</span>
    </Button>
  );
}
