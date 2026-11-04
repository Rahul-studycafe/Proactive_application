"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Users,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DebtorsAgingSummary } from "@/lib/types/report";

interface DebtorsAgingCardProps {
  summary: DebtorsAgingSummary;
  className?: string;
}

export function DebtorsAgingCard({
  summary,
  className = "",
}: DebtorsAgingCardProps) {
  const total = Math.max(1, summary.totalOutstanding);

  const pct0_30 = Math.round((summary.totalCurrent0_30 / total) * 100);
  const pct31_60 = Math.round((summary.totalOverdue31_60 / total) * 100);
  const pct61_90 = Math.round((summary.totalCritical61_90 / total) * 100);
  const pct90Plus = Math.max(0, 100 - pct0_30 - pct31_60 - pct61_90);

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 4 Colored Bucket Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 0-30 Days: Current */}
        <Card className="border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>0 – 30 Days (Current)</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-emerald-700 dark:text-emerald-300 font-mono">
                {formatCurrency(summary.totalCurrent0_30)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pct0_30}% of total receivables
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 31-60 Days: Attention */}
        <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                <span>31 – 60 Days (Attention)</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-amber-700 dark:text-amber-300 font-mono">
                {formatCurrency(summary.totalOverdue31_60)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pct31_60}% of total receivables
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 61-90 Days: Critical */}
        <Card className="border border-orange-500/30 bg-orange-500/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>61 – 90 Days (Critical)</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-orange-700 dark:text-orange-300 font-mono">
                {formatCurrency(summary.totalCritical61_90)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pct61_90}% of total receivables
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 90+ Days: Delinquent */}
        <Card className="border border-rose-500/30 bg-rose-500/5 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>90+ Days (Delinquent)</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-rose-700 dark:text-rose-300 font-mono">
                {formatCurrency(summary.totalDelinquent90Plus)}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pct90Plus}% of total receivables
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Debtors Aging Distribution Bar */}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Aging Distribution & Exposure
            </span>
            <span className="text-xs text-muted-foreground">
              ({summary.totalDebtorsCount} total debtors with pending balances)
            </span>
          </div>

          <div className="text-xs font-semibold text-foreground">
            Total Outstanding:{" "}
            <span className="font-mono text-primary font-bold text-sm">
              {formatCurrency(summary.totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/60">
          {pct0_30 > 0 && (
            <div
              style={{ width: `${pct0_30}%` }}
              title={`0-30 Days: ${pct0_30}%`}
              className="bg-emerald-500 transition-all duration-300"
            />
          )}
          {pct31_60 > 0 && (
            <div
              style={{ width: `${pct31_60}%` }}
              title={`31-60 Days: ${pct31_60}%`}
              className="bg-amber-500 transition-all duration-300"
            />
          )}
          {pct61_90 > 0 && (
            <div
              style={{ width: `${pct61_90}%` }}
              title={`61-90 Days: ${pct61_90}%`}
              className="bg-orange-500 transition-all duration-300"
            />
          )}
          {pct90Plus > 0 && (
            <div
              style={{ width: `${pct90Plus}%` }}
              title={`90+ Days: ${pct90Plus}%`}
              className="bg-rose-500 transition-all duration-300"
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>0-30 Days ({pct0_30}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>31-60 Days ({pct31_60}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span>61-90 Days ({pct61_90}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>90+ Days ({pct90Plus}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
