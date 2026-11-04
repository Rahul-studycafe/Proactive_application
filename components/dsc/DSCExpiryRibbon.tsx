"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useTriggerDscScanMutation } from "@/lib/services/api";
import { DSCKpiSummary } from "@/lib/types/dsc";

interface DSCExpiryRibbonProps {
  kpiData?: DSCKpiSummary;
  activeFilter: string;
  onFilterChange: (filter: {
    status?: string;
    expiringWithinDays?: number;
    label: string;
  }) => void;
}

export function DSCExpiryRibbon({
  kpiData,
  activeFilter,
  onFilterChange,
}: DSCExpiryRibbonProps) {
  const [triggerScan, { isLoading: isScanning }] = useTriggerDscScanMutation();

  const handleTriggerScan = async () => {
    try {
      const summary = await triggerScan().unwrap();
      toast.success(
        `Renewal scan completed: ${summary.tasksCreated} renewal task(s) auto-generated, ${summary.emailsDispatched} client alert(s) dispatched.`,
      );
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to execute expiry scan",
      );
    }
  };

  const filters = [
    {
      id: "all",
      label: "All Tokens",
      status: undefined,
      expiringWithinDays: undefined,
      count: kpiData?.total,
      color: "bg-muted text-foreground",
    },
    {
      id: "exp-7",
      label: "Expiring in 7 Days",
      status: undefined,
      expiringWithinDays: 7,
      icon: AlertTriangle,
      color:
        "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
    },
    {
      id: "exp-15",
      label: "Expiring in 15 Days",
      status: undefined,
      expiringWithinDays: 15,
      icon: Clock,
      color:
        "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
    },
    {
      id: "exp-30",
      label: "Expiring in 30 Days",
      status: undefined,
      expiringWithinDays: 30,
      count: kpiData?.expiringIn30Days,
      icon: Clock,
      color:
        "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
    },
    {
      id: "in-office",
      label: "In Office",
      status: "In Office",
      expiringWithinDays: undefined,
      count: kpiData?.inOffice,
      icon: CheckCircle2,
      color:
        "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    },
    {
      id: "with-client",
      label: "With Client",
      status: "With Client",
      expiringWithinDays: undefined,
      count: kpiData?.withClient,
      icon: Building2,
      color:
        "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
    },
    {
      id: "expired",
      label: "Expired",
      status: "Expired",
      expiringWithinDays: undefined,
      count: kpiData?.expired,
      icon: ShieldAlert,
      color:
        "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 border rounded-lg p-2.5">
      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-xs font-semibold text-muted-foreground mr-1">
          Quick Filters:
        </span>
        {filters.map((f) => {
          const isSelected = activeFilter === f.id;
          const Icon = f.icon;

          return (
            <button
              key={f.id}
              onClick={() =>
                onFilterChange({
                  status: f.status,
                  expiringWithinDays: f.expiringWithinDays,
                  label: f.id,
                })
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              <span>{f.label}</span>
              {typeof f.count === "number" && (
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1-Click Renewal Task Trigger (F-75) */}
      <div className="shrink-0 flex items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTriggerScan}
          disabled={isScanning}
          className="text-xs gap-1.5 h-8 border-primary/30 hover:bg-primary/10 hover:text-primary font-medium"
        >
          {isScanning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          )}
          <span>Scan & Auto-Renew Tasks</span>
        </Button>
      </div>
    </div>
  );
}
