"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  List,
  Kanban,
  Filter,
  ArrowUpDown,
  Columns,
  Building2,
  Settings2,
} from "lucide-react";
import { type TaskStatus, type TaskPriority } from "@/lib/types";
import { useGetClientsQuery } from "@/lib/services/api";

export interface TaskToolbarProps {
  viewMode: "kanban" | "table";
  setViewMode: (mode: "kanban" | "table") => void;
  search: string;
  setSearch: (search: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  visibleColumns?: TaskStatus[];
  setVisibleColumns?: (cols: TaskStatus[]) => void;
  allColumns?: TaskStatus[];
  filterClient?: string[];
  setFilterClient?: (clientIds: string[]) => void;
  tableVisibleColumns?: string[];
  setTableVisibleColumns?: (cols: string[]) => void;
}

export function TaskToolbar({
  viewMode,
  setViewMode,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  visibleColumns,
  setVisibleColumns,
  allColumns,
  filterClient,
  setFilterClient,
  tableVisibleColumns,
  setTableVisibleColumns,
}: TaskToolbarProps) {
  // debounced search state
  const [localSearch, setLocalSearch] = useState(search);
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedClientSearch(clientSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [clientSearch]);

  const { data: clientsRes } = useGetClientsQuery({
    limit: 5,
    search: debouncedClientSearch || undefined,
  });
  const clients = clientsRes?.clients || [];

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between border-b border-border/40 pb-4 mb-4">
      <div className="flex items-center gap-2 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-8 bg-card h-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 whitespace-nowrap bg-card"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Client Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[350px] overflow-y-auto w-64"
          >
            <div className="p-2 border-b mb-1">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            </div>
            <DropdownMenuItem
              className="flex items-center gap-3 px-2 py-2 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setFilterClient?.([]);
              }}
            >
              <Checkbox
                checked={!filterClient || filterClient.length === 0}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium text-foreground">
                All Clients
              </span>
            </DropdownMenuItem>

            {clients.map((client: any) => (
              <DropdownMenuItem
                key={client._id}
                className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  if (!filterClient) return;
                  if (filterClient.includes(client._id)) {
                    setFilterClient?.(
                      filterClient.filter((id) => id !== client._id),
                    );
                  } else {
                    setFilterClient?.([...filterClient, client._id]);
                  }
                }}
              >
                <Checkbox
                  checked={filterClient?.includes(client._id) || false}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-foreground">
                  {client.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {viewMode === "table" &&
          tableVisibleColumns &&
          setTableVisibleColumns && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 whitespace-nowrap bg-card"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-2">
                {[
                  "assignee",
                  "title",
                  "client",
                  "priority",
                  "status",
                  "dueDate",
                ].map((col) => (
                  <DropdownMenuItem
                    key={col}
                    className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      const isChecked = tableVisibleColumns.includes(col);
                      if (!isChecked) {
                        setTableVisibleColumns([...tableVisibleColumns, col]);
                      } else {
                        if (tableVisibleColumns.length > 1) {
                          setTableVisibleColumns(
                            tableVisibleColumns.filter((c) => c !== col),
                          );
                        }
                      }
                    }}
                  >
                    <Checkbox
                      checked={tableVisibleColumns.includes(col)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-foreground capitalize">
                      {col.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        {viewMode === "kanban" &&
          visibleColumns &&
          setVisibleColumns &&
          allColumns && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 whitespace-nowrap bg-card"
                >
                  <Settings2 className=" h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-2">
                <DropdownMenuItem
                  className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    const isChecked =
                      visibleColumns.length === allColumns.length;
                    if (!isChecked) {
                      setVisibleColumns([...allColumns]);
                    }
                  }}
                >
                  <Checkbox
                    checked={visibleColumns.length === allColumns.length}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-foreground">
                    All Columns
                  </span>
                </DropdownMenuItem>
                {allColumns.map((col) => (
                  <DropdownMenuItem
                    key={col}
                    className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      const isChecked = visibleColumns.includes(col);
                      if (!isChecked) {
                        setVisibleColumns([...visibleColumns, col]);
                      } else {
                        if (visibleColumns.length > 1) {
                          setVisibleColumns(
                            visibleColumns.filter((c) => c !== col),
                          );
                        }
                      }
                    }}
                  >
                    <Checkbox
                      checked={visibleColumns.includes(col)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {col}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

        <div className="flex items-center rounded-md border bg-card p-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5"
            onClick={() => setViewMode("kanban")}
          >
            <Kanban className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
