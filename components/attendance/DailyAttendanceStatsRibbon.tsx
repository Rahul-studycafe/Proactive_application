"use client";

import { Users, CheckCircle, Clock, CalendarOff, UserX, AlertCircle } from "lucide-react";
import type { DailyRosterSummary } from "@/lib/types/attendance";
import { Card, CardContent } from "@/components/ui/card";

export interface DailyAttendanceStatsRibbonProps {
  summary?: DailyRosterSummary;
  isLoading?: boolean;
}

export function DailyAttendanceStatsRibbon({
  summary,
  isLoading,
}: DailyAttendanceStatsRibbonProps) {
  const stats = [
    {
      title: "Total Staff",
      value: summary?.totalStaff ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Present",
      value: summary?.present ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Half Day",
      value: summary?.halfDay ?? 0,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      title: "On Leave",
      value: summary?.leave ?? 0,
      icon: CalendarOff,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Absent",
      value: summary?.absent ?? 0,
      icon: UserX,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      title: "Unmarked",
      value: summary?.unmarked ?? 0,
      icon: AlertCircle,
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="overflow-hidden border shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {isLoading ? (
                      <span className="inline-block h-6 w-8 animate-pulse rounded bg-muted" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
