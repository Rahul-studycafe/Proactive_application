"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Users,
  Briefcase,
  HardDrive,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useGetTenantSubscriptionQuery,
  useGetTenantUsageQuery,
  useUpdateTenantSubscriptionMutation,
} from "@/lib/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AccessRestricted } from "@/components/shared/AccessRestricted";

interface PlanTierDef {
  id: "Starter" | "Professional" | "Enterprise";
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  maxUsers: number;
  maxClients: number;
  storageGb: number;
  features: string[];
}

const PLAN_TIERS: PlanTierDef[] = [
  {
    id: "Starter",
    name: "Starter",
    tagline: "Essential accounting & filing for small single-office practices.",
    monthlyPrice: 299,
    annualPrice: 2999,
    maxUsers: 5,
    maxClients: 100,
    storageGb: 10,
    features: [
      "Up to 5 Staff Users",
      "100 Active Clients",
      "10 GB Secure Cloud Storage",
      "Client Portal Access",
      "Single Branch Billing",
      "Standard Email Notifications",
    ],
  },
  {
    id: "Professional",
    name: "Professional",
    tagline: "Advanced capabilities for growing CA & tax consultant firms.",
    monthlyPrice: 799,
    annualPrice: 7999,
    popular: true,
    maxUsers: 15,
    maxClients: 500,
    storageGb: 25,
    features: [
      "Up to 15 Staff Users",
      "500 Active Clients",
      "25 GB Cloud Storage",
      "Multi-Branch & State GSTIN Support",
      "Bank Reconciliation & Razorpay Gateway",
      "Automated WhatsApp & Email Reminders",
      "Client Document Request Workflows",
    ],
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    tagline:
      "Uncapped scale, white-label CMS & priority enterprise compliance.",
    monthlyPrice: 1999,
    annualPrice: 19999,
    maxUsers: 50,
    maxClients: 2500,
    storageGb: 100,
    features: [
      "Up to 50 Staff Users",
      "2,500 Active Clients",
      "100 GB High-Speed Cloud Storage",
      "Unlimited Branches & Billing Profiles",
      "Custom Domain & White-Label CMS",
      "Custom Sequence Prefixing",
      "Audit Trail & Compliance Archive",
      "Priority 24/7 SLA Support",
    ],
  },
];

export default function SubscriptionSettingsPage() {
  const { isSuperAdmin } = usePermissions();

  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Annual">(
    "Annual",
  );
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const { data: subscription, isLoading: loadingSub } =
    useGetTenantSubscriptionQuery();
  const { data: usage, isLoading: loadingUsage } = useGetTenantUsageQuery();
  const [updateSubscription, { isLoading: isUpdating }] =
    useUpdateTenantSubscriptionMutation();

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Settings", href: "/settings" },
            { label: "SaaS Subscription & Plan" },
          ]}
        />
        <AccessRestricted
          title="Subscription Management Restricted"
          description="Only the Practice Owner / Super Admin can view, upgrade, or manage the SaaS subscription and seat quotas."
          backHref="/settings"
          backLabel="Return to Settings"
        />
      </div>
    );
  }

  const currentPlan = subscription?.planTier || usage?.planTier || "Starter";

  const handleUpgrade = async (plan: PlanTierDef) => {
    try {
      setUpgradingPlan(plan.id);
      await updateSubscription({
        planTier: plan.id,
        billingCycle,
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        storageLimitGb: plan.storageGb,
        featuresEnabled: {
          clientPortal: true,
          timeTracking: true,
          multiBranch: plan.id !== "Starter",
          customDomain: plan.id === "Enterprise",
          bulkWhatsApp: plan.id !== "Starter",
        },
      }).unwrap();
      toast.success(
        `Subscription upgraded to ${plan.name} (${billingCycle}) successfully!`,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update subscription");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const getMeterColor = (pct: number) => {
    if (pct >= 100) return "text-destructive";
    if (pct >= 80) return "text-amber-500";
    return "text-primary";
  };

  const getProgressColorClass = (pct: number) => {
    if (pct >= 100) return "[&>div]:bg-destructive";
    if (pct >= 80) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-primary";
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Subscription & Plans" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            SaaS Subscription & License
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization tier, track resource quotas, and expand
            user capacity.
          </p>
        </div>

        {/* Billing Cycle Switch */}
        <div className="flex items-center gap-2 self-start rounded-xl border bg-muted/30 p-1">
          <Button
            size="sm"
            variant={billingCycle === "Annual" ? "default" : "ghost"}
            className={cn(
              "h-8 text-xs font-semibold rounded-lg",
              billingCycle === "Annual" && "shadow-xs",
            )}
            onClick={() => setBillingCycle("Annual")}
          >
            Annual Billing
            <Badge
              variant="secondary"
              className="ml-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 px-1 font-bold"
            >
              Save 20%
            </Badge>
          </Button>
          <Button
            size="sm"
            variant={billingCycle === "Monthly" ? "default" : "ghost"}
            className={cn(
              "h-8 text-xs font-semibold rounded-lg",
              billingCycle === "Monthly" && "shadow-xs",
            )}
            onClick={() => setBillingCycle("Monthly")}
          >
            Monthly Billing
          </Button>
        </div>
      </div>

      {/* ─── Usage Meters Card ────────────────────────────────────── */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  Resource Quota & Usage
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-semibold text-xs",
                    currentPlan === "Enterprise"
                      ? "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      : currentPlan === "Professional"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
                  )}
                >
                  {currentPlan} Tier
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs"
                >
                  {subscription?.status || usage?.status || "Active"}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Real-time tracking of staff seats, client records, and secure
                storage capacity.
              </CardDescription>
            </div>

            {usage?.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>
                  Renews on{" "}
                  <strong className="text-foreground">
                    {new Date(usage.currentPeriodEnd).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </strong>
                  {usage?.daysUntilRenewal !== undefined && (
                    <span className="ml-1 text-muted-foreground">
                      ({usage.daysUntilRenewal} days remaining)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Staff Seats */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Staff Seats</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Active team logins
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold font-mono",
                    getMeterColor(usage?.users?.percentage || 0),
                  )}
                >
                  {usage?.users?.percentage ?? 0}%
                </span>
              </div>
              <Progress
                value={Math.min(100, usage?.users?.percentage || 0)}
                className={cn(
                  "h-2 bg-muted",
                  getProgressColorClass(usage?.users?.percentage || 0),
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: {usage?.users?.used ?? 1}</span>
                <span>Limit: {usage?.users?.max ?? 5}</span>
              </div>
            </div>

            {/* Client Accounts */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Client Accounts</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Managed organizations
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold font-mono",
                    getMeterColor(usage?.clients?.percentage || 0),
                  )}
                >
                  {usage?.clients?.percentage ?? 0}%
                </span>
              </div>
              <Progress
                value={Math.min(100, usage?.clients?.percentage || 0)}
                className={cn(
                  "h-2 bg-muted",
                  getProgressColorClass(usage?.clients?.percentage || 0),
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: {usage?.clients?.used ?? 0}</span>
                <span>Limit: {usage?.clients?.max ?? 100}</span>
              </div>
            </div>

            {/* Cloud Storage */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Document Storage</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Invoices & client vault
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-bold font-mono",
                    getMeterColor(usage?.storage?.percentage || 0),
                  )}
                >
                  {usage?.storage?.percentage ?? 0}%
                </span>
              </div>
              <Progress
                value={Math.min(100, usage?.storage?.percentage || 0)}
                className={cn(
                  "h-2 bg-muted",
                  getProgressColorClass(usage?.storage?.percentage || 0),
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: {usage?.storage?.usedGb ?? 0.1} GB</span>
                <span>Limit: {usage?.storage?.maxGb ?? 10} GB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Plan Comparison Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = currentPlan === tier.id;
          const price =
            billingCycle === "Annual" ? tier.annualPrice : tier.monthlyPrice;
          const cycleLabel = billingCycle === "Annual" ? "/year" : "/month";

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col justify-between transition-all",
                tier.popular &&
                  "border-primary/50 shadow-md ring-1 ring-primary/20",
                isCurrent && "border-emerald-500/50 bg-emerald-500/[0.02]",
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground text-[10px] font-bold px-3 shadow-xs">
                    <Sparkles className="h-3 w-3 mr-1 fill-current" />
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {tier.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                      {tier.tagline}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                    >
                      Current Plan
                    </Badge>
                  )}
                </div>

                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {cycleLabel}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Plan Specifications
                  </p>
                  <ul className="space-y-2.5">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold"
                    disabled
                  >
                    <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
                    Active Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={isUpdating}
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full text-xs font-semibold gap-1.5"
                  >
                    {upgradingPlan === tier.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-current" />
                        Upgrade to {tier.name}
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
