"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Download,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

import { useGetMonthlyMatrixQuery } from "@/lib/services/api";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import type {
  MonthlyMatrixStaffMember,
  MonthlyMatrixDay,
  DailyRosterMember,
} from "@/lib/types/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatrixCell } from "./MatrixCell";
import { StaffSummaryDrawer } from "./StaffSummaryDrawer";
import { MarkAttendanceModal } from "./MarkAttendanceModal";
import { ExportAttendanceButton } from "./ExportAttendanceButton";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthlyMatrixGrid() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(currentDate.getFullYear())
  );
  const [search, setSearch] = useState("");

  const { can } = usePermissions();
  const { user } = useAuth();
  const canManage = can("attendance.manage");
  const isSelfOnly = !can("attendance.view_all") && can("attendance.view_self");

  // Selection states for Modals & Drawer
  const [selectedStaffForSummary, setSelectedStaffForSummary] =
    useState<MonthlyMatrixStaffMember | null>(null);
  const [editTarget, setEditTarget] = useState<{
    member: DailyRosterMember;
    date: string;
  } | null>(null);

  // RTK Query: fetch monthly matrix
  const { data: matrixResult, isLoading, isFetching } = useGetMonthlyMatrixQuery({
    month: selectedMonth,
    year: selectedYear,
  });

  const rawStaffList = matrixResult?.staff || [];

  // If role is self-only (Phase F-59), filter strictly to the logged-in user
  const visibleStaffList = isSelfOnly && user
    ? rawStaffList.filter(
        (s) =>
          s._id === (user as any).id ||
          s._id === (user as any)._id ||
          s.email === user.email ||
          s.username === user.email
      )
    : rawStaffList;

  // Filter staff by search query
  const filteredStaff = visibleStaffList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.roleName && s.roleName.toLowerCase().includes(q))
    );
  });

  const days: MonthlyMatrixDay[] = matrixResult?.days || [];

  const handleCellClick = (
    staff: MonthlyMatrixStaffMember,
    day: MonthlyMatrixDay
  ) => {
    if (!canManage) return;

    // Adapt to DailyRosterMember interface for MarkAttendanceModal
    const rec = staff.records?.[day.day] || null;
    const member: DailyRosterMember = {
      _id: staff._id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      roleId: staff.roleId,
      roleName: staff.roleName,
      departmentId: staff.departmentId,
      departmentName: staff.departmentName,
      attendance: rec,
    };

    setEditTarget({
      member,
      date: day.date,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 bg-card text-xs h-9">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, idx) => (
                <SelectItem key={name} value={String(idx + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Selector */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28 bg-card text-xs h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search Box */}
          <div className="relative w-48 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        {/* Export Button (Phase F-60) */}
        <div className="flex items-center gap-2">
          <ExportAttendanceButton
            month={selectedMonth}
            year={selectedYear}
            variant="outline"
          />
        </div>
      </div>

      {/* Main Horizontal Scroll Table Matrix */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-x-auto max-h-[70vh]">
          <table className="w-full text-xs border-collapse">
            {/* Header */}
            <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-sm border-b">
              <tr>
                {/* Fixed Sticky Left Column: Employee */}
                <th className="sticky left-0 z-30 bg-muted px-4 py-3 text-left font-semibold text-muted-foreground min-w-[200px] border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Employee ({filteredStaff.length})
                </th>

                {/* Day Columns (1 to 28/29/30/31) */}
                {days.map((day) => {
                  const isWeekend = day.isWeekend;
                  const isHoliday = day.isHoliday;
                  return (
                    <th
                      key={day.day}
                      className={`px-1.5 py-2 text-center min-w-[38px] border-r font-medium ${
                        isHoliday
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                          : isWeekend
                          ? "bg-muted/80 text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      <div className="font-bold text-xs">{day.day}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {day.dayOfWeek.slice(0, 2)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Matrix Rows */}
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      Loading monthly attendance matrix...
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="h-48 text-center text-muted-foreground text-sm"
                  >
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff._id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Sticky Left Column: Staff Profile */}
                    <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/30 px-4 py-2.5 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <Link
                        href={`/attendance/matrix/${staff._id}?month=${selectedMonth}&year=${selectedYear}`}
                        className="flex items-center gap-2.5 text-left w-full hover:underline focus:outline-none group/staff"
                        title="Click to view staff attendance summary page"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs group-hover/staff:bg-primary group-hover/staff:text-primary-foreground transition-colors">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="truncate max-w-[140px]">
                          <div className="font-semibold text-xs text-foreground truncate group-hover/staff:text-primary transition-colors">
                            {staff.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {staff.roleName || "Staff"}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* Day Cells */}
                    {days.map((day) => {
                      const rec = staff.records?.[day.day] || null;
                      return (
                        <td
                          key={day.day}
                          className={`p-1 text-center border-r ${
                            day.isHoliday
                              ? "bg-purple-500/5"
                              : day.isWeekend
                              ? "bg-muted/20"
                              : ""
                          }`}
                        >
                          <MatrixCell
                            dayInfo={day}
                            record={rec}
                            employeeName={staff.name}
                            canEdit={canManage}
                            onClick={() => handleCellClick(staff, day)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 p-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-foreground">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-bold text-center leading-3 text-emerald-700">P</span>
              Present
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-bold text-center leading-3 text-amber-700">HD</span>
              Half Day
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-blue-500/20 border border-blue-500/40 text-[9px] font-bold text-center leading-3 text-blue-700">PL</span>
              Paid Leave
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-rose-500/20 border border-rose-500/40 text-[9px] font-bold text-center leading-3 text-rose-700">A</span>
              Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-purple-500/20 border border-purple-500/40 text-[9px] font-bold text-center leading-3 text-purple-700">H</span>
              Holiday
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded bg-muted border text-[9px] font-bold text-center leading-3">W</span>
              Weekend
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3.5 w-3.5 rounded border border-dashed text-[9px] text-center leading-3">--</span>
              Unmarked
            </span>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Tip: Click employee name for monthly payroll audit drawer. Click cell to adjust.
          </div>
        </div>
      </div>

      {/* Staff Payroll & Payable Days Summary Drawer (Phase F-58) */}
      <StaffSummaryDrawer
        open={Boolean(selectedStaffForSummary)}
        onOpenChange={(open) => !open && setSelectedStaffForSummary(null)}
        staff={selectedStaffForSummary}
        month={selectedMonth}
        year={selectedYear}
        days={days}
      />

      {/* Manual Mark / Adjust Modal (Phase F-55) */}
      {editTarget && (
        <MarkAttendanceModal
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
          member={editTarget.member}
          targetDate={editTarget.date}
        />
      )}
    </div>
  );
}
