"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Users,
  Check,
  Ban,
  Clock,
} from "lucide-react";
import {
  useTriggerTaskAutomationMutation,
  useGetClientsQuery,
  useGetServicesQuery,
} from "@/lib/services/api";
import { TriggerAutomationResult } from "@/lib/types/automation";
import { toast } from "sonner";

interface TriggerAutomationModalProps {
  triggerButton?: React.ReactNode;
  clientId?: string;
  clientName?: string;
}

export function TriggerAutomationModal({
  triggerButton,
  clientId,
  clientName,
}: TriggerAutomationModalProps) {
  const [open, setOpen] = useState(false);
  const [triggerAutomation, { isLoading }] = useTriggerTaskAutomationMutation();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<TriggerAutomationResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const { data: clientsRes } = useGetClientsQuery(undefined);
  const { data: servicesRes } = useGetServicesQuery(undefined);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = clientsRes?.clients || (Array.isArray(clientsRes) ? clientsRes : []);
    list.forEach((c: any) => {
      if (c._id) map.set(String(c._id), c.name);
    });
    return map;
  }, [clientsRes]);

  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = Array.isArray(servicesRes) ? servicesRes : [];
    list.forEach((s: any) => {
      if (s._id) map.set(String(s._id), s.name);
    });
    return map;
  }, [servicesRes]);

  // Handle live elapsed timer during execution
  useEffect(() => {
    if (isLoading) {
      setElapsedMs(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading]);

  const handleRun = async () => {
    try {
      setResult(null);
      const payload = clientId ? { clientId } : undefined;
      const res = await triggerAutomation(payload).unwrap();
      setResult(res);

      if (res.errors > 0) {
        toast.warning(
          `Automation completed with warnings: ${res.tasksCreated} created, ${res.errors} errors.`
        );
      } else {
        toast.success(
          `Automation executed: ${res.tasksCreated} task${
            res.tasksCreated === 1 ? "" : "s"
          } created (${res.tasksSkipped} skipped).`
        );
      }
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to trigger automation engine";
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setResult(null);
      setElapsedMs(0);
    }, 200);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && isLoading) return; // Prevent closing while running
        setOpen(val);
        if (!val) {
          setTimeout(() => {
            setResult(null);
            setElapsedMs(0);
          }, 200);
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2 shadow-sm">
            <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span>Trigger Automation</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Trigger Task Automation Engine
              </DialogTitle>
              <DialogDescription className="text-xs">
                Scan client recurring subscriptions and spawn tasks immediately.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {!result && !isLoading && (
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs text-muted-foreground leading-relaxed">
              <p>
                {clientName ? (
                  <>
                    Targeting client{" "}
                    <span className="font-semibold text-foreground">
                      {clientName}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    This scans all active client package and service subscriptions
                    for the current period.
                  </>
                )}
              </p>
              <p>
                The engine uses idempotent deduplication logic — already existing
                tasks for the current billing cadence will be automatically
                skipped.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Zap className="h-4 w-4 text-amber-500 absolute" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Running automation scan...</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Scanning subscriptions · Elapsed: {(elapsedMs / 1000).toFixed(1)}s
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2">
                  {result.errors === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="font-medium text-sm">Execution Completed</span>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  <Clock className="mr-1 h-3 w-3" />
                  {(elapsedMs / 1000).toFixed(2)}s
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border bg-muted/30 p-2.5">
                  <div className="text-xs text-muted-foreground">Scanned</div>
                  <div className="text-lg font-bold text-foreground mt-0.5">
                    {result.scannedClients}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Created
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.tasksCreated}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2.5">
                  <div className="text-xs text-muted-foreground">Skipped</div>
                  <div className="text-lg font-bold text-muted-foreground mt-0.5">
                    {result.tasksSkipped}
                  </div>
                </div>
                <div
                  className={`rounded-lg border p-2.5 ${
                    result.errors > 0
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs">Errors</div>
                  <div className="text-lg font-bold mt-0.5">{result.errors}</div>
                </div>
              </div>

              {result.details && result.details.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Items Processed ({result.details.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border bg-muted/20 divide-y text-xs">
                    {result.details.map((d: any, i: number) => {
                      const clientName =
                        (typeof d.clientId === "object" ? d.clientId?.name : null) ||
                        (d.clientName as string) ||
                        clientMap.get(String(d.clientId)) ||
                        "Client";

                      const serviceName =
                        (typeof d.serviceId === "object" ? d.serviceId?.name : null) ||
                        (d.serviceName as string) ||
                        serviceMap.get(String(d.serviceId)) ||
                        "Service";

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-foreground">
                              {clientName}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              · {serviceName}
                            </span>
                            <span className="text-[10px] text-muted-foreground/80 ml-1.5 font-mono">
                              [{d.period}]
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              d.status === "Created"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-[10px]"
                                : d.status === "Failed"
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-600 text-[10px]"
                                : "border-slate-500/30 bg-slate-500/10 text-slate-500 text-[10px]"
                            }
                          >
                            {d.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          {result ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => {
                  setOpen(false);
                  router.push("/tasks/automation/logs");
                }}
              >
                <span>View Full Audit Logs</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRun}
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Run Again
                </Button>
                <Button size="sm" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running Scan...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Run Engine Now
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
