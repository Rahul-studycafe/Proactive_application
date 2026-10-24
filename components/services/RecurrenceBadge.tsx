"use client";

import { Calendar, Clock, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface RecurrenceBadgeProps {
  frequency?: string | { type?: string };
  isRecurring?: boolean;
  className?: string;
  showTooltip?: boolean;
}

export function RecurrenceBadge({
  frequency,
  isRecurring = true,
  className = "",
  showTooltip = true,
}: RecurrenceBadgeProps) {
  const rawType =
    typeof frequency === "string"
      ? frequency
      : frequency?.type || (isRecurring ? "monthly" : "one_time");

  const normalized = rawType.toLowerCase().replace(/-/g, "_");

  let label = "One-Time";
  let badgeStyle =
    "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300";
  let icon = <Clock className="mr-1 h-3 w-3" />;
  let tooltipText = "Single non-recurring task";

  if (normalized === "monthly") {
    label = "Monthly";
    badgeStyle =
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    icon = <Calendar className="mr-1 h-3 w-3 text-blue-500" />;
    tooltipText = "Automated task spawns on 1st of every month";
  } else if (normalized.includes("quarter") || normalized === "quarterly") {
    label = normalized.includes("fy") ? "Quarterly (Indian FY)" : "Quarterly";
    badgeStyle =
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    icon = <RefreshCw className="mr-1 h-3 w-3 text-emerald-500" />;
    tooltipText = "Automated task spawns on the 1st day of every quarter";
  } else if (normalized.includes("half") || normalized === "half_yearly") {
    label = "Half-Yearly";
    badgeStyle =
      "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400";
    icon = <RefreshCw className="mr-1 h-3 w-3 text-purple-500" />;
    tooltipText = "Automated task spawns semi-annually";
  } else if (normalized === "yearly" || normalized === "annual") {
    label = "Yearly";
    badgeStyle =
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    icon = <Zap className="mr-1 h-3 w-3 text-amber-500" />;
    tooltipText = "Automated task spawns annually at fiscal start";
  }

  const badgeElement = (
    <Badge
      variant="outline"
      className={`inline-flex items-center text-[11px] font-medium transition-colors ${badgeStyle} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </Badge>
  );

  if (!showTooltip) return badgeElement;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{label} Recurrence</p>
          <p className="text-muted-foreground">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
