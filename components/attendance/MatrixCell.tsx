"use client";

import { format } from "date-fns";
import { Calendar, Clock, Wifi, MapPin } from "lucide-react";
import type { IAttendance, MonthlyMatrixDay, AttendanceStatus } from "@/lib/types/attendance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface MatrixCellProps {
  dayInfo: MonthlyMatrixDay;
  record?: IAttendance | null;
  employeeName: string;
  onClick?: () => void;
  canEdit?: boolean;
}

export function MatrixCell({
  dayInfo,
  record,
  employeeName,
  onClick,
  canEdit = true,
}: MatrixCellProps) {
  const isWeekend = dayInfo.isWeekend;
  const isHoliday = dayInfo.isHoliday;
  const status = record?.status;
  const isPreJoining = status === "N/A" || Boolean(record?.isPreJoining);

  let badgeText = "--";
  let badgeStyle =
    "text-muted-foreground/40 hover:bg-muted/60";

  // Dedicated badge styling inside the tooltip pill
  let statusBadgeStyle = "bg-muted/80 text-muted-foreground border-border/60";

  if (isPreJoining) {
    badgeText = "N/A";
    badgeStyle =
      "bg-muted/30 text-muted-foreground/60 text-[10px] font-mono border border-dashed border-border/60 cursor-not-allowed";
    statusBadgeStyle =
      "bg-muted/40 text-muted-foreground border-dashed border-border/60";
  } else if (status === "Present") {
    badgeText = "P";
    badgeStyle =
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/30";
    statusBadgeStyle =
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  } else if (status === "Half Day") {
    badgeText = "HD";
    badgeStyle =
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/30";
    statusBadgeStyle =
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  } else if (status === "Paid Leave" || status === "Leave") {
    badgeText = status === "Paid Leave" ? "PL" : "L";
    badgeStyle =
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold border border-blue-500/30";
    statusBadgeStyle =
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  } else if (status === "Absent") {
    badgeText = "A";
    badgeStyle =
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold border border-rose-500/30";
    statusBadgeStyle =
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  } else if (status === "Holiday" || isHoliday) {
    badgeText = "H";
    badgeStyle =
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 font-semibold border border-purple-500/30";
    statusBadgeStyle =
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
  } else if (isWeekend) {
    badgeText = "W";
    badgeStyle = "bg-muted/60 text-muted-foreground font-normal border border-border/40";
    statusBadgeStyle = "bg-muted/60 text-muted-foreground border-border/40";
  }

  const tooltipTitle = isPreJoining
    ? (record?.notes || "Pre-Joining Period (Not Applicable)")
    : isHoliday
    ? `Holiday: ${dayInfo.holiday?.name || "Official Holiday"}`
    : isWeekend
    ? "Weekly Weekend Closure"
    : status || "Unmarked";

  const effectiveCanEdit = canEdit && !isPreJoining;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={effectiveCanEdit ? onClick : undefined}
            disabled={!effectiveCanEdit}
            className={`flex h-8 w-8 mx-auto items-center justify-center rounded-md text-xs transition-transform active:scale-95 ${badgeStyle} ${
              effectiveCanEdit ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"
            }`}
          >
            {badgeText}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="z-50 min-w-[210px] max-w-[260px] p-3 space-y-2 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl"
        >
          {/* Header: Employee Name & Grid Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
            <span className="font-semibold text-xs text-foreground truncate">
              {employeeName}
            </span>
            <span
              className={`inline-flex items-center justify-center h-5 w-6 rounded text-[10px] font-bold ${badgeStyle}`}
            >
              {badgeText}
            </span>
          </div>

          {/* Date & Day of Week */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0 opacity-70" />
            <span>
              {dayInfo.date} • {dayInfo.dayOfWeek}
            </span>
          </div>

          {/* Status Badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadgeStyle}`}
            >
              {tooltipTitle}
            </span>
          </div>

          {/* In / Out Timestamps */}
          {record?.checkIn && (
            <div className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-[11px] text-foreground/80">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Punch:</span>
              </span>
              <span className="font-mono text-[10px]">
                {format(new Date(record.checkIn), "hh:mm a")}
                {record?.checkOut && ` - ${format(new Date(record.checkOut), "hh:mm a")}`}
              </span>
            </div>
          )}

          {/* Verification Method */}
          {record?.verifiedVia && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              {record.verifiedVia === "office_ip" ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-2.5 w-2.5" /> Office Wi-Fi / IP Verified
                </span>
              ) : record.verifiedVia === "gps" ? (
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <MapPin className="h-2.5 w-2.5" /> GPS Geofence Verified
                </span>
              ) : null}
            </div>
          )}

          {/* Notes */}
          {record?.notes && (
            <div className="text-[11px] italic text-muted-foreground bg-muted/20 p-1.5 rounded border border-border/40">
              {record.notes}
            </div>
          )}

          {/* Action Hint */}
          {effectiveCanEdit && (
            <div className="text-[10px] text-muted-foreground/70 pt-1 border-t border-border/40 flex items-center justify-between">
              <span>Click cell to adjust</span>
              <span className="font-mono text-[9px] text-primary">Edit ↵</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
