"use client";

import { useMemo, useState } from "react";
import { Clock, Circle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreateTaskDialog } from "./CreateTaskDialog";
import {
  useGetTasksQuery,
  useUpdateTaskStatusMutation,
} from "@/lib/services/api";
import { type Task, type TaskStatus, type TaskPriority } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { TaskToolbar } from "./TaskToolbar";
import { TasksTable } from "./TasksTable";

const COLUMNS: TaskStatus[] = [
  "Pending",
  "In Progress",
  "Under Review",
  "On Hold",
  "Completed",
];

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "Urgent":
      return "bg-destructive";
    case "High":
      return "bg-warning";
    case "Medium":
      return "bg-primary";
    case "Low":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground";
  }
};

const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case "Urgent":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "High":
      return "bg-warning/15 text-warning-foreground border-warning/30";
    case "Medium":
      return "bg-primary/15 text-primary border-primary/30";
    case "Low":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getColumnDot = (status: TaskStatus) => {
  switch (status) {
    case "Pending":
      return "bg-muted-foreground";
    case "In Progress":
      return "bg-primary";
    case "Under Review":
      return "bg-purple-500";
    case "On Hold":
      return "bg-warning";
    case "Completed":
      return "bg-success";
    default:
      return "bg-muted-foreground";
  }
};

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dueFilter, setDueFilter] = useState<"all" | "today" | "overdue">(
    "all",
  );
  const [filterClient, setFilterClient] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<TaskStatus[]>([
    "Pending",
    "In Progress",
    "On Hold",
    "Completed",
  ]);
  const [tableVisibleColumns, setTableVisibleColumns] = useState<string[]>([
    "assignee",
    "title",
    "client",
    "priority",
    "status",
    "dueDate",
  ]);

  const { data: tasksRes, isLoading } = useGetTasksQuery({
    limit: 20,
    page,
    dueStatus: dueFilter === "all" ? undefined : dueFilter,
    search: search || undefined,
    clientId: filterClient.length === 0 ? undefined : filterClient.join(","),
    sortBy,
    sortOrder,
  });
  const [updateStatus] = useUpdateTaskStatusMutation();
  const router = useRouter();

  const tasks: Task[] = tasksRes?.tasks || [];

  const grouped = useMemo(() => {
    return COLUMNS.reduce(
      (acc, col) => {
        acc[col] = tasks.filter((t) => t.status === col);
        return acc;
      },
      {} as Record<TaskStatus, Task[]>,
    );
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    try {
      await updateStatus({ id: taskId, status: newStatus }).unwrap();
      toast.success("Task status updated");
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to update status");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Tabs value={dueFilter} onValueChange={(v) => setDueFilter(v as any)}>
            <TabsList className="grid w-[300px] grid-cols-3">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="today">Due Today</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3">
          <CreateTaskDialog />
        </div>
      </div>

      <TaskToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        allColumns={COLUMNS}
        filterClient={filterClient}
        setFilterClient={setFilterClient}
        tableVisibleColumns={tableVisibleColumns}
        setTableVisibleColumns={setTableVisibleColumns}
      />

      {viewMode === "table" ? (
        <TasksTable
          tasks={tasks}
          onTaskClick={(task) => router.push(`/tasks/${task._id}`)}
          visibleColumns={tableVisibleColumns as any}
        />
      ) : (
        <div className="flex overflow-x-auto gap-5 pb-4 snap-x">
          {COLUMNS.filter((c) => visibleColumns.includes(c)).map((col) => (
            <div
              key={col}
              className="rounded-xl border border-border bg-card/50 p-4 flex flex-col min-h-[500px] min-w-[200px] w-full max-w-[280px] flex-shrink-0 snap-start shadow-xs"
              onDrop={(e) => handleDrop(e, col)}
              onDragOver={handleDragOver}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${getColumnDot(col)}`}
                  />
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {col}
                  </h3>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                  {grouped[col].length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {grouped[col].length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                    Drop tasks here
                  </div>
                ) : (
                  grouped[col].map((t) => (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t._id)}
                      onClick={() => router.push(`/tasks/${t._id}`)}
                      className="group relative w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card p-4 text-left shadow-xs transition-all hover:shadow-md hover:border-primary/40"
                    >
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${getPriorityColor(t.priority)}`}
                      />

                      <div className="mb-2.5 pl-1.5 flex items-start justify-between gap-2">
                        <span className="font-medium text-sm text-foreground leading-snug line-clamp-2">
                          {(t as any).title ||
                            t.serviceId?.name ||
                            "Unnamed Task"}
                        </span>
                      </div>

                      <div className="pl-1.5 mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Circle className="h-3 w-3" />
                        <span className="truncate">
                          {t.clientId?.name || "No Client"}
                        </span>
                      </div>

                      <div className="pl-1.5 flex flex-wrap items-center justify-between mt-auto gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 font-medium text-[10px] uppercase tracking-wider ${getPriorityBadge(t.priority)}`}
                          >
                            {t.priority}
                          </Badge>
                          {t.dueDate && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border shadow-xs">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatDate(t.dueDate)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          {t.assigneeIds && t.assigneeIds.length > 0 ? (
                            t.assigneeIds.map((assignee, idx) => (
                              <div
                                key={assignee._id}
                                className="h-6 w-6 rounded-full bg-primary/20 text-primary border border-border flex items-center justify-center text-[10px] font-medium shadow-xs ring-1 ring-card"
                                title={assignee.name}
                                style={{
                                  marginLeft: idx > 0 ? "-0.5rem" : "0",
                                }}
                              >
                                {assignee.name?.charAt(0).toUpperCase()}
                              </div>
                            ))
                          ) : (
                            <div
                              className="h-6 w-6 rounded-full bg-muted text-muted-foreground border border-border flex items-center justify-center text-[10px] font-medium shadow-xs ring-1 ring-card"
                              title="Unassigned"
                            >
                              ?
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tasksRes?.pagination && tasksRes.pagination.pages > 1 && (
        <Pagination className="mt-6 mb-2 border-t pt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage((p) => p - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem className="px-4 text-sm font-medium text-muted-foreground">
              Page {page} of {tasksRes.pagination.pages}
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < tasksRes.pagination.pages) setPage((p) => p + 1);
                }}
                className={
                  page === tasksRes.pagination.pages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, string> = {
    Urgent: "bg-destructive/10 text-destructive border-destructive/20",
    High: "bg-warning/15 text-warning-foreground border-warning/30",
    Medium: "bg-primary/10 text-primary border-primary/20",
    Low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`${map[priority]} text-[10px]`}>
      {priority}
    </Badge>
  );
}
