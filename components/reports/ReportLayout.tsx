"use client";

import { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

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
      {/* Top Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: "Reports", href: "/reports", icon: BarChart3 },
          { label: title },
        ]}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
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

