"use client";

import { useState } from "react";
import { CheckCheck, Users, X, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import type { AttendanceStatus } from "@/lib/types/attendance";
import { useBulkMarkAttendanceMutation } from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface BulkAttendanceBarProps {
  selectedUserIds: string[];
  onClearSelection: () => void;
  targetDate: string; // YYYY-MM-DD
}

export function BulkAttendanceBar({
  selectedUserIds,
  onClearSelection,
  targetDate,
}: BulkAttendanceBarProps) {
  const [confirmStatus, setConfirmStatus] = useState<AttendanceStatus | null>(null);
  const [bulkMarkAttendance, { isLoading }] = useBulkMarkAttendanceMutation();

  if (selectedUserIds.length === 0) return null;

  const count = selectedUserIds.length;
  const isCapped = count > 250;
  const effectiveCount = Math.min(count, 250);

  const handleApplyBulk = async () => {
    if (!confirmStatus) return;

    try {
      const result = await bulkMarkAttendance({
        userIds: selectedUserIds.slice(0, 250),
        date: targetDate,
        status: confirmStatus,
        notes: `Bulk marked as ${confirmStatus} on ${targetDate}`,
      }).unwrap();

      toast.success(
        `Successfully marked ${result?.count || effectiveCount} employees as ${confirmStatus}`
      );
      onClearSelection();
      setConfirmStatus(null);
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message || err?.data?.message || "Failed to bulk mark attendance"
      );
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border bg-card/95 px-5 py-3 shadow-2xl backdrop-blur-md transition-all">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
            <Users className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">
            {count} {count === 1 ? "Staff Member" : "Staff Members"} Selected
          </span>
          {isCapped && (
            <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
              Batch capped at 250
            </Badge>
          )}
        </div>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
            onClick={() => setConfirmStatus("Present")}
            disabled={isLoading}
          >
            Mark Present
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 dark:text-blue-400"
            onClick={() => setConfirmStatus("Paid Leave")}
            disabled={isLoading}
          >
            Mark Paid Leave
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-purple-500/40 text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
            onClick={() => setConfirmStatus("Holiday")}
            disabled={isLoading}
          >
            Mark Holiday
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            onClick={() => setConfirmStatus("Absent")}
            disabled={isLoading}
          >
            Mark Absent
          </Button>
        </div>

        <div className="h-4 w-[1px] bg-border mx-1" />

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onClearSelection}
          title="Deselect All"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(confirmStatus)}
        onOpenChange={(open) => !open && setConfirmStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-primary" />
              Confirm Bulk Attendance Action
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to mark{" "}
                  <strong className="text-foreground">{effectiveCount} staff members</strong>{" "}
                  as <strong className="text-foreground font-semibold">{confirmStatus}</strong>{" "}
                  for <strong className="text-foreground">{targetDate}</strong>?
                </p>
                <p className="text-xs">
                  This will override any existing punch or unmarked status for these employees.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyBulk} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Bulk Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
