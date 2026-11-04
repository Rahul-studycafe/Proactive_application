"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  Clock,
  Coffee,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { AttendanceKPIOverview } from "@/lib/types/analytics";
import { useGetAttendanceOverviewQuery } from "@/lib/services/api";
import { format } from "date-fns";

interface AttendanceKPIWidgetProps {
  data?: AttendanceKPIOverview;
  isLoading?: boolean;
}

export function AttendanceKPIWidget({
  data: propData,
  isLoading: propLoading,
}: AttendanceKPIWidgetProps) {
  const { data: fetchedData, isLoading: queryLoading } =
    useGetAttendanceOverviewQuery(undefined, { skip: !!propData });

  const overview = propData || fetchedData;
  const isLoading = propLoading !== undefined ? propLoading : queryLoading;

  const rate = overview?.presenceRate || 0;
  const totalStaff = overview?.totalStaff || 0;

  // SVG Circular Ring calculation
  const radius = 54;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  const todayFormatted = useMemo(() => {
    return format(new Date(), "dd MMM yyyy");
  }, []);

  return (
    <Card className="rounded-xl border shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Firm Attendance Today
              </CardTitle>
              <CardDescription className="text-xs">
                Live team check-in and presence monitoring
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {todayFormatted}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !overview ? (
          <div className="flex flex-col items-center justify-center h-56 text-center text-muted-foreground space-y-2">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs">No attendance data recorded today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top row: Presence Progress Ring & Staff Summary */}
            <div className="flex items-center justify-around py-2">
              {/* Circular Gauge Ring */}
              <div className="relative flex items-center justify-center">
                <svg
                  height={radius * 2}
                  width={radius * 2}
                  className="transform -rotate-90"
                >
                  {/* Background Track */}
                  <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-muted/40"
                  />
                  {/* Progress Indicator */}
                  <circle
                    stroke={
                      rate >= 80
                        ? "#10B981"
                        : rate >= 60
                          ? "#F59E0B"
                          : "#EF4444"
                    }
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {rate}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Present
                  </span>
                </div>
              </div>

              {/* Total Staff Overview */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Total Headcount</span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {totalStaff}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    Staff
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {overview.presentToday} checked in today
                </p>
              </div>
            </div>

            {/* Metric Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Present
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {overview.presentToday}
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                  Half Day
                </div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {overview.halfDayToday}
                </div>
              </div>

              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                  On Leave
                </div>
                <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {overview.onLeaveToday}
                </div>
              </div>

              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2">
                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                  Absent
                </div>
                <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {overview.absentToday}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-lg border bg-muted/40 p-2">
                <div className="text-[10px] text-muted-foreground font-medium">
                  Unmarked
                </div>
                <div className="text-base font-bold text-muted-foreground mt-0.5">
                  {overview.unmarkedToday}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Nav Footer Links */}
        <div className="pt-2 border-t flex items-center justify-between text-xs">
          <Link
            href="/attendance"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Daily Operations Desk</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            href="/attendance/matrix"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>31-Day Matrix</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
