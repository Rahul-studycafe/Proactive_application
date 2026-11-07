"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useGetTodayAttendanceQuery } from "@/lib/services/api";
import { WebPunchModal } from "@/components/attendance/WebPunchModal";

interface MyAttendanceWidgetProps {
  isLoading?: boolean;
}

export function MyAttendanceWidget({ isLoading: propLoading }: MyAttendanceWidgetProps) {
  const [punchModalOpen, setPunchModalOpen] = useState(false);
  const { data: attendance, isLoading: queryLoading } = useGetTodayAttendanceQuery();

  const isLoading = propLoading !== undefined ? propLoading : queryLoading;
  const todayFormatted = format(new Date(), "dd MMM yyyy");

  const status = attendance?.status || "Unmarked";
  const hasCheckedIn = Boolean(attendance?.checkIn);
  const hasCheckedOut = Boolean(attendance?.checkOut);

  const formatTime = (timeStr?: string | Date) => {
    if (!timeStr) return "--:--";
    return format(new Date(timeStr), "hh:mm a");
  };

  const formatHours = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <>
      <Card className="rounded-xl border shadow-sm flex flex-col justify-between">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">
                  My Attendance Today
                </CardTitle>
                <CardDescription className="text-xs">
                  Your daily presence & punch times
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              {todayFormatted}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {isLoading ? (
            <div className="flex h-36 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Status Header Pill */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Today&apos;s Status
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {status}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 font-medium ${
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
                  {hasCheckedIn && !hasCheckedOut ? "Clocked In" : status}
                </Badge>
              </div>

              {/* Punch Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Punch In
                  </span>
                  <span className="text-xs font-semibold font-mono text-foreground mt-0.5 block">
                    {formatTime(attendance?.checkIn)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Punch Out
                  </span>
                  <span className="text-xs font-semibold font-mono text-foreground mt-0.5 block">
                    {attendance?.checkOut ? (
                      formatTime(attendance.checkOut)
                    ) : hasCheckedIn ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                    ) : (
                      "--:--"
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg border border-border/60 bg-muted/10">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                    Total Time
                  </span>
                  <span className="text-xs font-semibold font-mono text-foreground mt-0.5 block">
                    {formatHours(attendance?.totalMinutes)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <Button
                  size="sm"
                  className="w-full text-xs gap-1.5"
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
            </>
          )}

          <div className="pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
              Personal Attendance Record
            </span>
            <Link
              href="/attendance"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>My Attendance Desk</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <WebPunchModal
        open={punchModalOpen}
        onOpenChange={setPunchModalOpen}
      />
    </>
  );
}

