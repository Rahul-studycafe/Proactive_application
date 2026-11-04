"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCog,
  Bell,
  CalendarCheck,
  Palmtree,
  ArrowRightLeft,
  Settings2,
  FolderPlus,
  Globe2,
  CreditCard,
  QrCode,
  Building,
  Zap,
  History,
  Sparkles,
} from "lucide-react";

import { mockUsers } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HolidaysView } from "@/components/holidays/HolidaysView";
import { WorkingDaysView } from "@/components/settings/WorkingDaysView";
import { UsersSettingsView } from "@/components/settings/UsersSettingsView";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { QueueHealthCard } from "@/components/automation/QueueHealthCard";
import { TriggerAutomationModal } from "@/components/automation/TriggerAutomationModal";

interface SettingModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  colorClass: string;
  category: "User" | "Client" | "Billing" | "System";
}

const SETTING_MODULES: SettingModule[] = [
  // System Section
  {
    id: "subscription",
    title: "SaaS Subscription & Plan",
    description:
      "Manage practice subscription tier, user seat limits, client quota, and storage.",
    icon: Sparkles,
    colorClass:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    category: "System",
  },
  {
    id: "website-cms",
    title: "Website & Portal CMS",
    description:
      "White-label subdomain, agency branding, custom domain, and client portal layout.",
    icon: Globe2,
    colorClass:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    category: "System",
  },
  {
    id: "automation-settings",
    title: "Automation & Engine",
    description:
      "BullMQ worker health, recurring cron tasks, and Redis queue status.",
    icon: Zap,
    colorClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    category: "System",
  },
  // User Section
  {
    id: "users",
    title: "Users",
    description: "Add or edit the users, user roles, password and more.",
    icon: Users,
    colorClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    category: "User",
  },
  {
    id: "user-roles",
    title: "User Roles",
    description:
      "Create or edit the user roles and allow or restrict control of permissions.",
    icon: UserCog,
    colorClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    category: "User",
  },
  {
    id: "user-notifications",
    title: "User Notifications",
    description:
      "Update user notifications settings and push notification preferences.",
    icon: Bell,
    colorClass:
      "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    category: "User",
  },
  {
    id: "attendance-settings",
    title: "Attendance Settings",
    description: "You can set weekend days and working hours for attendance.",
    icon: CalendarCheck,
    colorClass:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    category: "User",
  },
  {
    id: "holidays-list",
    title: "Holidays List",
    description:
      "Create or change the holidays list for attendance and operations.",
    icon: Palmtree,
    colorClass: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
    category: "User",
  },
  {
    id: "user-replacement",
    title: "User Replacement",
    description: "Replace user in Tasks, Clients, and assigned Services.",
    icon: ArrowRightLeft,
    colorClass:
      "bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-300",
    category: "User",
  },

  // Client Section
  {
    id: "client-settings",
    title: "Client Settings",
    description: "Manage client settings and custom fields configuration.",
    icon: Settings2,
    colorClass:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    category: "Client",
  },
  {
    id: "client-groups",
    title: "Client Groups",
    description: "Add, edit, or delete the client's management groups.",
    icon: FolderPlus,
    colorClass:
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    category: "Client",
  },
  {
    id: "portals-list",
    title: "Portals List",
    description: "Manage compliance portals or websites e.g. GST, Income Tax.",
    icon: Globe2,
    colorClass:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    category: "Client",
  },

  // Billing Section
  {
    id: "payment-gateways",
    title: "Firm Direct UPI & Settlement",
    description:
      "Configure direct NPCI UPI QR code, firm UPI VPA handle, and zero-fee bank settlements.",
    icon: QrCode,
    colorClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    category: "Billing",
  },
  {
    id: "billing-preferences",
    title: "Billing Preferences",
    description: "Manage invoice templates, currency, and payment terms.",
    icon: CreditCard,
    colorClass:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    category: "Billing",
  },
  {
    id: "billing-entities",
    title: "Billing Entities",
    description:
      "Manage organization entities, GSTIN registrations, and bank details.",
    icon: Building,
    colorClass:
      "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    category: "Billing",
  },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialModule = searchParams.get("module");

  const [activeModule, setActiveModule] = useState<string | null>(
    initialModule,
  );

  useEffect(() => {
    const mod = searchParams.get("module");
    if (mod) {
      setActiveModule(mod);
    }
  }, [searchParams]);

  const selectModule = (id: string) => {
    if (id === "website-cms") {
      router.push("/settings/website");
      return;
    }
    if (id === "payment-gateways") {
      router.push("/settings/payment-gateways");
      return;
    }
    if (id === "billing-entities") {
      router.push("/settings/billing-entities");
      return;
    }
    if (id === "subscription") {
      router.push("/settings/subscription");
      return;
    }
    setActiveModule(id);
    router.push(`/settings?module=${id}`, { scroll: false });
  };

  const backToSettings = () => {
    setActiveModule(null);
    router.push("/settings", { scroll: false });
  };

  const currentModuleObj = SETTING_MODULES.find((m) => m.id === activeModule);

  // If a module is active, show the module content with Back Header
  if (activeModule) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Settings", href: "/settings", onClick: backToSettings },
            { label: currentModuleObj?.title || "Module Settings" },
          ]}
        />

        <div className="pt-1">
          {activeModule === "holidays-list" && <HolidaysView />}
          {activeModule === "attendance-settings" && <WorkingDaysView />}
          {activeModule === "automation-settings" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Automation & Queue Settings
                    </h1>
                    <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure BullMQ background task workers, inspect Redis
                    queue status, and run manual generation cycles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/tasks/automation/logs">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                    >
                      <History className="h-4 w-4" />
                      <span>Audit Logs</span>
                    </Button>
                  </Link>
                  <TriggerAutomationModal />
                </div>
              </div>

              <QueueHealthCard />
            </div>
          )}
          {activeModule === "users" && <UsersSettingsView />}
          {activeModule !== "holidays-list" &&
            activeModule !== "attendance-settings" &&
            activeModule !== "automation-settings" &&
            activeModule !== "users" && (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                  <Settings2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">
                  {currentModuleObj?.title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  {currentModuleObj?.description} (Coming soon in future module
                  releases).
                </p>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" onClick={backToSettings}>
                    Return to Settings
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  // Main Settings Hub (Categories and Cards)
  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* User Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          User
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_MODULES.filter((m) => m.category === "User").map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => selectModule(mod.id)}
                className="flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/30 hover:border-border/80 hover:shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${mod.colorClass}`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Client Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Client
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_MODULES.filter((m) => m.category === "Client").map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => selectModule(mod.id)}
                className="flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/30 hover:border-border/80 hover:shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${mod.colorClass}`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Billing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_MODULES.filter((m) => m.category === "Billing").map(
            (mod) => {
              const IconComponent = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => selectModule(mod.id)}
                  className="flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/30 hover:border-border/80 hover:shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${mod.colorClass}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* System & Automation Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          System & Automation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SETTING_MODULES.filter((m) => m.category === "System").map((mod) => {
            const IconComponent = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => selectModule(mod.id)}
                className="flex items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:bg-muted/30 hover:border-border/80 hover:shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${mod.colorClass}`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {mod.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted-foreground">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
