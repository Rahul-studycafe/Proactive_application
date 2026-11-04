"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  PieChart as PieChartIcon,
  Users,
  Building2,
} from "lucide-react";
import { ClientEntityDistributionItem } from "@/lib/types/analytics";
import { useGetClientDistributionQuery } from "@/lib/services/api";

const ENTITY_COLOR_MAP: Record<string, string> = {
  "Private Limited": "#4F46E5", // Deep Indigo
  "Sole Proprietorship": "#10B981", // Emerald
  LLP: "#F59E0B", // Amber
  "Limited Liability Partnership": "#F59E0B",
  Individual: "#06B6D4", // Cyan
  Partnership: "#8B5CF6", // Violet
  "Partnership Firm": "#8B5CF6",
  HUF: "#EC4899", // Pink
  Trust: "#14B8A6", // Teal
  Society: "#F97316", // Orange
  Other: "#64748B", // Slate
};

const FALLBACK_PALETTE = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#64748B",
];

interface ClientEntityDonutChartProps {
  data?: ClientEntityDistributionItem[];
  isLoading?: boolean;
}

export function ClientEntityDonutChart({
  data: propData,
  isLoading: propLoading,
}: ClientEntityDonutChartProps) {
  const { data: fetchedData, isLoading: queryLoading } =
    useGetClientDistributionQuery(undefined, { skip: !!propData });

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rawData = propData || fetchedData || [];
  const isLoading = propLoading !== undefined ? propLoading : queryLoading;

  const totalClients = useMemo(() => {
    return rawData.reduce((acc, item) => acc + (item.count || 0), 0);
  }, [rawData]);

  const chartData = useMemo(() => {
    return rawData.map((item, idx) => {
      const color =
        ENTITY_COLOR_MAP[item.entityType] ||
        FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
      return {
        name: item.entityType || "Other",
        value: item.count,
        percentage: item.percentage,
        color,
      };
    });
  }, [rawData]);

  return (
    <Card className="rounded-xl border shadow-sm flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Client Portfolio Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Active practice clients categorized by legal entity
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-medium border-primary/20 bg-primary/5 text-primary"
          >
            {totalClients} {totalClients === 1 ? "Client" : "Clients"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground space-y-2">
            <PieChartIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs">No active client entity data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart Container */}
            <div className="relative h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-popover/95 backdrop-blur-sm p-2.5 shadow-md text-xs">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: d.color }}
                              />
                              <span>{d.name}</span>
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-4 text-muted-foreground">
                              <span>Total Clients:</span>
                              <span className="font-semibold text-foreground">
                                {d.value}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-muted-foreground">
                              <span>Share:</span>
                              <span className="font-semibold text-indigo-500">
                                {d.percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="transparent"
                        opacity={
                          activeIndex === null || activeIndex === index
                            ? 1
                            : 0.6
                        }
                        className="transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Hole Total Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {totalClients}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Clients
                </span>
              </div>
            </div>

            {/* Interactive Grid Legend */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t">
              {chartData.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    activeIndex === idx ? "bg-muted/70" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-muted-foreground text-[11px] font-medium">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                    <span className="font-semibold text-foreground">
                      {item.value}
                    </span>
                    <span className="text-muted-foreground/80 font-mono text-[10px]">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
