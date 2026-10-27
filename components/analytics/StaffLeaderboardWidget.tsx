"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Award,
  Loader2,
  TrendingUp,
  User,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import { StaffPerformanceItem } from "@/lib/types/analytics";
import { useGetStaffPerformanceQuery } from "@/lib/services/api";

type PeriodFilter = "this_month" | "quarter" | "year";

interface StaffLeaderboardWidgetProps {
  data?: StaffPerformanceItem[];
  isLoading?: boolean;
}

export function StaffLeaderboardWidget({
  data: propData,
  isLoading: propLoading,
}: StaffLeaderboardWidgetProps) {
  const [period, setPeriod] = useState<PeriodFilter>("this_month");
  const [showFullTable, setShowFullTable] = useState(false);

  // Compute from/to dates based on period
  const queryDates = useMemo(() => {
    const now = new Date();
    if (period === "this_month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from };
    } else if (period === "quarter") {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      return { from };
    } else {
      // Indian FY starts on April 1st
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed
      const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      const from = new Date(fyStartYear, 3, 1).toISOString();
      return { from };
    }
  }, [period]);

  const { data: fetchedData, isLoading: queryLoading } = useGetStaffPerformanceQuery(
    propData ? undefined : queryDates,
    { skip: !!propData }
  );

  const rawData = propData || fetchedData || [];
  const isLoading = propLoading !== undefined ? propLoading : queryLoading;

  const topThree = rawData.slice(0, 3);
  const remainingStaff = showFullTable ? rawData.slice(3) : rawData.slice(3, 8);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="rounded-xl border shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Staff Performance Leaderboard
              </CardTitle>
             
            </div>
          </div>

          {/* Period Filter Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-[11px] self-start sm:self-auto">
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                period === "this_month"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("quarter")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                period === "quarter"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                period === "year"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              FY
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rawData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground space-y-2">
            <Trophy className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs">No task completion records in this period</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium Display */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {/* 2nd Place */}
              {topThree[1] ? (
                <div className="flex flex-col items-center text-center p-3 rounded-xl border border-slate-300/40 bg-slate-500/5 dark:border-slate-700/50 relative">
                  <div className="absolute -top-2.5 flex items-center justify-center h-5 px-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-300">
                    <Medal className="h-3 w-3 mr-0.5" /> #2
                  </div>
                  <Avatar className="h-10 w-10 mt-1 border border-slate-300/50">
                    <AvatarFallback className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold">
                      {getInitials(topThree[1].name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs mt-1.5 truncate max-w-full">
                    {topThree[1].name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {topThree[1].completed}/{topThree[1].totalAssigned} done
                  </span>
                  <Badge
                    variant="outline"
                    className="mt-1 text-[10px] font-mono border-slate-400/30 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                  >
                    {topThree[1].completionPercentage}%
                  </Badge>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10" />
              )}

              {/* 1st Place (Gold Podium - Elevated) */}
              {topThree[0] ? (
                <div className="flex flex-col items-center text-center p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 relative shadow-sm">
                  <div className="absolute -top-2.5 flex items-center justify-center h-5 px-2 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs">
                    <Trophy className="h-3 w-3 mr-1 fill-amber-200" /> #1 Champion
                  </div>
                  <Avatar className="h-12 w-12 mt-1 border-2 border-amber-500/60 ring-2 ring-amber-500/20">
                    <AvatarFallback className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-sm">
                      {getInitials(topThree[0].name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-xs mt-1.5 text-foreground truncate max-w-full">
                    {topThree[0].name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {topThree[0].completed}/{topThree[0].totalAssigned} tasks done
                  </span>
                  <Badge
                    variant="outline"
                    className="mt-1 text-[11px] font-mono font-bold border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/15"
                  >
                    {topThree[0].completionPercentage}%
                  </Badge>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10" />
              )}

              {/* 3rd Place */}
              {topThree[2] ? (
                <div className="flex flex-col items-center text-center p-3 rounded-xl border border-amber-700/30 bg-amber-900/5 relative">
                  <div className="absolute -top-2.5 flex items-center justify-center h-5 px-1.5 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 text-[10px] font-bold border border-amber-700/30">
                    <Award className="h-3 w-3 mr-0.5" /> #3
                  </div>
                  <Avatar className="h-10 w-10 mt-1 border border-amber-700/30">
                    <AvatarFallback className="bg-amber-800/10 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                      {getInitials(topThree[2].name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-xs mt-1.5 truncate max-w-full">
                    {topThree[2].name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {topThree[2].completed}/{topThree[2].totalAssigned} done
                  </span>
                  <Badge
                    variant="outline"
                    className="mt-1 text-[10px] font-mono border-amber-700/30 text-amber-800 dark:text-amber-400 bg-amber-700/10"
                  >
                    {topThree[2].completionPercentage}%
                  </Badge>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10" />
              )}
            </div>

            {/* Ranked Table for Subsequent Performers */}
            {remainingStaff.length > 0 && (
              <div className="rounded-lg border divide-y overflow-hidden text-xs">
                {remainingStaff.map((staff) => (
                  <div
                    key={String(staff.userId)}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 font-mono text-[11px] font-medium text-muted-foreground text-center">
                        #{staff.rank}
                      </span>
                      <Avatar className="h-7 w-7 border">
                        <AvatarFallback className="text-[10px] font-medium bg-muted">
                          {getInitials(staff.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <div className="font-medium text-foreground truncate">
                          {staff.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {staff.completed} of {staff.totalAssigned} completed
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 hidden sm:block">
                        <Progress
                          value={staff.completionPercentage}
                          className="h-1.5"
                        />
                      </div>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px] w-12 justify-center"
                      >
                        {staff.completionPercentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rawData.length > 8 && (
              <div className="text-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullTable(!showFullTable)}
                  className="text-xs text-primary hover:underline h-7"
                >
                  {showFullTable
                    ? "Show Top Performers Only"
                    : `View All ${rawData.length} Staff Rankings`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
