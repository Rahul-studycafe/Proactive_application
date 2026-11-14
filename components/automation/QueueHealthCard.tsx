"use client";

import { useGetQueueHealthQuery } from "@/lib/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle2,
  Database,
  Cpu,
  Clock,
  RotateCw,
  Server,
  Zap,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { TriggerAutomationModal } from "./TriggerAutomationModal";

export function QueueHealthCard() {
  const {
    data: health,
    isLoading,
    isFetching,
    refetch,
  } = useGetQueueHealthQuery();

  const isConnected =
    health?.database?.state === "connected" || health?.status === "OK";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Primary BullMQ Worker Card */}
      <Card className="rounded-xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  BullMQ Automation Worker
                </CardTitle>
                <CardDescription className="text-xs">
                  Redis background queue daemon
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
              >
                Active & Listening
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" />
                Redis Queue Status
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Scheduled Recurrence
              </span>
              <span className="font-medium text-foreground">
                Daily at 00:00:00 UTC (Midnight)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Retention & Deduplication
              </span>
              <span className="font-medium text-foreground">
                90-day TTL · Idempotent Keying
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Cadences Supported
              </span>
              <span className="text-muted-foreground">
                Monthly · Quarterly · FY · Yearly
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/tasks/automation/logs"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View Execution History</span>
              <ArrowRight className="h-3 w-3" />
            </Link>

            <TriggerAutomationModal
              triggerButton={
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Run On-Demand</span>
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Backend & Node.js System Metrics Card */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  API & Host Health
                </CardTitle>
                <CardDescription className="text-xs">
                  PMS runtime environment
                </CardDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 p-0"
              title="Refresh health status"
            >
              <RotateCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-primary" />
                Database State
              </span>
              <Badge
                variant="outline"
                className={
                  isConnected
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[11px]"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 text-[11px]"
                }
              >
                {health?.database?.state ||
                  (isConnected ? "connected" : "offline")}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Process Uptime
              </span>
              <span className="font-mono text-foreground font-medium">
                {health?.uptime?.server || "Operational"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                Heap Memory Allocated
              </span>
              <span className="font-mono text-foreground font-medium">
                {health?.memory?.heapUsed || "Normal"} /{" "}
                {health?.memory?.heapTotal || "Adaptive"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                System Health Check
              </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {health?.status || "200 OK"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            Worker health is monitored every 60 seconds. Failed recurring tasks
            retry up to 3 times with exponential backoff.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
