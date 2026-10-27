"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CreditCard,
  FileText,
  CheckCircle2,
  CalendarCheck,
  Zap,
  Palmtree,
  ArrowRight,
  Receipt,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetDashboardOverviewQuery, useGetExpenseAnalyticsQuery } from "@/lib/services/api";
import { ClientEntityDonutChart } from "@/components/analytics/ClientEntityDonutChart";
import { StaffLeaderboardWidget } from "@/components/analytics/StaffLeaderboardWidget";
import { AttendanceKPIWidget } from "@/components/analytics/AttendanceKPIWidget";
import { TriggerAutomationModal } from "@/components/automation/TriggerAutomationModal";
import { format } from "date-fns";

function formatCurrency(amount: number) {
  return `₹${(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string | Date) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardOverviewQuery();
  const { data: expenseStats } = useGetExpenseAnalyticsQuery();

  const expOverview = expenseStats?.overview || {
    totalExpenseAmount: 0,
    billedExpenseAmount: 0,
    unbilledExpenseAmount: 0,
    recoveryRatePercentage: 0,
    count: 0,
  };

  const quickStats = data?.quickStats || {
    totalClients: 0,
    pendingTasks: 0,
    overdueInvoices: 0,
    totalReceivables: 0,
    totalUnbilled: 0,
  };

  const attendanceOverview = data?.attendanceOverview;
  const recentActivity = data?.recentActivity || {
    invoices: [],
    receipts: [],
    completedTasks: [],
  };
  const upcomingHolidays = data?.upcomingHolidays || [];

  const cards = [
    {
      label: "Active Clients",
      value: quickStats.totalClients.toString(),
      icon: Users,
      delta: "Practice clientele",
      tone: "text-primary",
      href: "/clients",
    },
    {
      label: "Pending Tasks",
      value: quickStats.pendingTasks.toString(),
      icon: CheckSquare,
      delta: quickStats.pendingTasks > 0 ? "In progress & review" : "All tasks clear",
      tone: "text-amber-500",
      href: "/tasks",
    },
    {
      label: "Total Receivables",
      value: formatCurrency(quickStats.totalReceivables),
      icon: TrendingUp,
      delta: quickStats.overdueInvoices > 0 ? `${quickStats.overdueInvoices} overdue bills` : "Collections healthy",
      tone: "text-emerald-500",
      href: "/receipts",
    },
    {
      label: "Team Attendance",
      value: `${attendanceOverview?.presenceRate ?? 0}%`,
      icon: CalendarCheck,
      delta: attendanceOverview ? `${attendanceOverview.presentToday}/${attendanceOverview.totalStaff} present` : "Live presence rate",
      tone: "text-teal-500",
      href: "/attendance",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Unified practice management, attendance operations & business intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/attendance">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Daily Desk</span>
            </Button>
          </Link>
          <TriggerAutomationModal />
        </div>
      </div>

      {/* Upcoming Holiday Banner (if within next 14 days) */}
      {upcomingHolidays.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-800 dark:text-sky-300">
          <div className="flex items-center gap-2">
            <Palmtree className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>
              Upcoming Office Holiday:{" "}
              <strong className="font-semibold text-foreground">
                {upcomingHolidays[0].name}
              </strong>{" "}
              ({format(new Date(upcomingHolidays[0].date), "dd MMM yyyy")})
            </span>
          </div>
          <Link
            href="/settings/holidays"
            className="font-medium hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View Calendar</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* 1. Quick Stats Ribbon (4 Cards) */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex h-28 items-center justify-center rounded-xl border bg-card animate-pulse"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                href={c.href}
                className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.label}
                  </span>
                  <div className="p-2 rounded-lg bg-muted/60">
                    <Icon className={`h-4 w-4 ${c.tone}`} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {c.value}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[11px]">{c.delta}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Practice Outlays KPI & Expense Summary Bar (F-105) */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span>Practice Outlays & Reimbursables</span>
                {expOverview.count > 0 && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                    {expOverview.count} records
                  </Badge>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Government challans, court stampings, and client-reimbursable expenses
              </p>
            </div>
          </div>
          <Link
            href="/expenses"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Master Outlays Directory</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/20">
            <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground">
                {formatCurrency(expOverview.totalExpenseAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Total Outlays
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/20">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatCurrency(expOverview.billedExpenseAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Billed Recoveries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/20">
            <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {formatCurrency(expOverview.unbilledExpenseAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Unbilled Exposure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-muted/20">
            <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {expOverview.recoveryRatePercentage}%
              </p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Recovery Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row Grid: Unified Activity Feed (60%) + Attendance KPI Ring (40%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Unified Practice Activity Feed (7 Columns / ~60%) */}
        <div className="rounded-xl border bg-card shadow-sm lg:col-span-7 flex flex-col">
          <Tabs defaultValue="invoices" className="w-full">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="invoices" className="text-xs">
                  Invoices ({recentActivity.invoices.length})
                </TabsTrigger>
                <TabsTrigger value="receipts" className="text-xs">
                  Receipts ({recentActivity.receipts.length})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  Completed Tasks ({recentActivity.completedTasks.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="m-0 divide-y">
              {recentActivity.invoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No recent invoices recorded.
                </div>
              ) : (
                recentActivity.invoices.map((inv: any) => (
                  <div
                    key={inv._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <Link
                        href={`/view-invoice/${inv._id}`}
                        className="font-mono text-xs font-semibold hover:underline text-foreground block truncate"
                      >
                        {inv.invoiceNo}
                      </Link>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {inv.clientId?.name || "Client"} · {formatDate(inv.date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-semibold">
                        {formatCurrency(inv.totals?.grandTotal || 0)}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] mt-0.5 ${
                          inv.status === "Paid"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : inv.status === "Partially Paid"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Receipts Tab */}
            <TabsContent value="receipts" className="m-0 divide-y">
              {recentActivity.receipts.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No payment receipts recorded yet.
                </div>
              ) : (
                recentActivity.receipts.map((rct: any) => (
                  <div
                    key={rct._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-mono text-xs font-semibold text-foreground truncate">
                        {rct.receiptNo}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {rct.clientId?.name || "Client"} · {formatDate(rct.date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(rct.totalAmount)}
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-0.5 font-normal">
                        {rct.paymentMode}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Completed Tasks Tab */}
            <TabsContent value="tasks" className="m-0 divide-y">
              {recentActivity.completedTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No recently completed tasks.
                </div>
              ) : (
                recentActivity.completedTasks.map((t: any) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium text-foreground truncate">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {t.clientId?.name || "Client"}
                      </div>
                    </div>
                    {t.billingAmount ? (
                      <div className="text-right font-mono text-xs font-medium text-muted-foreground shrink-0">
                        {formatCurrency(t.billingAmount)}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>

          <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs">
            <span className="text-muted-foreground text-[11px]">
              Showing latest 5 entries per stream
            </span>
            <Link
              href="/invoices"
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View Invoices & Receipts</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Attendance KPI Widget (5 Columns / ~40%) */}
        <div className="lg:col-span-5">
          <AttendanceKPIWidget
            data={attendanceOverview}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 3. Bottom Row Grid: Client Entity Donut (50%) + Staff Leaderboard (50%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        <ClientEntityDonutChart
          data={data?.clientDistribution}
          isLoading={isLoading}
        />

        <StaffLeaderboardWidget
          data={data?.staffLeaderboard}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
