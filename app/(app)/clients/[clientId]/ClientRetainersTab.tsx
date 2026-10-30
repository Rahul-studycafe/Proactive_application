"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Package as PackageIcon,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecurrenceBadge } from "@/components/services/RecurrenceBadge";
import { SubscribeDialog } from "./SubscribeDialog";
import { useUnsubscribeClientFromPackageMutation } from "@/lib/services/api";

interface ClientRetainersTabProps {
  clientId: string;
  client: any;
}

export function ClientRetainersTab({ clientId, client }: ClientRetainersTabProps) {
  const [packageToDelete, setPackageToDelete] = useState<any | null>(null);
  const [unsubscribePackage, { isLoading: isUnsubscribing }] =
    useUnsubscribeClientFromPackageMutation();

  const retainers = client?.subscribedPackages || [];

  // Calculate total monthly equivalent value
  const totalMonthlyValue = retainers.reduce((acc: number, item: any) => {
    const pkg = item.packageId || {};
    const amount = item.customPrice ?? pkg.defaultBillingAmount ?? 0;
    const freq = (pkg.frequency || item.frequency || "monthly").toLowerCase();

    switch (freq) {
      case "monthly":
        return acc + amount;
      case "quarterly":
        return acc + amount / 3;
      case "half_yearly":
        return acc + amount / 6;
      case "yearly":
        return acc + amount / 12;
      default:
        return acc + amount;
    }
  }, 0);

  // Total bundled services across all retainers
  const totalBundledServices = retainers.reduce((acc: number, item: any) => {
    const pkg = item.packageId;
    return acc + (pkg?.serviceIds?.length || 0);
  }, 0);

  const handleConfirmDelete = async () => {
    if (!packageToDelete) return;
    try {
      const packageId =
        packageToDelete.packageId?._id ||
        packageToDelete.packageId ||
        packageToDelete._id;
      await unsubscribePackage({
        clientId,
        packageId: packageId.toString(),
      }).unwrap();
      toast.success("Successfully unsubscribed from retainer package");
      setPackageToDelete(null);
    } catch (error: any) {
      console.error("Failed to unsubscribe:", error);
      toast.error(error?.data?.message || "Failed to unsubscribe from retainer");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-xs border-border/80">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PackageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Retainers
              </p>
              <p className="text-xl font-bold tracking-tight">
                {retainers.length} {retainers.length === 1 ? "Package" : "Packages"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Est. Monthly Retainer
              </p>
              <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                ₹{Math.round(totalMonthlyValue).toLocaleString("en-IN")}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Bundled Compliances
              </p>
              <p className="text-xl font-bold tracking-tight">
                {totalBundledServices} {totalBundledServices === 1 ? "Service" : "Services"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Retainers Card */}
      <Card className="shadow-xs border-border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-6">
          <div>
            <CardTitle className="text-base font-semibold">
              Client Retainer Packages
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recurring commercial packages bundling multiple statutory compliance services under fixed-fee billing.
            </p>
          </div>
          <SubscribeDialog
            clientId={clientId}
            client={client}
            defaultTab="package"
            triggerButton={
              <Button size="sm" className="gap-2 shadow-xs">
                <Plus className="h-4 w-4" /> Add Retainer Package
              </Button>
            }
          />
        </CardHeader>

        <CardContent className="p-6">
          {retainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                <PackageIcon className="h-6 w-6 opacity-70" />
              </div>
              <h4 className="text-sm font-semibold">No Active Retainer Packages</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-5">
                This client has not been assigned any recurring retainer contracts. Add a retainer package to bundle GST, TDS, and ROC compliances into regular recurring billing.
              </p>
              <SubscribeDialog
                clientId={clientId}
                client={client}
                defaultTab="package"
                triggerButton={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Assign First Retainer
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {retainers.map((sub: any, idx: number) => {
                const pkg = sub.packageId || {};
                const packageName =
                  typeof pkg === "object" && pkg.name
                    ? pkg.name
                    : typeof sub.packageId === "string"
                    ? sub.packageId
                    : "Retainer Package";

                const frequency = pkg.frequency || sub.frequency || "monthly";
                const billingRate =
                  sub.customPrice !== undefined
                    ? sub.customPrice
                    : pkg.defaultBillingAmount ?? 0;

                const bundledServices = Array.isArray(pkg.serviceIds)
                  ? pkg.serviceIds
                  : [];

                return (
                  <div
                    key={`pkg-${idx}`}
                    className="relative rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          <PackageIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              {packageName}
                            </h4>
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium uppercase"
                            >
                              Active Retainer
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3.5 w-3.5 opacity-70" />
                            <span>
                              Subscribed:{" "}
                              {sub.subscribedAt
                                ? new Date(sub.subscribedAt).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Unsubscribe Retainer"
                        onClick={() => setPackageToDelete(sub)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Pricing & Frequency Bar */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3.5 py-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">Billing Cycle:</span>
                        <RecurrenceBadge frequency={frequency} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Fee:</span>
                        <span className="text-sm font-bold text-foreground">
                          ₹{Number(billingRate).toLocaleString("en-IN")}
                        </span>
                        {sub.customPrice !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (Custom)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bundled Services */}
                    {bundledServices.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-border/50">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                          <span>Included Services ({bundledServices.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {bundledServices.map((svc: any, sIdx: number) => {
                            const svcName =
                              typeof svc === "object" && svc.name
                                ? svc.name
                                : typeof svc === "string"
                                ? svc
                                : "Service";
                            return (
                              <Badge
                                key={`svc-${sIdx}`}
                                variant="secondary"
                                className="text-[11px] font-normal py-0.5 px-2 bg-secondary/60 text-secondary-foreground"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                {svcName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Tax & SAC metadata */}
                    {(pkg.sacCode || pkg.gstPercentage) && (
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 pt-1">
                        {pkg.sacCode && <span>SAC: {pkg.sacCode}</span>}
                        {pkg.gstPercentage && <span>GST: {pkg.gstPercentage}%</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!packageToDelete}
        onOpenChange={(isOpen) => !isOpen && setPackageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsubscribe Retainer Package?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-foreground">
                {packageToDelete?.packageId?.name || "this package"}
              </strong>{" "}
              from this client? Future recurring billing cycles for this retainer will cease.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnsubscribing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isUnsubscribing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnsubscribing ? "Removing..." : "Remove Retainer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
