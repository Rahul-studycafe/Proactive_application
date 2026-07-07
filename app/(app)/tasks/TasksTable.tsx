"use client";

import { useState, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Task, type TaskPriority, type TaskStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Circle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface TasksTableProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  visibleColumns: string[];
}

const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case "Urgent":
      return "bg-red-50 text-red-700 border-red-200";
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Medium":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Low":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getStatusBadge = (status: TaskStatus) => {
  switch (status) {
    case "Pending":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Under Review":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "On Hold":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

type SortField =
  | "assignee"
  | "title"
  | "client"
  | "priority"
  | "status"
  | "dueDate";
export function TasksTable({
  tasks,
  onTaskClick,
  visibleColumns,
}: TasksTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortDir(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedTasks = useMemo(() => {
    if (!sortField || !sortDir) return tasks;
    return [...tasks].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      switch (sortField) {
        case "assignee":
          valA = a.assigneeIds?.[0]?.name || "";
          valB = b.assigneeIds?.[0]?.name || "";
          break;
        case "title":
          valA = (a as any).title || a.serviceId?.name || "";
          valB = (b as any).title || b.serviceId?.name || "";
          break;
        case "client":
          valA = a.clientId?.name || "";
          valB = b.clientId?.name || "";
          break;
        case "priority": {
          const pOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          valA = pOrder[a.priority as keyof typeof pOrder] || 0;
          valB = pOrder[b.priority as keyof typeof pOrder] || 0;
          break;
        }
        case "status":
          valA = a.status || "";
          valB = b.status || "";
          break;
        case "dueDate":
          valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortDir]);

  const renderSortableHeader = (
    label: string,
    field: SortField,
    className?: string,
  ) => {
    const isActive = sortField === field;
    return (
      <TableHead
        className={`cursor-pointer select-none transition-colors border-r last:border-r-0 border-slate-200 hover:bg-slate-100/70 hover:text-slate-800 ${isActive ? "bg-slate-100/80 text-slate-900 font-semibold" : ""} ${className || ""}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1 justify-between">
          {label}
          {sortField === field && sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-slate-600" />
          ) : sortField === field && sortDir === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-slate-600" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </div>
      </TableHead>
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/50 text-sm text-slate-400">
        No tasks found matching your criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              {visibleColumns.includes("assignee") &&
                renderSortableHeader("Assignee", "assignee")}
              {visibleColumns.includes("title") &&
                renderSortableHeader("Title", "title", "w-[300px]")}
              {visibleColumns.includes("client") &&
                renderSortableHeader("Client", "client")}
              {visibleColumns.includes("priority") &&
                renderSortableHeader("Priority", "priority")}
              {visibleColumns.includes("status") &&
                renderSortableHeader("Status", "status")}
              {visibleColumns.includes("dueDate") &&
                renderSortableHeader("Due Date", "dueDate")}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow
                key={task._id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => onTaskClick?.(task)}
              >
                {visibleColumns.includes("assignee") && (
                  <TableCell>
                    {task.assigneeIds && task.assigneeIds.length > 0 ? (
                      <div className="flex items-center gap-1 pl-4">
                        {task.assigneeIds.map((assignee, idx) => (
                          <div
                            key={assignee._id}
                            className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
                            title={assignee.name}
                            style={{ marginLeft: idx > 0 ? "-0.5rem" : "0" }}
                          >
                            {assignee.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.includes("title") && (
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {(task as any).title ||
                      task.serviceId?.name ||
                      "Unnamed Task"}
                  </TableCell>
                )}
                {visibleColumns.includes("client") && (
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Circle className="h-3 w-3" />
                      <span className="truncate">
                        {task.clientId?.name || "No Client"}
                      </span>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes("priority") && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium text-[10px] uppercase tracking-wider ${getPriorityBadge(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes("status") && (
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium text-[10px] tracking-wider ${getStatusBadge(task.status)}`}
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes("dueDate") && (
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No date
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
