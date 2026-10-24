"use client";

import { format } from "date-fns";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Loader2,
  X,
} from "lucide-react";

import { useGetStaffAttendanceSummaryQuery } from "@/lib/services/api";
import type { MonthlyMatrixStaffMember, MonthlyMatrixDay } from "@/lib/types/attendance";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

export interface StaffSummaryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: MonthlyMatrixStaffMember | null;
  month: string;
  year: string;
  days?: MonthlyMatrixDay[];
}

export function StaffSummaryDrawer({
  open,
  onOpenChange,
  staff,
  month,
  year,
  days = [],
}: StaffSummaryDrawerProps) {
  const userId = staff?._id ? String(staff._id) : "";

  const { data: summary, isLoading } = useGetStaffAttendanceSummaryQuery(
    { userId, month, year },
    { skip: !open || !userId }
  );

  if (!staff) return null;

  const formatHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6"
      >
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {staff.name.charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-xl font-bold">{staff.name}</SheetTitle>
              <SheetDescription className="text-xs">
                {staff.roleName || "Staff Member"} • {staff.email || staff.username} •{" "}
                <span className="font-semibold text-foreground">
                  {month}/{year}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Calculating staff attendance & payable days...
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* Prorated Joinee Banner */}
            {summary.isProrated && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm">Prorated Attendance Period</div>
                  <p className="opacity-90 leading-relaxed">
                    Employee joined mid-month on <strong>{summary.joiningDate}</strong>. {summary.preJoiningDays} calendar days prior to joining date are excluded from working day targets and payable denominator.
                  </p>
                </div>
              </div>
            )}

            {/* Primary Payroll Highlight: Total Payable Days & Attendance Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <span className="text-xs font-medium text-muted-foreground block">
                    Total Payable Days
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-primary">
                      {summary.payableDays.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {summary.effectiveTotalDays} Effective Days
                      {summary.isProrated && ` (${summary.totalDays} calendar)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Includes Present + Half Days + Paid Leaves + Weekends/Holidays credit.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className="font-bold text-foreground">
                      {summary.attendancePercentage}%
                    </span>
                  </div>
                  <Progress
                    value={summary.attendancePercentage}
                    className="h-2 mt-2 bg-muted"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Working Hours: {formatHours(summary.totalWorkingMinutes)}</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      OT: {formatHours(summary.totalOvertimeMinutes)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metric Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 bg-card">
                <span className="text-xs text-muted-foreground block">Present Days</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {summary.presentDays}
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-card">
                <span className="text-xs text-muted-foreground block">Half Days</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {summary.halfDays} ({summary.halfDays * 0.5} credit)
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-card">
                <span className="text-xs text-muted-foreground block">Paid Leaves</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {summary.paidLeaves}
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-card">
                <span className="text-xs text-muted-foreground block">Absent Days</span>
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {summary.absentDays}
                </span>
              </div>
            </div>

            {/* Non-working days info */}
            <div className="rounded-lg border bg-muted/30 p-3 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground">
                  Weekends & Statutory Holidays:
                </span>{" "}
                <span className="text-muted-foreground">
                  {summary.weekendsCount} Weekends + {summary.officialHolidaysCount} Official Holidays ({summary.holidays} total credited days)
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Credited
              </Badge>
            </div>

            {/* Itemized Daily Breakdown Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold tracking-tight">
                Itemized Daily Activity Log
              </h4>
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold text-xs">Date</TableHead>
                      <TableHead className="font-semibold text-xs">Day</TableHead>
                      <TableHead className="font-semibold text-xs">Status</TableHead>
                      <TableHead className="font-semibold text-xs">In Time</TableHead>
                      <TableHead className="font-semibold text-xs">Out Time</TableHead>
                      <TableHead className="font-semibold text-xs">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {days.map((day) => {
                      const rec = staff.records?.[day.day];
                      let displayStatus = rec?.status || "--";
                      if (rec?.status === "N/A" || rec?.isPreJoining) {
                        displayStatus = "Pre-Joining (N/A)";
                      } else if (day.isHoliday) {
                        displayStatus = "Holiday";
                      } else if (day.isWeekend && !rec?.status) {
                        displayStatus = "Weekend";
                      }

                      return (
                        <TableRow key={day.day} className="text-xs hover:bg-muted/30">
                          <TableCell className="font-mono">{day.date}</TableCell>
                          <TableCell className="text-muted-foreground">{day.dayOfWeek}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                displayStatus.includes("Pre-Joining") || displayStatus === "N/A"
                                  ? "border-dashed border-border/70 text-muted-foreground/60 bg-muted/20 text-[10px]"
                                  : displayStatus === "Present"
                                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10 text-[10px]"
                                  : displayStatus === "Half Day"
                                  ? "border-amber-500/30 text-amber-600 bg-amber-500/10 text-[10px]"
                                  : displayStatus === "Absent"
                                  ? "border-rose-500/30 text-rose-600 bg-rose-500/10 text-[10px]"
                                  : displayStatus === "Holiday"
                                  ? "border-purple-500/30 text-purple-600 bg-purple-500/10 text-[10px]"
                                  : displayStatus === "Weekend"
                                  ? "border-border text-muted-foreground text-[10px]"
                                  : "border-dashed text-muted-foreground text-[10px]"
                              }
                            >
                              {displayStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {rec?.checkIn ? format(new Date(rec.checkIn), "hh:mm a") : "--"}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {rec?.checkOut ? format(new Date(rec.checkOut), "hh:mm a") : "--"}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {rec?.totalMinutes ? formatHours(rec.totalMinutes) : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No attendance summary available for this employee.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
