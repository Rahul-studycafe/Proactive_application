"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Calendar,
  Clock,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Zap,
  Server,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useGetAutomationLogsQuery } from "@/lib/services/api";
import { IAutomationLog } from "@/lib/types/automation";
import { AutomationDiagnosticDrawer } from "./AutomationDiagnosticDrawer";
import { format } from "date-fns";

interface AutomationLogsTableProps {
  initialLimit?: number;
  showFilters?: boolean;
}

export function AutomationLogsTable({
  initialLimit = 20,
  showFilters = true,
}: AutomationLogsTableProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [runTypeFilter, setRunTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<IAutomationLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetAutomationLogsQuery({
    page,
    limit: initialLimit,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination;

  // Client-side filtering on current page items for search and status
  const filteredLogs = logs.filter((log) => {
    if (runTypeFilter !== "all" && log.runType !== runTypeFilter) {
      return false;
    }

    if (statusFilter !== "all") {
      const isSuccess = log.errorCount === 0;
      const isFailed = log.errorCount > 0 && log.tasksCreatedCount === 0;
      const isPartial = log.errorCount > 0 && log.tasksCreatedCount > 0;

      if (statusFilter === "success" && !isSuccess) return false;
      if (statusFilter === "failed" && !isFailed) return false;
      if (statusFilter === "partial" && !isPartial) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = log._id.toLowerCase().includes(term);
      const matchUser = log.triggeredBy?.name.toLowerCase().includes(term);
      const matchEmail = log.triggeredBy?.email?.toLowerCase().includes(term);
      if (!matchId && !matchUser && !matchEmail) return false;
    }

    return true;
  });

  const handleOpenDrawer = (log: IAutomationLog) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or trigger user..."
                className="pl-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={runTypeFilter} onValueChange={setRunTypeFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Cron">Scheduled Cron</SelectItem>
                <SelectItem value="Manual">Manual Trigger</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 gap-1.5 text-xs"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Loading automation audit history...
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-2">
            <Server className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">No automation logs recorded</p>
            <p className="text-xs max-w-sm">
              Trigger a manual run or await the midnight BullMQ recurring
              scheduler to view execution logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[190px]">
                    Execution Timestamp
                  </TableHead>
                  <TableHead className="w-[180px]">Trigger Source</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="text-center w-[120px]">
                    Tasks Created
                  </TableHead>
                  <TableHead className="text-center w-[120px]">
                    Tasks Skipped
                  </TableHead>
                  <TableHead className="w-[120px]">Duration</TableHead>
                  <TableHead className="text-right w-[110px]">
                    Diagnostics
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const durationMs =
                    log.completedAt && log.startedAt
                      ? new Date(log.completedAt).getTime() -
                        new Date(log.startedAt).getTime()
                      : 0;

                  const isSuccess = log.errorCount === 0;
                  const isPartial =
                    log.errorCount > 0 && log.tasksCreatedCount > 0;
                  const isFailed =
                    log.errorCount > 0 && log.tasksCreatedCount === 0;

                  return (
                    <TableRow key={log._id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">
                        {log.startedAt
                          ? format(
                              new Date(log.startedAt),
                              "dd MMM yyyy, hh:mm:ss a",
                            )
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {log.runType === "Manual" ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[11px] font-normal"
                            >
                              <User className="mr-1 h-3 w-3" />
                              Manual
                            </Badge>
                            <span className="text-xs text-muted-foreground truncate max-w-[90px]">
                              {log.triggeredBy?.name || "User"}
                            </span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[11px] font-normal"
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Scheduled Cron
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {isSuccess && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-normal gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Success
                          </Badge>
                        )}
                        {isPartial && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-normal gap-1"
                          >
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            Partial ({log.errorCount} err)
                          </Badge>
                        )}
                        {isFailed && (
                          <Badge
                            variant="outline"
                            className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-normal gap-1"
                          >
                            <XCircle className="h-3 w-3 text-rose-500" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {log.tasksCreatedCount}
                        </span>
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {log.tasksSkippedCount}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {durationMs > 0 ? `${durationMs} ms` : "< 1s"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleOpenDrawer(log)}
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages} (
              {pagination.total} total runs)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Diagnostic Drawer */}
      <AutomationDiagnosticDrawer
        log={selectedLog}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
