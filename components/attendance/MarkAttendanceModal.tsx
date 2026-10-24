"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Edit3, User, Calendar, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

import type { DailyRosterMember, AttendanceStatus } from "@/lib/types/attendance";
import { useMarkAttendanceMutation } from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MarkAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: DailyRosterMember | null;
  targetDate: string; // YYYY-MM-DD
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Half Day",
  "Leave",
  "Paid Leave",
  "Absent",
  "Holiday",
];

export function MarkAttendanceModal({
  open,
  onOpenChange,
  member,
  targetDate,
}: MarkAttendanceModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>("Present");
  const [inTime, setInTime] = useState<string>("09:30");
  const [outTime, setOutTime] = useState<string>("18:00");
  const [notes, setNotes] = useState<string>("");

  const [markAttendance, { isLoading }] = useMarkAttendanceMutation();

  useEffect(() => {
    if (member) {
      const existingStatus = member.attendance?.status;
      setStatus(
        existingStatus && existingStatus !== "Unmarked" ? existingStatus : "Present"
      );

      if (member.attendance?.checkIn) {
        setInTime(format(new Date(member.attendance.checkIn), "HH:mm"));
      } else {
        setInTime("09:30");
      }

      if (member.attendance?.checkOut) {
        setOutTime(format(new Date(member.attendance.checkOut), "HH:mm"));
      } else {
        setOutTime("18:00");
      }

      setNotes(member.attendance?.notes || "");
    }
  }, [member, open]);

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let checkInIso: string | undefined = undefined;
    let checkOutIso: string | undefined = undefined;

    if (status === "Present" || status === "Half Day") {
      if (inTime) {
        checkInIso = new Date(`${targetDate}T${inTime}:00`).toISOString();
      }
      if (outTime) {
        checkOutIso = new Date(`${targetDate}T${outTime}:00`).toISOString();
      }
    }

    try {
      await markAttendance({
        userId: member._id,
        date: targetDate,
        status,
        checkIn: checkInIso || null,
        checkOut: checkOutIso || null,
        notes: notes.trim() || null,
      }).unwrap();

      toast.success(`Attendance marked as ${status} for ${member.name}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.data?.message || "Failed to mark attendance"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Manual Attendance Entry
            </DialogTitle>
            <DialogDescription>
              Adjust or manually override attendance status for staff members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Staff Details Banner */}
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.roleName || "Employee"} • Date:{" "}
                  <span className="font-medium text-foreground">{targetDate}</span>
                </p>
              </div>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="statusSelect">Attendance Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as AttendanceStatus)}
              >
                <SelectTrigger id="statusSelect">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Check-In and Check-Out Time Pickers (visible if Present or Half Day) */}
            {(status === "Present" || status === "Half Day") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inTime" className="text-xs">
                    Check-In Time
                  </Label>
                  <Input
                    id="inTime"
                    type="time"
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="outTime" className="text-xs">
                    Check-Out Time
                  </Label>
                  <Input
                    id="outTime"
                    type="time"
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Notes / Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="adminNotes" className="text-xs">
                Adjustment Reason / Notes
              </Label>
              <Textarea
                id="adminNotes"
                placeholder="e.g. Approved client tax audit visit, medical leave, forgot to punch..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
