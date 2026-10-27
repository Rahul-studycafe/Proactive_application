"use client";

import { ReactNode } from "react";
import { BarChart3, ChevronRight } from "lucide-react";

interface ReportLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  activeCategory?: "Operational" | "Financial";
}

export function ReportLayout({
  children,
  title,
  subtitle,
  actions,
}: ReportLayoutProps) {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1 font-medium">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>Reports</span>
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">{title}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
            {subtitle}
          </p>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}

