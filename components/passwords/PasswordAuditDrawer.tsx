"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetPasswordAuditLogsQuery } from "@/lib/services/api";
import {
  ShieldCheck,
  Clock,
  User,
  Globe,
  RefreshCw,
  KeyRound,
  FileText,
  AlertCircle,
} from "lucide-react";

interface PasswordAuditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  passwordId?: string;
  portalName?: string;
}

export function PasswordAuditDrawer({
  open,
  onOpenChange,
  clientId,
  passwordId,
  portalName,
}: PasswordAuditDrawerProps) {
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetPasswordAuditLogsQuery(
    {
      clientId: clientId || undefined,
      passwordId: passwordId || undefined,
      limit: 50,
    },
    {
      skip: !open,
    }
  );

  const logs = data?.logs || [];
  const total = data?.total || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background border-l border-border/80 shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950/20 via-background to-background p-6 border-b border-border/60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                  Security Access Audit Trail
                  <Badge variant="outline" className="text-xs font-semibold">
                    {total} Events
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  {portalName
                    ? `Chronological access history for ${portalName}`
                    : "Chronological log of staff decrypting client passwords"}
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh logs"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border/60 space-y-2.5 bg-muted/20 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                <KeyRound className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">No Access Logs Recorded</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                No staff members have revealed or decrypted credentials for this client yet.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-border/60 ml-3 space-y-6 pl-5 py-2">
              {logs.map((log) => {
                const dateObj = new Date(log.accessedAt);
                const formattedDate = dateObj.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div key={log._id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary ring-4 ring-background" />

                    <div className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all shadow-sm space-y-3">
                      {/* Top row: User & Timestamp */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {log.accessedByUserId?.name ? log.accessedByUserId.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {log.accessedByUserId?.name || "Staff User"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {log.accessedByUserId?.email}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-medium text-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formattedTime}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      {/* Portal & Username Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-muted/40 border border-border/50">
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Portal Accessed
                          </span>
                          <p className="font-semibold text-foreground truncate">
                            {log.portalName}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Username
                          </span>
                          <p className="font-mono text-foreground truncate">
                            {log.username}
                          </p>
                        </div>
                      </div>

                      {/* Stated Purpose */}
                      {log.purpose && (
                        <div className="text-xs flex items-start gap-1.5 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground font-medium">Reason:</span>
                          <span className="italic">{log.purpose}</span>
                        </div>
                      )}

                      {/* IP and Agent metadata */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          IP: <code className="font-mono">{log.ipAddress || "Unknown"}</code>
                        </span>
                        {log.userAgent && (
                          <span className="truncate max-w-[240px]" title={log.userAgent}>
                            • {log.userAgent.includes("Chrome") ? "Chrome" : log.userAgent.includes("Firefox") ? "Firefox" : "Browser"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
