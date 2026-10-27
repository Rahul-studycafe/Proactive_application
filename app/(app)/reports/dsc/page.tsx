"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDscRenewalsReportQuery, useGetClientsQuery } from "@/lib/services/api";
import { ReportLayout } from "@/components/reports";

export default function DscRenewalsReportPage() {
  const [daysHorizon, setDaysHorizon] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: clientsData } = useGetClientsQuery({ limit: 150 });
  const clients = clientsData?.clients || [];

  const queryParams = useMemo(() => {
    return {
      days: daysHorizon !== "all" ? daysHorizon : undefined,
      clientId: selectedClientId !== "all" ? selectedClientId : undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      page,
      limit,
    };
  }, [daysHorizon, selectedClientId, selectedStatus, page]);

  const { data, isLoading, isFetching, refetch } =
    useGetDscRenewalsReportQuery(queryParams);

  const summary = data?.summary || {
    totalTokens: 0,
    expiringIn30Days: 0,
    expiringIn60Days: 0,
    expiringIn90Days: 0,
    expiringIn180Days: 0,
    expired: 0,
  };

  const tokens = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ReportLayout
      title="DSC Renewals Timeline Report"
      subtitle="Track digital signature token expirations across compliance horizons to preempt filing bottlenecks."
      activeCategory="Operational"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
            <Link href="/dsc">
              DSC Register <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Expiry Horizon KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Tokens */}
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total DSC Tokens
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {summary.totalTokens}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active in practice custody
              </p>
            </CardContent>
          </Card>

          {/* Expiring in 30 Days */}
          <Card className="border border-rose-500/30 bg-rose-500/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                ≤ 30 Days
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300 mt-1 font-mono">
                {summary.expiringIn30Days}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Urgent renewal required
              </p>
            </CardContent>
          </Card>

          {/* Expiring in 60 Days */}
          <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                31 – 60 Days
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300 mt-1 font-mono">
                {summary.expiringIn60Days}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upcoming renewal notice
              </p>
            </CardContent>
          </Card>

          {/* Expiring in 90 Days */}
          <Card className="border border-blue-500/30 bg-blue-500/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                61 – 90 Days
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-blue-700 dark:text-blue-300 mt-1 font-mono">
                {summary.expiringIn90Days}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quarterly renewal buffer
              </p>
            </CardContent>
          </Card>

          {/* Expired */}
          <Card className="border border-destructive/30 bg-destructive/5 shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
                Already Expired
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-destructive mt-1 font-mono">
                {summary.expired}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inactive / non-compliant
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Horizon Filter */}
            <div className="w-36">
              <Select
                value={daysHorizon}
                onValueChange={(val) => {
                  setDaysHorizon(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Horizon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Horizons</SelectItem>
                  <SelectItem value="30">Within 30 Days</SelectItem>
                  <SelectItem value="60">Within 60 Days</SelectItem>
                  <SelectItem value="90">Within 90 Days</SelectItem>
                  <SelectItem value="180">Within 180 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="w-48">
              <Select
                value={selectedClientId}
                onValueChange={(val) => {
                  setSelectedClientId(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-36">
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Handed Over">Handed Over</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(daysHorizon !== "all" || selectedClientId !== "all" || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDaysHorizon("all");
                setSelectedClientId("all");
                setSelectedStatus("all");
                setPage(1);
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Tokens Table */}
        <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 text-xs">
                <TableRow>
                  <TableHead className="w-[30%] min-w-[200px]">Token Holder & Client</TableHead>
                  <TableHead className="w-[20%] min-w-[150px]">Current Location / Custody</TableHead>
                  <TableHead className="w-[18%] min-w-[120px]">Expiry Date</TableHead>
                  <TableHead className="w-[18%] min-w-[120px] text-center">Days Remaining</TableHead>
                  <TableHead className="w-[14%] min-w-[100px] text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                        <KeyRound className="h-8 w-8 text-muted-foreground/60" />
                        <h4 className="font-semibold text-foreground">
                          No DSC Tokens Found
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          No digital signature tokens match the selected horizon criteria.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((tok) => {
                    const isExp = tok.daysRemaining <= 0;
                    const isUrgent = tok.daysRemaining > 0 && tok.daysRemaining <= 30;

                    return (
                      <TableRow key={tok._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {tok.currentHolderName || "Authorized Signatory"}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {tok.client?.name || "Client Name"}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <span className="text-muted-foreground">
                            Office Vault / Safe Box
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-muted-foreground">
                          {formatDate(tok.expiryDate)}
                        </TableCell>

                        <TableCell className="text-center font-mono">
                          {isExp ? (
                            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-bold">
                              Expired
                            </Badge>
                          ) : isUrgent ? (
                            <Badge variant="outline" className="border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-[10px] font-bold">
                              {tok.daysRemaining} days left
                            </Badge>
                          ) : tok.daysRemaining <= 60 ? (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">
                              {tok.daysRemaining} days left
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-semibold">
                              {tok.daysRemaining} days
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              tok.status === "Active"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                            }`}
                          >
                            {tok.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-3.5 border-t border-border/80 text-xs text-muted-foreground">
              <div>
                Showing page <span className="font-semibold text-foreground">{pagination.page}</span> of{" "}
                <span className="font-semibold text-foreground">{pagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ReportLayout>
  );
}
