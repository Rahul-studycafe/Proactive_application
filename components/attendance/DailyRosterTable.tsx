"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  MoreVertical,
  Edit,
  UserCheck,
  Building,
  UserX,
  HelpCircle,
  Loader2,
} from "lucide-react";

import type { DailyRosterMember, AttendanceStatus } from "@/lib/types/attendance";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarkAttendanceModal } from "./MarkAttendanceModal";

export interface DailyRosterTableProps {
  roster: DailyRosterMember[];
  isLoading: boolean;
  targetDate: string;
  selectedIds: string[];
  onToggleSelect: (userId: string) => void;
  onSelectAll: (checked: boolean) => void;
}

export function DailyRosterTable({
  roster,
  isLoading,
  targetDate,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: DailyRosterTableProps) {
  const [search, setSearch] = useState("");
  const [editingMember, setEditingMember] = useState<DailyRosterMember | null>(null);

  const { can } = usePermissions();
  const { user } = useAuth();
  const canManage = can("attendance.manage");
  const isSelfOnly = !can("attendance.view_all") && can("attendance.view_self");

  const visibleRoster = isSelfOnly && user
    ? roster.filter(
        (m) =>
          m._id === (user as any).id ||
          m._id === (user as any)._id ||
          m.email === user.email ||
          m.username === user.email
      )
    : roster;

  // Filter roster by name, username or role
  const filteredRoster = visibleRoster.filter((member) => {
    const q = search.toLowerCase();
    return (
      member.name.toLowerCase().includes(q) ||
      member.username.toLowerCase().includes(q) ||
      (member.roleName && member.roleName.toLowerCase().includes(q)) ||
      (member.departmentName && member.departmentName.toLowerCase().includes(q))
    );
  });

  const allSelected =
    filteredRoster.length > 0 &&
    filteredRoster.every((m) => selectedIds.includes(m._id));
  const someSelected =
    filteredRoster.some((m) => selectedIds.includes(m._id)) && !allSelected;

  const renderStatusBadge = (status?: AttendanceStatus) => {
    switch (status) {
      case "Present":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            Present
          </Badge>
        );
      case "Half Day":
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
          >
            Half Day
          </Badge>
        );
      case "Leave":
      case "Paid Leave":
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
          >
            {status}
          </Badge>
        );
      case "Absent":
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
          >
            Absent
          </Badge>
        );
      case "Holiday":
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium"
          >
            Holiday
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-dashed border-slate-400/40 bg-slate-500/5 text-slate-500 dark:text-slate-400 font-normal"
          >
            Unmarked
          </Badge>
        );
    }
  };

  const formatDuration = (mins?: number) => {
    if (typeof mins !== "number" || mins <= 0) return "--";
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    if (m === 0) return `${hrs}h`;
    return `${hrs}h ${m}m`;
  };

  return (
    <div className="space-y-3">
      {/* Search & Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredRoster.length}</span> staff members
        </div>
      </div>

      {/* Roster Data Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {canManage && (
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all employees"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </TableHead>
              )}
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">In Time</TableHead>
              <TableHead className="font-semibold">Out Time</TableHead>
              <TableHead className="font-semibold">Duration</TableHead>
              <TableHead className="font-semibold">Overtime</TableHead>
              <TableHead className="font-semibold">Notes</TableHead>
              {canManage && (
                <TableHead className="w-16 text-right font-semibold">Action</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 7} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Loading daily attendance roster...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRoster.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 9 : 7} className="h-40 text-center text-sm text-muted-foreground">
                  No staff members matched your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoster.map((member) => {
                const att = member.attendance;
                const isSelected = selectedIds.includes(member._id);

                return (
                  <TableRow
                    key={member._id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    {canManage && (
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${member.name}`}
                          checked={isSelected}
                          onChange={() => onToggleSelect(member._id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </TableCell>
                    )}

                    {/* Employee Profile */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm leading-tight">
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.roleName || "Staff Member"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>{renderStatusBadge(att?.status)}</TableCell>

                    {/* In Time */}
                    <TableCell className="text-xs font-mono">
                      {att?.checkIn ? (
                        format(new Date(att.checkIn), "hh:mm a")
                      ) : (
                        <span className="text-muted-foreground">-- | --</span>
                      )}
                    </TableCell>

                    {/* Out Time */}
                    <TableCell className="text-xs font-mono">
                      {att?.checkOut ? (
                        format(new Date(att.checkOut), "hh:mm a")
                      ) : att?.checkIn ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-- | --</span>
                      )}
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-xs font-mono">
                      {formatDuration(att?.totalMinutes)}
                    </TableCell>

                    {/* Overtime */}
                    <TableCell className="text-xs font-mono">
                      {att?.overtimeMinutes && att.overtimeMinutes > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          +{formatDuration(att.overtimeMinutes)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                      {att?.notes || "--"}
                    </TableCell>

                    {/* Actions */}
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Adjust</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manual Entry / Override Modal */}
      {editingMember && (
        <MarkAttendanceModal
          open={Boolean(editingMember)}
          onOpenChange={(open) => !open && setEditingMember(null)}
          member={editingMember}
          targetDate={targetDate}
        />
      )}
    </div>
  );
}
