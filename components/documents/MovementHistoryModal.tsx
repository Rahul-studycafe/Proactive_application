"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDocumentMovementHistoryQuery } from "@/lib/services/api";
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  MapPin,
  Calendar,
  User,
  Phone,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface MovementHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
}

export function MovementHistoryModal({
  open,
  onOpenChange,
  documentId,
}: MovementHistoryModalProps) {
  const { data, isLoading } = useGetDocumentMovementHistoryQuery(
    documentId || "",
    {
      skip: !documentId || !open,
    },
  );

  const doc = data?.document;
  const movements = data?.movements || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Document Movement History
              </DialogTitle>
              <DialogDescription>
                Chronological chain-of-custody tracking across all office In /
                Out handovers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : !doc ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Document movement data unavailable.
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Document Header Card */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {doc.documentName}
                  </h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span className="font-medium text-primary">
                      {doc.documentType}
                    </span>
                    <span>•</span>
                    <span>
                      Client:{" "}
                      <strong>
                        {typeof doc.clientId === "object"
                          ? doc.clientId?.name
                          : "N/A"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {doc.status === "In Custody" && (
                    <Badge
                      variant="outline"
                      className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      In Office Custody
                    </Badge>
                  )}
                  {doc.status === "Returned" && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      With Client (Sent)
                    </Badge>
                  )}
                  {doc.status === "Overdue" && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue Return
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-border/60">
                <div className="text-muted-foreground">
                  Current Location:{" "}
                  <span className="text-foreground font-medium">
                    {doc.location}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Returnable:{" "}
                  <span className="text-foreground font-medium">
                    {doc.isReturnable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Total Movements:{" "}
                  <span className="text-foreground font-medium">
                    {movements.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Custody Movement Timeline
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {movements.map((m: any, idx: number) => {
                  const isReceived = m.movementType === "Received";
                  const custodianName =
                    typeof m.custodianUserId === "object"
                      ? m.custodianUserId?.name
                      : "Authorized Staff";

                  return (
                    <div key={m._id || idx} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[29px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center border-2 bg-background shadow-sm ${
                          isReceived
                            ? "border-emerald-500 text-emerald-600"
                            : "border-blue-500 text-blue-600"
                        }`}
                      >
                        {isReceived ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                      </div>

                      {/* Movement Card */}
                      <div className="rounded-lg border bg-card p-3 shadow-xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                isReceived
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                              }`}
                            >
                              {isReceived
                                ? "Received from Client (In Office Custody)"
                                : "Given to Client / Third Party (Sent)"}
                            </span>
                            {idx === 0 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1 font-normal"
                              >
                                Current Status
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(m.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {m.location && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>
                                Storage: <strong>{m.location}</strong>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>
                              Custodian: <strong>{custodianName}</strong>
                            </span>
                          </div>

                          {(m.receivedByPersonName ||
                            m.returnedToPersonName) && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {isReceived
                                  ? "Handed in by:"
                                  : "Handed over to:"}{" "}
                                <strong>
                                  {m.receivedByPersonName ||
                                    m.returnedToPersonName}
                                </strong>
                              </span>
                            </div>
                          )}

                          {m.receivedByPhone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span>{m.receivedByPhone}</span>
                            </div>
                          )}
                        </div>

                        {m.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border/40 mt-1">
                            <strong>Note:</strong> {m.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t">
          {documentId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/documents/in-out/${documentId}/slip`}>
                <Printer className="h-4 w-4 mr-1.5" />
                Handover Slip
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
