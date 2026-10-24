"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wifi,
  MapPin,
  CheckCircle,
  CalendarDays,
  User,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";

import {
  useGetStaffAttendanceSummaryQuery,
  useGetMonthlyMatrixQuery,
} from "@/lib/services/api";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BackButton } from "@/components/shared/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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

export interface StaffSummaryPageViewProps {
  userId: string;
}

export function StaffSummaryPageView({ userId }: StaffSummaryPageViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentDate = new Date();

  const initialMonth = searchParams.get("month") || String(currentDate.getMonth() + 1);
  const initialYear = searchParams.get("year") || String(currentDate.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);

  // RTK Query: fetch staff summary
  const { data: summary, isLoading: isSummaryLoading, isFetching: isSummaryFetching } =
    useGetStaffAttendanceSummaryQuery({
      userId,
      month: selectedMonth,
      year: selectedYear,
    });

  // RTK Query: fetch monthly matrix to get calendar days & itemized record notes/punches
  const { data: matrixResult, isLoading: isMatrixLoading } =
    useGetMonthlyMatrixQuery({
      month: selectedMonth,
      year: selectedYear,
    });

  const staffMember = matrixResult?.staff?.find(
    (s) => String(s._id) === String(userId)
  );

  const days = matrixResult?.days || [];

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    router.replace(
      `/attendance/matrix/${userId}?month=${newMonth}&year=${selectedYear}`,
      { scroll: false }
    );
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    router.replace(
      `/attendance/matrix/${userId}?month=${selectedMonth}&year=${newYear}`,
      { scroll: false }
    );
  };

  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth, 10) - 1;
    let y = parseInt(selectedYear, 10);
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const newMonth = String(m);
    const newYear = String(y);
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    router.replace(
      `/attendance/matrix/${userId}?month=${newMonth}&year=${newYear}`,
      { scroll: false }
    );
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth, 10) + 1;
    let y = parseInt(selectedYear, 10);
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const newMonth = String(m);
    const newYear = String(y);
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
    router.replace(
      `/attendance/matrix/${userId}?month=${newMonth}&year=${newYear}`,
      { scroll: false }
    );
  };

  const formatHours = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const displayName = summary?.userName || staffMember?.name || "Staff Member";
  const displayRole = staffMember?.roleName || "Staff Member";
  const displayEmail = staffMember?.email || staffMember?.username || "";

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* 3-Level Deep Breadcrumbs: Attendance > Matrix > Summary */}
      <Breadcrumbs
        items={[
          { label: "Attendance", href: "/attendance" },
          {
            label: "Matrix",
            href: `/attendance/matrix?month=${selectedMonth}&year=${selectedYear}`,
          },
          { label: `${displayName} Summary` },
        ]}
        rightAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 w-[125px] text-xs">
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

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[85px] text-xs">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <SelectItem key={yr} value={String(yr)}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Back Button */}
      <BackButton
        href={`/attendance/matrix?month=${selectedMonth}&year=${selectedYear}`}
        label="Back to Attendance Matrix"
      />

      {/* Staff Profile Hero Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl border border-primary/20 shadow-sm">
                {displayName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {displayName}
                  </h1>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {displayRole}
                  </Badge>
                  {summary?.isProrated && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-600 bg-amber-500/10 text-xs"
                    >
                      Mid-Month Joinee
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {displayEmail} {summary?.joiningDate ? `• Joined: ${summary.joiningDate}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-6 border-border/60">
              <span className="text-xs text-muted-foreground block">Selected Period</span>
              <span className="text-base font-bold text-foreground">
                {MONTH_NAMES[parseInt(selectedMonth, 10) - 1]} {selectedYear}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isSummaryLoading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Loading staff attendance audit & payable days...
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Prorated Joinee Banner */}
          {summary.isProrated && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm">Prorated Attendance Period</div>
                <p className="opacity-90 leading-relaxed text-xs">
                  This employee joined mid-month on <strong>{summary.joiningDate}</strong>.{" "}
                  <strong>{summary.preJoiningDays} calendar days</strong> prior to their start date
                  are marked as <span className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">N/A</span> and
                  excluded from working day targets and payable denominator calculations.
                </p>
              </div>
            </div>
          )}

          {/* Primary Payroll Highlight: Total Payable Days & Attendance Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-primary/30 bg-primary/5 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Payable Days
                  </span>
                  <Badge variant="outline" className="border-primary/30 text-primary text-[11px]">
                    Payroll Ready
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline gap-2.5">
                  <span className="text-4xl font-extrabold tracking-tight text-primary">
                    {summary.payableDays.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {summary.effectiveTotalDays} Effective Days
                    {summary.isProrated && ` (${summary.totalDays} calendar)`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Formula: Present ({summary.presentDays}) + Half Days ({summary.halfDays * 0.5}) + Paid Leaves ({summary.paidLeaves}) + Weekends/Holidays ({summary.holidays}).
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Attendance Rate</span>
                  <span className="text-base font-bold text-foreground">
                    {summary.attendancePercentage}%
                  </span>
                </div>
                <Progress
                  value={summary.attendancePercentage}
                  className="h-2.5 mt-3 bg-muted"
                />
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Working Hours: <strong className="text-foreground">{formatHours(summary.totalWorkingMinutes)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Overtime: <strong>{formatHours(summary.totalOvertimeMinutes)}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metric Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-muted-foreground block">
                  Present Days
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {summary.presentDays}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Full day shifts</span>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-muted-foreground block">
                  Half Days
                </span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                  {summary.halfDays}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  +{summary.halfDays * 0.5} payable credit
                </span>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-muted-foreground block">
                  Paid Leaves
                </span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                  {summary.paidLeaves}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Approved paid leaves</span>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-muted-foreground block">
                  Absent Days
                </span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                  {summary.absentDays}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">Unexcused / unpaid</span>
              </CardContent>
            </Card>
          </div>

          {/* Weekends & Statutory Holidays Credited */}
          <div className="rounded-xl border bg-muted/30 p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Weekends & Statutory Holidays
              </div>
              <p className="text-muted-foreground">
                {summary.weekendsCount} Weekly Rest Days + {summary.officialHolidaysCount} Official Gazetted Holidays ={" "}
                <strong className="text-foreground">{summary.holidays} total credited rest days</strong>.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit text-xs px-3 py-1 font-semibold">
              Automatically Credited
            </Badge>
          </div>

          {/* Itemized Daily Breakdown Table */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    Itemized Daily Attendance & Punch Log
                  </CardTitle>
                  <CardDescription>
                    Complete calendar day verification, punch in/out timestamps, and office perimeter verification method.
                  </CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  {days.length} Days in Period
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold text-xs">Date</TableHead>
                      <TableHead className="font-semibold text-xs">Day</TableHead>
                      <TableHead className="font-semibold text-xs">Status</TableHead>
                      <TableHead className="font-semibold text-xs">Verification Method</TableHead>
                      <TableHead className="font-semibold text-xs">In Time</TableHead>
                      <TableHead className="font-semibold text-xs">Out Time</TableHead>
                      <TableHead className="font-semibold text-xs">Total Duration</TableHead>
                      <TableHead className="font-semibold text-xs">Notes / Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {days.map((day) => {
                      const rec = staffMember?.records?.[day.day];
                      let displayStatus = rec?.status || "--";
                      const isPreJoining = rec?.status === "N/A" || rec?.isPreJoining;

                      if (isPreJoining) {
                        displayStatus = "Pre-Joining (N/A)";
                      } else if (day.isHoliday) {
                        displayStatus = "Holiday";
                      } else if (day.isWeekend && !rec?.status) {
                        displayStatus = "Weekend";
                      }

                      return (
                        <TableRow
                          key={day.day}
                          className={`text-xs hover:bg-muted/30 transition-colors ${
                            isPreJoining ? "bg-muted/15" : ""
                          }`}
                        >
                          <TableCell className="font-mono font-medium">{day.date}</TableCell>
                          <TableCell className="text-muted-foreground">{day.dayOfWeek}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                isPreJoining
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
                          <TableCell>
                            {rec?.verifiedVia === "office_ip" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit"
                              >
                                <Wifi className="h-3 w-3" />
                                Office Wi-Fi / IP
                              </Badge>
                            ) : rec?.verifiedVia === "gps" ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1 w-fit"
                              >
                                <MapPin className="h-3 w-3" />
                                GPS Geofence
                              </Badge>
                            ) : rec?.verifiedVia === "manual" ? (
                              <Badge variant="outline" className="text-[10px]">
                                Manual / Admin
                              </Badge>
                            ) : isPreJoining ? (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono text-[11px]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {rec?.checkIn ? format(new Date(rec.checkIn), "hh:mm a") : "--"}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {rec?.checkOut ? format(new Date(rec.checkOut), "hh:mm a") : "--"}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {rec?.totalMinutes ? formatHours(rec.totalMinutes) : "--"}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate text-[11px]">
                            {isPreJoining
                              ? rec?.notes || `Pre-Joining (Joined on ${summary.joiningDate})`
                              : day.isHoliday
                              ? day.holiday?.name
                              : rec?.notes || "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground">
          Employee attendance summary could not be retrieved for the selected period.
        </Card>
      )}
    </div>
  );
}
