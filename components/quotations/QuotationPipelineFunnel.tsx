"use client";

import { useMemo } from "react";
import {
  FileSpreadsheet,
  Send,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Percent,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetQuotationPipelineAnalyticsQuery } from "@/lib/services/api";
import { QuotationPipelineAnalytics } from "@/lib/types/quotation";

interface QuotationPipelineFunnelProps {
  initialData?: QuotationPipelineAnalytics;
  className?: string;
}

export function QuotationPipelineFunnel({
  initialData,
  className = "",
}: QuotationPipelineFunnelProps) {
  const { data, isLoading } = useGetQuotationPipelineAnalyticsQuery(undefined, {
    skip: !!initialData,
  });

  const analytics = initialData || data;

  const overview = analytics?.overview || {
    totalQuotations: 0,
    totalPipelineValue: 0,
    convertedCount: 0,
    convertedValue: 0,
    acceptedCount: 0,
    acceptedValue: 0,
    sentCount: 0,
    sentValue: 0,
    declinedCount: 0,
    declinedValue: 0,
    winRatePercentage: 0,
  };

  const formatCurrency = (val: number) => {
    return `₹${(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  if (isLoading && !analytics) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      >
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const total = Math.max(1, overview.totalQuotations);
  const winRate =
    overview.winRatePercentage ??
    (overview as any).conversionRatePercentage ??
    Math.round(
      ((overview.convertedCount + overview.acceptedCount) / total) * 100,
    );
  const sentPct = Math.round(
    ((overview.sentCount + overview.acceptedCount + overview.convertedCount) /
      total) *
      100,
  );
  const acceptedPct = Math.round(
    ((overview.acceptedCount + overview.convertedCount) / total) * 100,
  );
  const convertedPct = Math.round((overview.convertedCount / total) * 100);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Proposals */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Proposals
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                {overview.totalQuotations}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Valued at{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(overview.totalPipelineValue)}
                </span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Sent & In Pipeline */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sent to Clients
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
                {overview.sentCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active pipeline:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(overview.sentValue)}
                </span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Send className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Converted into Invoices */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Converted to Invoices
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-purple-600 dark:text-purple-400">
                {overview.convertedCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Billed value:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(overview.convertedValue)}
                </span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="border border-border/80 shadow-sm bg-card hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1 pr-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Win Rate
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {winRate}%
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({overview.convertedCount + overview.acceptedCount} /{" "}
                  {overview.totalQuotations || 0})
                </span>
              </div>
              <Progress
                value={winRate}
                className="h-1.5 mt-2 bg-emerald-500/20"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Pipeline Stage Funnel Strip */}
      <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Proposal Conversion Lifecycle
          </span>
          <span className="text-xs text-muted-foreground">
            {overview.acceptedCount} Accepted Pending Invoicing •{" "}
            {overview.declinedCount} Declined
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-500/10 border border-slate-500/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                1. Drafts
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {overview.totalQuotations -
                overview.sentCount -
                overview.acceptedCount -
                overview.convertedCount -
                overview.declinedCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-300">
                2. Dispatched
              </span>
            </div>
            <span className="font-bold text-blue-900 dark:text-blue-100">
              {overview.sentCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700 dark:text-emerald-300">
                3. Accepted
              </span>
            </div>
            <span className="font-bold text-emerald-900 dark:text-emerald-100">
              {overview.acceptedCount}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                4. Invoiced
              </span>
            </div>
            <span className="font-bold text-purple-900 dark:text-purple-100">
              {overview.convertedCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
