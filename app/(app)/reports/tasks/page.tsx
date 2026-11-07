"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  User,
  Building2,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useGetTasksReportQuery } from "@/lib/services/api";
import {
  ReportLayout,
  ReportFilterBar,
  ExcelExportButton,
  type ReportFilterValues,
} from "@/components/reports";
import { withPermission } from "@/components/shared/withPermission";

function TasksReportPage() {
  const [filters, setFilters] = useState<ReportFilterValues>({
    datePreset: "this-month",
  });
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryParams = useMemo(() => {
    return {
      clientId: filters.clientId,
      serviceId: filters.serviceId,
      assignedUserId: filters.assignedUserId,
      status: filters.status,
      priority: filters.priority,
      startDate: filters.startDate,
      endDate: filters.endDate,
      page,
      limit,
    };
  }, [filters, page]);

  const { data, isLoading, isFetching, refetch } =
    useGetTasksReportQuery(queryParams);

  const summary = data?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTimeLogged: 0,
    completionVelocity: 0,
  };

  const tasks = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const statusOptions = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Review", value: "Review" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" },
  ];

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === "Completed" || status === "Cancelled")
      return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <ReportLayout
      title="Task Velocity & Operations Report"
      subtitle="Detailed operational audit tracking staff throughput, bottleneck analysis, billable time logs, and statutory deadlines."
      activeCategory="Operational"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <ExcelExportButton
            reportType="tasks"
            queryParams={queryParams}
            fileName={`tasks-report-${new Date().toISOString().split("T")[0]}.xlsx`}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Tasks */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Tasks
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {summary.totalTasks}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                In filtered period
              </p>
            </CardContent>
          </Card>

          {/* Completion Velocity */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Velocity Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {summary.completionVelocity}%
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({summary.completedTasks} closed)
                </span>
              </div>
              <Progress
                value={summary.completionVelocity}
                className="h-1.5 mt-2 bg-emerald-500/20"
              />
            </CardContent>
          </Card>

          {/* Overdue Bottlenecks */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Overdue Bottlenecks
              </span>
              <h3
                className={`text-2xl font-bold tracking-tight mt-1 ${
                  summary.overdueTasks > 0
                    ? "text-destructive"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {summary.overdueTasks}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Past filing / due date
              </p>
            </CardContent>
          </Card>

          {/* Time Logged */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time Logged
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground font-mono mt-1">
                {Math.round((summary.totalTimeLogged / 60) * 10) / 10} hrs
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {summary.totalTimeLogged} mins total
              </p>
            </CardContent>
          </Card>

          {/* Completed Ratio */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Completed
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mt-1">
                {summary.completedTasks}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Archived & verified
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <ReportFilterBar
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          showClientFilter
          showServiceFilter
          showUserFilter
          showStatusFilter
          statusOptions={statusOptions}
        />

        {/* Operational Tasks Table */}
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-[28%] min-w-[200px]">
                    Task & Client
                  </TableHead>
                  <TableHead className="w-[18%] min-w-[140px]">
                    Service
                  </TableHead>
                  <TableHead className="w-[16%] min-w-[130px]">
                    Assignees
                  </TableHead>
                  <TableHead className="w-[12%] min-w-[100px]">
                    Due Date
                  </TableHead>
                  <TableHead className="w-[8%] min-w-[80px]">
                    Priority
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[90px] text-right">
                    Billable
                  </TableHead>
                  <TableHead className="w-[8%] min-w-[80px] text-center">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                        <CheckSquare className="h-8 w-8 text-muted-foreground/60" />
                        <h4 className="font-semibold text-foreground">
                          No Tasks Match Filters
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Try adjusting your date range, status, or staff
                          assignee filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    const clientObj = Array.isArray(task.client)
                      ? task.client[0]
                      : task.client;
                    const serviceObj = Array.isArray(task.service)
                      ? task.service[0]
                      : task.service;

                    return (
                      <TableRow
                        key={task._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* Task & Client */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {clientObj?.name || "Client Name"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Client No:{" "}
                              {clientObj?.clientNumber ||
                                clientObj?.fileNo ||
                                "—"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Service */}
                        <TableCell>
                          <span className="font-medium text-foreground">
                            {serviceObj?.name || "Standard Service"}
                          </span>
                        </TableCell>

                        {/* Assignees */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {task.assignees && task.assignees.length > 0 ? (
                              task.assignees.map((u) => (
                                <Badge
                                  key={u._id}
                                  variant="outline"
                                  className="text-[10px] font-normal py-0 h-5"
                                >
                                  {u.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Due Date */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span
                              className={`font-mono ${
                                overdue
                                  ? "text-destructive font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatDate(task.dueDate)}
                            </span>
                            {overdue && (
                              <span className="text-[10px] text-destructive font-medium flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Overdue
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold ${
                              task.priority === "Urgent" ||
                              task.priority === "High"
                                ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                : task.priority === "Medium"
                                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                            }`}
                          >
                            {task.priority || "Medium"}
                          </Badge>
                        </TableCell>

                        {/* Billable Amount */}
                        <TableCell className="text-right font-mono">
                          {task.billableAmount ? (
                            <div>
                              <span className="font-semibold text-foreground">
                                ₹{task.billableAmount.toLocaleString("en-IN")}
                              </span>
                              {task.isBilled && (
                                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400">
                                  Billed
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${
                              task.status === "Completed"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : task.status === "In Progress"
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                            }`}
                          >
                            {task.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 border-t border-border/80 text-xs text-muted-foreground">
              <div>
                Showing page{" "}
                <span className="font-semibold text-foreground">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {pagination.totalPages}
                </span>{" "}
                ({pagination.total} total tasks)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ReportLayout>
  );
}

export default withPermission(TasksReportPage, "report:view", {
  title: "Reports Access Restricted",
  description:
    "You do not have permission to view analytical practice reports. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
