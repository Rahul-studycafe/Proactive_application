"use client";

import Link from "next/link";
import {
  Users,
  CheckSquare,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Loader2,
  AlertCircle,
  CreditCard,
  FileText,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetDashboardOverviewQuery } from "@/lib/services/api";

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
  const { data, isLoading } = useGetDashboardOverviewQuery(undefined);

  const quickStats = data?.quickStats || {
    totalClients: 0,
    pendingTasks: 0,
    overdueInvoices: 0,
    totalReceivables: 0,
  };

  const recentActivity = data?.recentActivity || {
    invoices: [],
    receipts: [],
    completedTasks: [],
  };

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
      delta: "In progress / review",
      tone: "text-amber-500",
      href: "/tasks",
    },
    {
      label: "Overdue Invoices",
      value: quickStats.overdueInvoices.toString(),
      icon: AlertCircle,
      delta: quickStats.overdueInvoices > 0 ? "Requires follow-up" : "All current",
      tone: quickStats.overdueInvoices > 0 ? "text-destructive" : "text-emerald-500",
      href: "/invoices",
    },
    {
      label: "Total Receivables",
      value: formatCurrency(quickStats.totalReceivables),
      icon: TrendingUp,
      delta: "Outstanding dues",
      tone: "text-emerald-500",
      href: "/receipts",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time practice overview across clients, tasks, invoices, and cash flow.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                href={c.href}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {c.label}
                  </span>
                  <Icon className={`h-4 w-4 ${c.tone}`} />
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">
                  {c.value}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.delta}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Grid: Recent Invoices & Recent Receipts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Invoices */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold">Latest Invoices</h2>
            </div>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recentActivity.invoices.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No invoices recorded yet.
              </div>
            ) : (
              recentActivity.invoices.map((inv: any) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/view-invoice/${inv._id}`}
                      className="font-mono text-sm font-semibold hover:underline text-foreground"
                    >
                      {inv.invoiceNo}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {inv.clientId?.name || "Client"} · {formatDate(inv.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold">
                      {formatCurrency(inv.totals?.grandTotal || 0)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-0.5 ${
                        inv.status === "Paid"
                          ? "border-success/30 bg-success/10 text-success"
                          : inv.status === "Partially Paid"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-500"
                          : "border-warning/30 bg-warning/10 text-warning"
                      }`}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Receipts */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Recent Payment Receipts</h2>
            </div>
            <Link
              href="/receipts"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recentActivity.receipts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No receipts recorded yet.
              </div>
            ) : (
              recentActivity.receipts.map((rct: any) => (
                <div
                  key={rct._id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {rct.receiptNo}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rct.clientId?.name || "Client"} · {formatDate(rct.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(rct.totalAmount)}
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {rct.paymentMode}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Completed Tasks Activity */}
      {recentActivity.completedTasks.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Recently Completed Tasks</h2>
            </div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recentActivity.completedTasks.map((t: any) => (
              <div
                key={t._id}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.clientId?.name || "Client"}
                  </div>
                </div>
                {t.billingAmount ? (
                  <div className="text-right font-mono text-xs font-medium text-muted-foreground">
                    {formatCurrency(t.billingAmount)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
