"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useGetTodayAttendanceQuery } from "@/lib/services/api";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WebPunchModal } from "./WebPunchModal";

export interface WebPunchWidgetProps {
  variant?: "compact" | "card";
  className?: string;
}

export function WebPunchWidget({
  variant = "compact",
  className,
}: WebPunchWidgetProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const { data: todayAttendance, isLoading } = useGetTodayAttendanceQuery();
  const { isInsideGeofence } = useGeolocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasCheckedIn = Boolean(todayAttendance?.checkIn);
  const hasCheckedOut = Boolean(todayAttendance?.checkOut);

  const getElapsedString = () => {
    if (!todayAttendance?.checkIn) return "00:00:00";
    const start = new Date(todayAttendance.checkIn).getTime();
    const end = todayAttendance.checkOut
      ? new Date(todayAttendance.checkOut).getTime()
      : currentTime.getTime();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));
    const hrs = String(Math.floor(diffSec / 3600)).padStart(2, "0");
    const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
    const secs = String(diffSec % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // 1. Compact Variant (For TopBar)
  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent hover:border-primary/40 focus:outline-none"
          title="Daily Web Punch Desk"
        >
          {isLoading ? (
            <span className="text-muted-foreground">Syncing punch...</span>
          ) : hasCheckedOut ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-muted-foreground">Shift Done</span>
            </>
          ) : hasCheckedIn ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {getElapsedString()}
              </span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Punch In
              </span>
            </>
          )}
        </button>

        <WebPunchModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  // 2. Expanded Card Variant (For Dashboard)
  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Today's Attendance Desk
            </CardTitle>
            {isInsideGeofence ? (
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-xs"
              >
                <ShieldCheck className="mr-1 h-3 w-3" /> Geofence Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs"
              >
                <ShieldAlert className="mr-1 h-3 w-3" /> Remote Perimeter
              </Badge>
            )}
          </div>
          <CardDescription>
            {format(currentTime, "EEEE, dd MMMM yyyy")} • Live Time:{" "}
            <span className="font-mono font-medium text-foreground">
              {format(currentTime, "hh:mm:ss a")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <span className="text-xs text-muted-foreground block">
                Current Status
              </span>
              <span className="text-sm font-semibold">
                {hasCheckedOut
                  ? "Checked Out"
                  : hasCheckedIn
                    ? "Checked In"
                    : "Not Punched In"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">
                Duration
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {hasCheckedIn ? getElapsedString() : "-- : -- : --"}
              </span>
            </div>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            variant={hasCheckedIn && !hasCheckedOut ? "destructive" : "default"}
            className="w-full"
          >
            {hasCheckedOut ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Shift Summary
              </>
            ) : hasCheckedIn ? (
              <>
                <LogOut className="mr-2 h-4 w-4" /> Punch Out
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Punch In Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <WebPunchModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
