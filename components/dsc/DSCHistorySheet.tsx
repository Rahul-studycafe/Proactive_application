"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  KeyRound,
} from "lucide-react";
import { useGetDscHistoryQuery } from "@/lib/services/api";
import { DSCItem } from "@/lib/types/dsc";

interface DSCHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dsc: DSCItem | null;
}

export function DSCHistorySheet({
  open,
  onOpenChange,
  dsc,
}: DSCHistorySheetProps) {
  const {
    data: history = [],
    isLoading,
    isFetching,
  } = useGetDscHistoryQuery(dsc?._id || "", {
    skip: !dsc || !open,
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "Handed to Client":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400">
            <Building2 className="mr-1 h-3 w-3" /> Handed to Client
          </Badge>
        );
      case "Received from Client":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Received from Client
          </Badge>
        );
      case "Internal Transfer":
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400">
            <ArrowRightLeft className="mr-1 h-3 w-3" /> Internal Transfer
          </Badge>
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 text-primary">
            <KeyRound className="h-5 w-5" />
            <SheetTitle>Custody Movement History</SheetTitle>
          </div>
          <SheetDescription>
            Audit trail of handovers and physical possession for{" "}
            <strong>{dsc?.certificateName}</strong>.
          </SheetDescription>
          {dsc && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Token: {dsc.tokenType} (#{dsc.tokenSerialNumber || "N/A"})
              </span>
              <span>Shelf: {dsc.physicalLocation}</span>
            </div>
          )}
        </SheetHeader>

        <div className="py-6">
          {isLoading || isFetching ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">
                No custody handovers recorded
              </p>
              <p className="text-xs mt-1">
                This physical USB token has remained in its initial registered
                custody.
              </p>
            </div>
          ) : (
            <div className="relative border-l border-border/80 ml-3 space-y-6">
              {history.map((log) => {
                const date = new Date(log.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const expectedReturn = log.expectedReturnDate
                  ? new Date(log.expectedReturnDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )
                  : null;

                return (
                  <div key={log._id} className="relative pl-6">
                    {/* Timeline bullet */}
                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />

                    <div className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        {getActionBadge(log.action)}
                        <span className="text-[10px] text-muted-foreground">
                          {date}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{log.transferredToName}</span>
                        {log.transferredToPhone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-1">
                            <Phone className="h-3 w-3" />
                            {log.transferredToPhone}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border/40">
                        <span className="font-semibold text-foreground/80">
                          Reason:{" "}
                        </span>
                        {log.reason}
                      </div>

                      {expectedReturn && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Expected Return: {expectedReturn}</span>
                        </div>
                      )}

                      {log.notes && (
                        <div className="text-[11px] text-muted-foreground italic">
                          Notes: {log.notes}
                        </div>
                      )}

                      {log.handledByUserId?.name && (
                        <div className="text-[10px] text-muted-foreground border-t pt-1.5 mt-2 flex justify-between">
                          <span>Logged by: {log.handledByUserId.name}</span>
                        </div>
                      )}
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
