"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  LogIn,
  LogOut,
  CheckCircle2,
  MapPin,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetTodayAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetWorkingDaysQuery,
} from "@/lib/services/api";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface WebPunchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebPunchModal({ open, onOpenChange }: WebPunchModalProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");

  const { data: todayAttendance, isLoading: isAttendanceLoading } =
    useGetTodayAttendanceQuery();
  const { data: workDaysConfig } = useGetWorkingDaysQuery();
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const isIpWhitelistActive = Boolean(
    workDaysConfig?.officePerimeter?.enableIpWhitelist,
  );

  const {
    coordinates,
    loading: isGeoLoading,
    isInsideGeofence,
    error: geoError,
  } = useGeolocation();

  // Live seconds clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasCheckedIn = Boolean(todayAttendance?.checkIn);
  const hasCheckedOut = Boolean(todayAttendance?.checkOut);

  // Live timer if checked in and not checked out
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

  const handlePunchIn = async () => {
    try {
      await checkIn({
        date: format(currentTime, "yyyy-MM-dd"),
        timestamp: currentTime.toISOString(),
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Punch In recorded successfully");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to record punch in",
      );
    }
  };

  const handlePunchOut = async () => {
    try {
      await checkOut({
        date: format(currentTime, "yyyy-MM-dd"),
        timestamp: currentTime.toISOString(),
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        notes: notes.trim() || undefined,
      }).unwrap();
      toast.success("Punch Out recorded successfully");
      setNotes("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to record punch out",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Attendance Web Punch
          </DialogTitle>
          <DialogDescription>
            Record your daily office check-in and check-out with GPS
            verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Live Clock & Date Banner */}
          <div className="rounded-xl border bg-muted/40 p-4 text-center">
            <div className="text-3xl font-mono font-bold tracking-tight text-foreground">
              {format(currentTime, "hh:mm:ss a")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(currentTime, "EEEE, dd MMMM yyyy")}
            </div>

            {/* Current Status Pill */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {isAttendanceLoading ? (
                <Badge variant="outline" className="animate-pulse">
                  Checking status...
                </Badge>
              ) : hasCheckedOut ? (
                <Badge
                  variant="outline"
                  className="border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 font-medium"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  Checked Out ({getElapsedString()})
                </Badge>
              ) : hasCheckedIn ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium animate-pulse"
                >
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  Checked In: {getElapsedString()}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                >
                  Not Checked In Today
                </Badge>
              )}
            </div>
          </div>

          {/* Office Perimeter Status Badge */}
          <div className="rounded-lg border p-3 bg-card text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              {todayAttendance?.verifiedVia === "office_ip" ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium">Perimeter Verification:</span>
                {todayAttendance?.verifiedVia ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1.5">
                    {todayAttendance.verifiedVia === "office_ip"
                      ? "Verified via Office Wi-Fi / Static IP"
                      : todayAttendance.verifiedVia === "gps"
                        ? "Verified via GPS Geofence"
                        : "Verified"}
                  </span>
                ) : isGeoLoading ? (
                  <span className="text-muted-foreground ml-1.5">
                    Acquiring GPS / Network...
                  </span>
                ) : isInsideGeofence ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1.5">
                    Within Office Perimeter
                  </span>
                ) : isIpWhitelistActive ? (
                  <span className="text-primary font-medium ml-1.5">
                    Office Wi-Fi / IP Whitelist Active
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium ml-1.5">
                    Remote / Outside Perimeter
                  </span>
                )}
              </div>
            </div>

            {todayAttendance?.verifiedVia || isInsideGeofence ? (
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            ) : isIpWhitelistActive ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            )}
          </div>

          {/* Punch Times details if checked in */}
          {hasCheckedIn && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block">In Time:</span>
                <span className="font-semibold text-foreground">
                  {todayAttendance?.checkIn
                    ? format(new Date(todayAttendance.checkIn), "hh:mm a")
                    : "--"}
                </span>
              </div>
              <div className="rounded-lg border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block">Out Time:</span>
                <span className="font-semibold text-foreground">
                  {todayAttendance?.checkOut
                    ? format(new Date(todayAttendance.checkOut), "hh:mm a")
                    : "Active"}
                </span>
              </div>
            </div>
          )}

          {/* Notes field */}
          {!hasCheckedOut && (
            <div className="space-y-1.5">
              <Label htmlFor="punchNotes" className="text-xs">
                Work Notes / Tasks (Optional)
              </Label>
              <Textarea
                id="punchNotes"
                placeholder="e.g. Audit work at client premises, GST filing, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          )}

          {/* Action CTA */}
          <div className="pt-2">
            {hasCheckedOut ? (
              <Button disabled variant="outline" className="w-full">
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Shift Completed Today
              </Button>
            ) : hasCheckedIn ? (
              <Button
                onClick={handlePunchOut}
                disabled={isCheckingOut}
                variant="destructive"
                className="w-full"
              >
                {isCheckingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Punch Out
              </Button>
            ) : (
              <Button
                onClick={handlePunchIn}
                disabled={isCheckingIn}
                className="w-full"
              >
                {isCheckingIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                Punch In
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
