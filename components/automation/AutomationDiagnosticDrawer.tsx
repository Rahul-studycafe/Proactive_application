"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Code2,
  FileText,
  User,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { IAutomationLog, IAutomationLogDetail } from "@/lib/types/automation";
import { useTriggerTaskAutomationMutation } from "@/lib/services/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface AutomationDiagnosticDrawerProps {
  log: IAutomationLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutomationDiagnosticDrawer({
  log,
  open,
  onOpenChange,
}: AutomationDiagnosticDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "Created" | "Skipped" | "Failed">("all");
  const [showRawJson, setShowRawJson] = useState(false);
  const [triggerAutomation, { isLoading: isRetrying }] = useTriggerTaskAutomationMutation();

  if (!log) return null;

  const durationMs =
    log.completedAt && log.startedAt
      ? new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()
      : 0;

  const handleCopyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopied(true);
      toast.success("Diagnostic log copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy log");
    }
  };

  const handleRetry = async () => {
    try {
      const res = await triggerAutomation().unwrap();
      toast.success(
        `Retry execution finished: ${res.tasksCreated} created, ${res.tasksSkipped} skipped.`
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Retry failed");
    }
  };

  const filteredDetails = (log.details || []).filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const isSuccess = log.errorCount === 0;
  const isPartial = log.errorCount > 0 && log.tasksCreatedCount > 0;
  const isFailed = log.errorCount > 0 && log.tasksCreatedCount === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background border-l shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b bg-muted/20 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isFailed
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                    : isPartial
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                }
              >
                {isFailed ? "Failed" : isPartial ? "Partial Success" : "Success"}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono">
                {log.runType}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleCopyJson}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </Button>
            </div>
          </div>
          <SheetTitle className="text-base font-semibold pt-1">
            Automation Run Diagnostics
          </SheetTitle>
          <SheetDescription className="text-xs font-mono text-muted-foreground truncate">
            ID: {log._id}
          </SheetDescription>
        </SheetHeader>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Execution Time</span>
              </div>
              <div className="font-medium text-foreground">
                {log.startedAt
                  ? format(new Date(log.startedAt), "dd MMM yyyy, hh:mm:ss a")
                  : "—"}
              </div>
              <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Duration: {durationMs > 0 ? `${durationMs} ms` : "< 1 sec"}</span>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                <span>Trigger Source</span>
              </div>
              <div className="font-medium text-foreground">
                {log.triggeredBy ? log.triggeredBy.name : "BullMQ Cron Scheduler"}
              </div>
              <div className="text-muted-foreground text-[11px]">
                {log.triggeredBy?.email || "Midnight UTC Recurrence"}
              </div>
            </div>
          </div>

          {/* Counts Overview */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
              <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                Tasks Created
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {log.tasksCreatedCount}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-2.5">
              <div className="text-muted-foreground">Tasks Skipped</div>
              <div className="text-xl font-bold text-muted-foreground mt-1">
                {log.tasksSkippedCount}
              </div>
            </div>
            <div
              className={`rounded-lg border p-2.5 ${
                log.errorCount > 0
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                  : "bg-muted/30 text-muted-foreground"
              }`}
            >
              <div>Errors Encountered</div>
              <div className="text-xl font-bold mt-1">{log.errorCount}</div>
            </div>
          </div>

          {/* Error Banner if any */}
          {log.errorCount > 0 && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-400 space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>Execution encountered {log.errorCount} issue(s)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Check client package subscriptions, missing service blueprints, or
                validation parameters for the failed items below.
              </p>
            </div>
          )}

          {/* Details Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-xs text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Itemized Processing History</span>
                <Badge variant="outline" className="text-[10px] ml-1">
                  {log.details?.length || 0}
                </Badge>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1">
                {(["all", "Created", "Skipped", "Failed"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      filter === st
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {st === "all" ? "All" : st}
                  </button>
                ))}
              </div>
            </div>

            {filteredDetails.length === 0 ? (
              <div className="rounded-lg border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                No items match filter &quot;{filter}&quot;
              </div>
            ) : (
              <div className="rounded-lg border divide-y overflow-hidden max-h-64 overflow-y-auto">
                {filteredDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-xs space-y-1 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {detail.clientId?.name || "Client (Missing Reference)"}
                          {detail.clientId?.fileNo && (
                            <span className="text-[10px] text-muted-foreground ml-1 font-mono">
                              #{detail.clientId.fileNo}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {detail.serviceId?.name || "Service Blueprint"} · Period:{" "}
                          <span className="font-mono text-foreground">
                            {detail.period}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          detail.status === "Created"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : detail.status === "Failed"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                            : "border-slate-500/30 bg-slate-500/10 text-slate-500"
                        }`}
                      >
                        {detail.status}
                      </Badge>
                    </div>
                    {detail.reason && (
                      <div className="rounded bg-muted/50 p-1.5 text-[11px] text-muted-foreground font-mono">
                        {detail.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON Inspector Accordion */}
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full flex items-center justify-between p-3 text-xs font-medium bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Code2 className="h-3.5 w-3.5" />
                <span>Raw Diagnostic JSON Payload</span>
              </div>
              {showRawJson ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showRawJson && (
              <div className="p-3 bg-muted/10 border-t">
                <pre className="text-[10px] font-mono p-2.5 rounded bg-black/90 text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleRetry}
            disabled={isRetrying}
            className="gap-1.5"
          >
            <RotateCcw
              className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`}
            />
            <span>{isRetrying ? "Retrying..." : "Retry Task Generation"}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
