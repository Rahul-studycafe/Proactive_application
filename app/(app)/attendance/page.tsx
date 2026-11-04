"use client";

import { useState } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  CheckCircle,
  CalendarDays,
} from "lucide-react";

import { useGetDailyAttendanceQuery } from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DailyAttendanceStatsRibbon } from "@/components/attendance/DailyAttendanceStatsRibbon";
import { DailyRosterTable } from "@/components/attendance/DailyRosterTable";
import { BulkAttendanceBar } from "@/components/attendance/BulkAttendanceBar";
import { WebPunchModal } from "@/components/attendance/WebPunchModal";
import { usePermissions } from "@/contexts/PermissionsContext";

export default function AttendanceDeskPage() {
  const { can } = usePermissions();
  const canManage = can("attendance.manage");

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [punchModalOpen, setPunchModalOpen] = useState<boolean>(false);

  // Fetch daily attendance roster
  const {
    data: rosterResult,
    isLoading,
    isFetching,
  } = useGetDailyAttendanceQuery({
    date: selectedDate,
  });

  const currentDateObj = new Date(selectedDate);

  const handlePrevDay = () => {
    const prev = subDays(currentDateObj, 1);
    setSelectedDate(format(prev, "yyyy-MM-dd"));
    setSelectedUserIds([]);
  };

  const handleNextDay = () => {
    const next = addDays(currentDateObj, 1);
    setSelectedDate(format(next, "yyyy-MM-dd"));
    setSelectedUserIds([]);
  };

  const handleToday = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedUserIds([]);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const selectAllUsers = (checked: boolean) => {
    if (checked && rosterResult?.roster) {
      setSelectedUserIds(rosterResult.roster.map((m) => m._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Attendance Operations Desk
          </h1>
          <p className="text-sm text-muted-foreground">
            Live operations roster, biometric punch status, and manual
            adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/attendance/matrix">
              <CalendarDays className="h-4 w-4 text-primary" />
              Monthly Matrix
            </Link>
          </Button>

          <Button
            onClick={() => setPunchModalOpen(true)}
            className="gap-2 shadow-sm"
          >
            <Clock className="h-4 w-4" />
            Quick Web Punch
          </Button>
        </div>
      </div>

      {/* Date Navigation Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            className="h-8 w-8"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={isToday(currentDateObj) ? "default" : "outline"}
            size="sm"
            onClick={handleToday}
            className="h-8 text-xs font-medium"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-8 w-8"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {format(currentDateObj, "EEEE, dd MMMM yyyy")}
          </span>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
                setSelectedUserIds([]);
              }
            }}
            className="h-8 w-36 text-xs bg-muted/20"
          />
        </div>
      </div>

      {/* Stats Summary Ribbon */}
      <DailyAttendanceStatsRibbon
        summary={rosterResult?.summary}
        isLoading={isLoading}
      />

      {/* Daily Staff Roster Table */}
      <DailyRosterTable
        roster={rosterResult?.roster || []}
        isLoading={isLoading || isFetching}
        targetDate={selectedDate}
        selectedIds={selectedUserIds}
        onToggleSelect={toggleSelectUser}
        onSelectAll={selectAllUsers}
      />

      {/* Floating Bulk Action Bar */}
      {canManage && (
        <BulkAttendanceBar
          selectedUserIds={selectedUserIds}
          onClearSelection={() => setSelectedUserIds([])}
          targetDate={selectedDate}
        />
      )}

      {/* Web Punch Modal */}
      <WebPunchModal open={punchModalOpen} onOpenChange={setPunchModalOpen} />
    </div>
  );
}
