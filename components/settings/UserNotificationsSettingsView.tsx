"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Lock,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldAlert,
  Building2,
  UserCheck,
  CheckSquare,
  Receipt,
  FolderArchive,
  Key,
  CalendarCheck,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  useGetUserNotificationPreferencesQuery,
  useUpdateUserNotificationPreferencesMutation,
  useResetUserNotificationPreferencesMutation,
  useGetTenantNotificationPolicyQuery,
  useUpdateTenantNotificationPolicyMutation,
} from "@/lib/services/api";
import {
  NotificationPreferenceItem,
  NotificationPolicyItem,
  NotificationCategory,
} from "@/lib/types/notification";
import { toast } from "sonner";

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: React.ElementType; description: string }
> = {
  tasks: {
    label: "Tasks & Workflows",
    icon: CheckSquare,
    description: "Operational task assignments, deadline alerts, checklist subtasks, and reviews.",
  },
  billing: {
    label: "Billing, Invoices & Receipts",
    icon: Receipt,
    description: "Tax invoice generation, overdue reminders, and payment receipts.",
  },
  documents: {
    label: "Clients & Documents",
    icon: FolderArchive,
    description: "Client onboarding, portal document uploads, and physical file inward/outward custody.",
  },
  dsc_vault: {
    label: "DSC & Password Vault",
    icon: Key,
    description: "Digital Signature Certificate expiries, USB handovers, and password unmask security audits.",
  },
  attendance: {
    label: "HR & Attendance",
    icon: CalendarCheck,
    description: "Missed punch notifications and manual adjustments by management.",
  },
  security: {
    label: "Staff & Security",
    icon: ShieldCheck,
    description: "Team invitations, account role changes, and staff deactivations.",
  },
  subscription: {
    label: "SaaS Subscription & Billing",
    icon: Zap,
    description: "Practice platform renewal receipts, seat allocation warnings, and billing issues.",
  },
};

export function UserNotificationsSettingsView() {
  const { isSuperAdmin, can } = usePermissions();
  const canManagePolicy = isSuperAdmin || can("notification_settings:manage") || can("settings:manage");

  const [activeTab, setActiveTab] = useState<"preferences" | "policy">("preferences");

  // Personal preferences query & mutations
  const {
    data: prefData,
    isLoading: isLoadingPrefs,
    refetch: refetchPrefs,
  } = useGetUserNotificationPreferencesQuery();

  const [updatePrefs, { isLoading: isSavingPrefs }] =
    useUpdateUserNotificationPreferencesMutation();
  const [resetPrefs, { isLoading: isResettingPrefs }] =
    useResetUserNotificationPreferencesMutation();

  // Local state for personal preferences
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferenceItem[]>([]);
  const [hasPrefChanges, setHasPrefChanges] = useState(false);

  useEffect(() => {
    if (prefData?.preferences) {
      setLocalPreferences(prefData.preferences);
      setHasPrefChanges(false);
    }
  }, [prefData]);

  // Org policy query & mutations
  const {
    data: policyData,
    isLoading: isLoadingPolicy,
    refetch: refetchPolicy,
  } = useGetTenantNotificationPolicyQuery(undefined, {
    skip: !canManagePolicy,
  });

  const [updatePolicy, { isLoading: isSavingPolicy }] =
    useUpdateTenantNotificationPolicyMutation();

  const [localPolicies, setLocalPolicies] = useState<NotificationPolicyItem[]>([]);
  const [hasPolicyChanges, setHasPolicyChanges] = useState(false);

  useEffect(() => {
    if (policyData?.policies) {
      setLocalPolicies(policyData.policies);
      setHasPolicyChanges(false);
    }
  }, [policyData]);

  // Toggle handlers for Personal Preferences
  const handleTogglePref = (
    eventKey: string,
    channel: "inApp" | "email"
  ) => {
    setLocalPreferences((prev) =>
      prev.map((item) => {
        if (item.eventKey === eventKey) {
          if (item.isMandatory) return item; // Locked
          return { ...item, [channel]: !item[channel] };
        }
        return item;
      })
    );
    setHasPrefChanges(true);
  };

  const handleSavePreferences = async () => {
    try {
      await updatePrefs({
        preferences: localPreferences.map((p) => ({
          eventKey: p.eventKey,
          inApp: p.inApp,
          email: p.email,
          whatsapp: p.whatsapp,
        })),
      }).unwrap();
      toast.success("Notification preferences saved successfully");
      setHasPrefChanges(false);
      refetchPrefs();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save preferences");
    }
  };

  const handleResetPreferences = async () => {
    if (!confirm("Are you sure you want to reset your notification preferences to organization defaults?")) {
      return;
    }
    try {
      await resetPrefs().unwrap();
      toast.success("Preferences reset to organization defaults");
      refetchPrefs();
      setHasPrefChanges(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset preferences");
    }
  };

  // Toggle handlers for Organization Policies
  const handleTogglePolicyField = (
    eventKey: string,
    field: "isEnabled" | "isMandatory" | "defaultInApp" | "defaultEmail"
  ) => {
    setLocalPolicies((prev) =>
      prev.map((item) => {
        if (item.eventKey === eventKey) {
          return { ...item, [field]: !item[field] };
        }
        return item;
      })
    );
    setHasPolicyChanges(true);
  };

  const handleSavePolicy = async () => {
    try {
      await updatePolicy({ policies: localPolicies }).unwrap();
      toast.success("Organization notification policies saved successfully");
      setHasPolicyChanges(false);
      refetchPolicy();
      refetchPrefs();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save organization policy");
    }
  };

  // Group personal preferences by category
  const categories: NotificationCategory[] = [
    "tasks",
    "billing",
    "documents",
    "dsc_vault",
    "attendance",
    "security",
    "subscription",
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                User Notifications
              </h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Multi-Channel Hub
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Configure your personal notification channels and alerts. Manage whether you receive in-app popovers,
              email dispatches, and statutory compliance reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "preferences" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPreferences}
                  disabled={isResettingPrefs || isLoadingPrefs}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Defaults</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  disabled={!hasPrefChanges || isSavingPrefs}
                  className="gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingPrefs ? "Saving..." : "Save Preferences"}</span>
                </Button>
              </>
            )}

            {activeTab === "policy" && canManagePolicy && (
              <Button
                size="sm"
                onClick={handleSavePolicy}
                disabled={!hasPolicyChanges || isSavingPolicy}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSavingPolicy ? "Saving Policy..." : "Save Org Policies"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "preferences" | "policy")}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="preferences" className="gap-2 text-xs">
              <UserCheck className="h-3.5 w-3.5" />
              <span>My Preferences</span>
            </TabsTrigger>
            {canManagePolicy && (
              <TabsTrigger value="policy" className="gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                <span>Organization Policy</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: Personal Preferences */}
          <TabsContent value="preferences" className="space-y-6 mt-0">
            {isLoadingPrefs ? (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
                <p className="text-sm text-muted-foreground">Loading notification preferences...</p>
              </div>
            ) : (
              categories.map((catKey) => {
                const catMeta = CATEGORY_META[catKey];
                const catItems = localPreferences.filter(
                  (item) => item.category === catKey && item.isEnabled !== false
                );

                if (catItems.length === 0) return null;

                const CatIcon = catMeta.icon;

                return (
                  <div
                    key={catKey}
                    className="rounded-xl border bg-card shadow-sm overflow-hidden"
                  >
                    {/* Category Header */}
                    <div className="border-b bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CatIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-foreground">
                            {catMeta.label}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {catMeta.description}
                          </p>
                        </div>
                      </div>

                      {/* Channel Column Headers on Desktop */}
                      <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground pr-4">
                        <span className="w-16 text-center flex items-center justify-center gap-1">
                          <Bell className="h-3.5 w-3.5" /> In-App
                        </span>
                        <span className="w-16 text-center flex items-center justify-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </span>
                        <span className="w-20 text-center flex items-center justify-center gap-1 opacity-50">
                          <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                        </span>
                      </div>
                    </div>

                    {/* Event Rows */}
                    <div className="divide-y divide-border/60">
                      {catItems.map((item) => (
                        <div
                          key={item.eventKey}
                          className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-muted/10"
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground">
                                {item.name}
                              </h3>
                              {item.isMandatory && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full cursor-help">
                                      <Lock className="h-3 w-3" /> Mandatory
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    Enforced by organization security policy. This notification cannot be disabled.
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Switches */}
                          <div className="flex items-center gap-6 self-start md:self-center pr-2">
                            {/* In-App Switch */}
                            <div className="w-16 flex flex-col items-center gap-1">
                              <span className="md:hidden text-[10px] text-muted-foreground flex items-center gap-1">
                                <Bell className="h-3 w-3" /> In-App
                              </span>
                              <Switch
                                checked={item.inApp}
                                disabled={item.isMandatory}
                                onCheckedChange={() =>
                                  handleTogglePref(item.eventKey, "inApp")
                                }
                                aria-label={`${item.name} in-app toggle`}
                              />
                            </div>

                            {/* Email Switch */}
                            <div className="w-16 flex flex-col items-center gap-1">
                              <span className="md:hidden text-[10px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Email
                              </span>
                              <Switch
                                checked={item.email}
                                disabled={item.isMandatory}
                                onCheckedChange={() =>
                                  handleTogglePref(item.eventKey, "email")
                                }
                                aria-label={`${item.name} email toggle`}
                              />
                            </div>

                            {/* WhatsApp (Coming Soon) */}
                            <div className="w-20 flex flex-col items-center gap-1 opacity-50">
                              <span className="md:hidden text-[10px] text-muted-foreground">
                                WhatsApp
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Switch disabled checked={false} />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  WhatsApp alerts coming soon in future channel update.
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {/* Bottom Save Bar when dirty */}
            {hasPrefChanges && (
              <div className="sticky bottom-6 rounded-xl border bg-card/95 backdrop-blur-md p-4 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <span>You have unsaved notification preferences changes.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (prefData?.preferences) {
                        setLocalPreferences(prefData.preferences);
                        setHasPrefChanges(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    disabled={isSavingPrefs}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingPrefs ? "Saving..." : "Save Preferences"}</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Organization Policies (Admins only) */}
          {canManagePolicy && (
            <TabsContent value="policy" className="space-y-6 mt-0">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Firm-Wide Notification Delivery Policies
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                      As a Super Administrator, you can establish baseline defaults for all practice employees,
                      enable or disable specific events firm-wide, and designate mandatory security alerts.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSavePolicy}
                    disabled={!hasPolicyChanges || isSavingPolicy}
                    className="gap-1.5 text-xs shrink-0"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{isSavingPolicy ? "Saving Policy..." : "Save Policies"}</span>
                  </Button>
                </div>

                {isLoadingPolicy ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                    <p className="text-xs">Loading organization policies...</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-3.5">Notification Event</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5 text-center">Enabled Firm-Wide</th>
                          <th className="p-3.5 text-center">Mandatory Override</th>
                          <th className="p-3.5 text-center">Default In-App</th>
                          <th className="p-3.5 text-center">Default Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {localPolicies.map((pol) => (
                          <tr
                            key={pol.eventKey}
                            className={`transition-colors hover:bg-muted/10 ${
                              !pol.isEnabled ? "opacity-60 bg-muted/5" : ""
                            }`}
                          >
                            <td className="p-3.5">
                              <div className="font-medium text-foreground">
                                {pol.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground line-clamp-1">
                                {pol.description}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                {pol.category}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-center">
                              <Switch
                                checked={pol.isEnabled}
                                onCheckedChange={() =>
                                  handleTogglePolicyField(pol.eventKey, "isEnabled")
                                }
                                aria-label={`${pol.name} firm-wide enable`}
                              />
                            </td>
                            <td className="p-3.5 text-center">
                              <Switch
                                checked={pol.isMandatory}
                                onCheckedChange={() =>
                                  handleTogglePolicyField(pol.eventKey, "isMandatory")
                                }
                                aria-label={`${pol.name} mandatory override`}
                              />
                            </td>
                            <td className="p-3.5 text-center">
                              <Switch
                                checked={pol.defaultInApp}
                                disabled={!pol.isEnabled}
                                onCheckedChange={() =>
                                  handleTogglePolicyField(pol.eventKey, "defaultInApp")
                                }
                                aria-label={`${pol.name} default in-app`}
                              />
                            </td>
                            <td className="p-3.5 text-center">
                              <Switch
                                checked={pol.defaultEmail}
                                disabled={!pol.isEnabled}
                                onCheckedChange={() =>
                                  handleTogglePolicyField(pol.eventKey, "defaultEmail")
                                }
                                aria-label={`${pol.name} default email`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

