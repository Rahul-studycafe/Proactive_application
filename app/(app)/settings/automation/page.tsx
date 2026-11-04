"use client";

import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { QueueHealthCard } from "@/components/automation/QueueHealthCard";
import { TriggerAutomationModal } from "@/components/automation/TriggerAutomationModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Zap, ShieldCheck, History, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AutomationSettingsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Automation & Queue Settings" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Automation & Queue Settings
            </h1>
            <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure BullMQ background task workers, inspect Redis queue
            status, and run manual generation cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tasks/automation/logs">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <History className="h-4 w-4" />
              <span>Audit Logs</span>
            </Button>
          </Link>
          <TriggerAutomationModal />
        </div>
      </div>

      {/* Real-time Health Monitor Cards */}
      <QueueHealthCard />

      {/* Engine Configuration & Policies */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Task Generation Engine Policies
          </CardTitle>
          <CardDescription className="text-xs">
            Standard operating rules enforced across all automated runs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold text-foreground text-xs">
                Idempotency Protection
              </div>
              <p>
                Each generated task is assigned a unique period key (e.g.{" "}
                <code className="text-[10px] font-mono text-primary">
                  2026-10
                </code>
                ). Duplicate tasks are guaranteed to never be spawned twice.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold text-foreground text-xs">
                Recurrence Cadences
              </div>
              <p>
                Supports Monthly (1st of month), Calendar Quarterly
                (Jan/Apr/Jul/Oct), Indian Fiscal Quarter (Apr/Jul/Oct/Jan), and
                Yearly schedules.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <div className="font-semibold text-foreground text-xs">
                Audit Trail Guarantee
              </div>
              <p>
                Every automated run generates an immutable audit record
                containing itemized counts, client references, and execution
                durations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
