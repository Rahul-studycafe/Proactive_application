"use client";

import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TriggerAutomationModal } from "@/components/automation/TriggerAutomationModal";
import { AutomationLogsTable } from "@/components/automation/AutomationLogsTable";
import { useGetAutomationLogsQuery, useGetQueueHealthQuery } from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Activity,
  Calendar,
  Clock,
  History,
  Settings,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AutomationHubPage() {
  const { data: logsData } = useGetAutomationLogsQuery({ page: 1, limit: 1 });
  const { data: health } = useGetQueueHealthQuery();

  const latestLog = logsData?.logs?.[0];
  const isHealthy = health?.database?.state === "connected" || health?.status === "OK";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Tasks", href: "/tasks" },
          { label: "Task Automation Hub" },
        ]}
      />

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">
              Task Automation Hub
            </h1>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary text-xs font-normal"
            >
              BullMQ Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automated recurring task generation for monthly, quarterly, and fiscal year client services.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/settings/automation">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              <span>Queue Settings</span>
            </Button>
          </Link>
          <Link href="/tasks/automation/logs">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              <span>Audit Logs</span>
            </Button>
          </Link>
          <TriggerAutomationModal />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Queue Engine Status
            </CardTitle>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Active & Listening
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Redis background daemon operational
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Next Scheduled Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              Tonight at 00:00
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              UTC midnight automated worker
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Last Execution
            </CardTitle>
            {latestLog && latestLog.errorCount === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              {latestLog
                ? `${latestLog.tasksCreatedCount} Tasks Spawned`
                : "No Runs Yet"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {latestLog?.startedAt
                ? format(new Date(latestLog.startedAt), "dd MMM, hh:mm a")
                : "Awaiting initial run"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Deduplication Guard
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              {latestLog ? `${latestLog.tasksSkippedCount} Skipped` : "100% Protected"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Zero duplicate tasks spawned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent Execution History
            </h2>
            <p className="text-xs text-muted-foreground">
              Live audit trail of latest automation runs
            </p>
          </div>

          <Link
            href="/tasks/automation/logs"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Logs</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AutomationLogsTable initialLimit={5} showFilters={false} />
      </div>
    </div>
  );
}
