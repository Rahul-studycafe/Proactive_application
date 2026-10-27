"use client";

import { useMemo } from "react";
import {
  Calendar,
  X,
  User,
  Layers,
  Building2,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetClientsQuery,
  useGetServicesQuery,
  useGetUsersQuery,
} from "@/lib/services/api";

export type DatePreset =
  | "all"
  | "today"
  | "this-week"
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "this-fy";

export interface ReportFilterValues {
  datePreset?: DatePreset;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  serviceId?: string;
  assignedUserId?: string;
  status?: string;
  priority?: string;
}

interface ReportFilterBarProps {
  filters: ReportFilterValues;
  onChange: (updated: ReportFilterValues) => void;
  onReset?: () => void;
  showClientFilter?: boolean;
  showServiceFilter?: boolean;
  showUserFilter?: boolean;
  showStatusFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
  className?: string;
}

export function ReportFilterBar({
  filters,
  onChange,
  onReset,
  showClientFilter = false,
  showServiceFilter = false,
  showUserFilter = false,
  showStatusFilter = false,
  statusOptions = [],
  className = "",
}: ReportFilterBarProps) {
  // Queries for dynamic dropdowns
  const { data: clientsData } = useGetClientsQuery(
    { limit: 200 },
    { skip: !showClientFilter }
  );
  const clients = clientsData?.clients || [];

  const { data: servicesResponse } = useGetServicesQuery(undefined, {
    skip: !showServiceFilter,
  });
  const services: any[] = Array.isArray(servicesResponse)
    ? servicesResponse
    : (servicesResponse as any)?.data || (servicesResponse as any)?.services || [];

  const { data: usersData } = useGetUsersQuery(undefined, {
    skip: !showUserFilter,
  });
  const users: any[] = Array.isArray(usersData)
    ? usersData
    : (usersData as any)?.users || [];

  const handlePresetChange = (preset: DatePreset) => {
    if (preset === "all") {
      onChange({
        ...filters,
        datePreset: "all",
        startDate: "",
        endDate: "",
      });
      return;
    }

    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === "today") {
      // Start of today, end of today
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === "this-week") {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (preset === "this-month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === "last-month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === "this-quarter") {
      // Indian Financial Quarters: Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
      const currentMonth = now.getMonth(); // 0-indexed
      let qStartMonth = 3; // Apr
      if (currentMonth >= 3 && currentMonth <= 5) qStartMonth = 3;
      else if (currentMonth >= 6 && currentMonth <= 8) qStartMonth = 6;
      else if (currentMonth >= 9 && currentMonth <= 11) qStartMonth = 9;
      else qStartMonth = 0; // Jan

      start = new Date(now.getFullYear(), qStartMonth, 1);
      end = new Date(now.getFullYear(), qStartMonth + 3, 0);
    } else if (preset === "this-fy") {
      // Apr 1 of current FY to Mar 31 of next year
      const curYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? curYear : curYear - 1;
      start = new Date(fyStartYear, 3, 1);
      end = new Date(fyStartYear + 1, 2, 31);
    }

    onChange({
      ...filters,
      datePreset: preset,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filters.datePreset && filters.datePreset !== "all") ||
        filters.startDate ||
        filters.endDate ||
        (filters.clientId && filters.clientId !== "all") ||
        (filters.serviceId && filters.serviceId !== "all") ||
        (filters.assignedUserId && filters.assignedUserId !== "all") ||
        (filters.status && filters.status !== "all") ||
        (filters.priority && filters.priority !== "all")
    );
  }, [filters]);

  const handleClearAll = () => {
    if (onReset) {
      onReset();
    } else {
      onChange({
        datePreset: "all",
        startDate: "",
        endDate: "",
        clientId: undefined,
        serviceId: undefined,
        assignedUserId: undefined,
        status: undefined,
        priority: undefined,
      });
    }
  };

  return (
    <div
      className={`rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter Query Bar
          </span>
        </div>

        {/* Date Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            type="button"
            variant={filters.datePreset === "all" || !filters.datePreset ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetChange("all")}
            className="h-7 px-2.5 text-xs"
          >
            All Time
          </Button>
          <Button
            type="button"
            variant={filters.datePreset === "this-month" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetChange("this-month")}
            className="h-7 px-2.5 text-xs"
          >
            This Month
          </Button>
          <Button
            type="button"
            variant={filters.datePreset === "last-month" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetChange("last-month")}
            className="h-7 px-2.5 text-xs"
          >
            Last Month
          </Button>
          <Button
            type="button"
            variant={filters.datePreset === "this-quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetChange("this-quarter")}
            className="h-7 px-2.5 text-xs"
          >
            This Quarter
          </Button>
          <Button
            type="button"
            variant={filters.datePreset === "this-fy" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetChange("this-fy")}
            className="h-7 px-2.5 text-xs"
          >
            This FY
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Start Date */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">From Date</Label>
          <Input
            type="date"
            className="h-8 text-xs font-mono"
            value={filters.startDate || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                datePreset: undefined,
                startDate: e.target.value,
              })
            }
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">To Date</Label>
          <Input
            type="date"
            className="h-8 text-xs font-mono"
            value={filters.endDate || ""}
            onChange={(e) =>
              onChange({
                ...filters,
                datePreset: undefined,
                endDate: e.target.value,
              })
            }
          />
        </div>

        {/* Client Filter */}
        {showClientFilter && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Client</Label>
            <Select
              value={filters.clientId || "all"}
              onValueChange={(val) =>
                onChange({ ...filters, clientId: val === "all" ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Service Filter */}
        {showServiceFilter && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Service</Label>
            <Select
              value={filters.serviceId || "all"}
              onValueChange={(val) =>
                onChange({ ...filters, serviceId: val === "all" ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="all">All Services</SelectItem>
                {services.map((s: any) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Assignee / User Filter */}
        {showUserFilter && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Staff Assignee</Label>
            <Select
              value={filters.assignedUserId || "all"}
              onValueChange={(val) =>
                onChange({
                  ...filters,
                  assignedUserId: val === "all" ? undefined : val,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="all">All Staff</SelectItem>
                {users.map((u: any) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(val) =>
                onChange({ ...filters, status: val === "all" ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Reset Action Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs text-muted-foreground hover:text-foreground w-full gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
