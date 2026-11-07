"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Coffee,
  Sparkles,
} from "lucide-react";

import {
  useGetTodayAttendanceQuery,
  useGetStaffAttendanceSummaryQuery,
} from "@/lib/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WebPunchModal } from "./WebPunchModal";

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

export function MyAttendanceDesk() {
  const { user } = useAuth();
  const userId = (user as any)?._id || (user as any)?.id || "";

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1)
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(currentDate.getFullYear())
  );
  const [punchModalOpen, setPunchModalOpen] = useState(false);

  // Queries
  const { data: todayAttendance, isLoading: isTodayLoading } = useGetTodayAttendanceQuery();
  const { data: summary, isLoading: isSummaryLoading } = useGetStaffAttendanceSummaryQuery(
    {
      userId,
      month: selectedMonth,
      year: selectedYear,
    },
    { skip: !userId }
  );

  const formatHours = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const formatTime = (timeStr?: string | Date | null) => {
    if (!timeStr) return "--:--";
    return format(new Date(timeStr), "hh:mm a");
  };

  const status = todayAttendance?.status || "Unmarked";
  const hasCheckedIn = Boolean(todayAttendance?.checkIn);
  const hasCheckedOut = Boolean(todayAttendance?.checkOut);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span>My Attendance Desk</span>
            <Badge variant="outline" className="text-xs font-normal">
              {user?.name || "Staff Member"}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your daily punch records, active work duration, and monthly attendance history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-xs gap-1.5"
            variant={hasCheckedIn && !hasCheckedOut ? "destructive" : "default"}
            onClick={() => setPunchModalOpen(true)}
          >
            {hasCheckedIn && !hasCheckedOut ? (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>Clock Out</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span>Clock In / Punch</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Today's Punch Snapshot Card */}
      <Card className="rounded-xl border shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight">
                  Today&apos;s Presence & Punch Log
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(new Date(), "EEEE, dd MMMM yyyy")}
                </CardDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-medium self-start sm:self-auto ${
                status === "Present"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : status === "Half Day"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : status === "Leave" || status === "Paid Leave"
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : status === "Absent"
                        ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                        : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
              }`}
            >
              {hasCheckedIn && !hasCheckedOut ? "Clocked In (Active)" : status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">
                Punch In
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-1 block">
                {formatTime(todayAttendance?.checkIn)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">
                Punch Out
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-1 block">
                {todayAttendance?.checkOut ? (
                  formatTime(todayAttendance.checkOut)
                ) : hasCheckedIn ? (
                  <span className="text-emerald-600 dark:text-emerald-400">In Session</span>
                ) : (
                  "--:--"
                )}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">
                Duration Today
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-1 block">
                {formatHours(todayAttendance?.totalMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium block">
                Overtime
              </span>
              <span className="text-sm font-bold font-mono text-foreground mt-1 block">
                {formatHours(todayAttendance?.overtimeMinutes)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Monthly Attendance History
            </h2>
            <p className="text-xs text-muted-foreground">
              Review your monthly payable days, leaves, and daily breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36 bg-card text-xs h-9">
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={name} value={String(i + 1)} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28 bg-card text-xs h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(
                  (y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs">
                      {y}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Monthly Metrics Ribbon */}
        {isSummaryLoading ? (
          <div className="flex h-24 items-center justify-center rounded-xl border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Days Present
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {summary?.presentDays ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Half Days
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                {summary?.halfDays ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Leaves Taken
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                {(summary?.paidLeaves ?? 0) + (summary?.unpaidLeaves ?? 0)}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Holidays / Off
              </span>
              <span className="text-lg font-bold text-muted-foreground mt-0.5 block">
                {(summary?.holidays ?? 0) + (summary?.weekendsCount ?? 0)}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Payable Days
              </span>
              <span className="text-lg font-bold text-primary mt-0.5 block">
                {summary?.payableDays ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                Total Hours
              </span>
              <span className="text-lg font-bold font-mono text-foreground mt-0.5 block">
                {formatHours(summary?.totalWorkingMinutes)}
              </span>
            </div>
          </div>
        )}

        {/* Day-by-Day Table */}
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-muted/20">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day-by-Day Punch Logs ({MONTH_NAMES[Number(selectedMonth) - 1]} {selectedYear})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-24">Day</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-28">Check In</TableHead>
                  <TableHead className="w-28">Check Out</TableHead>
                  <TableHead className="w-28">Working Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSummaryLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : !summary?.records || summary.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      No attendance logs recorded for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.records.map((rec) => {
                    const dateObj = new Date(rec.date);
                    return (
                      <TableRow key={rec.date} className="text-xs hover:bg-muted/30">
                        <TableCell className="font-mono font-medium">
                          {format(dateObj, "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(dateObj, "EEE")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-medium ${
                              rec.status === "Present"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : rec.status === "Half Day"
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : rec.status === "Leave" || rec.status === "Paid Leave"
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : rec.status === "Holiday"
                                      ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                      : rec.status === "Absent"
                                        ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                                        : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {rec.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatTime(rec.checkIn)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatTime(rec.checkOut)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatHours(rec.totalMinutes)}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {rec.notes || "--"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <WebPunchModal
        open={punchModalOpen}
        onOpenChange={setPunchModalOpen}
      />
    </div>
  );
}
