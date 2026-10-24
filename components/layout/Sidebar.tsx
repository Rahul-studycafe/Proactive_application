"use client";

import Link from "next/link";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  CalendarCheck,
} from "lucide-react";
import { useState } from "react";

import { usePermissions, type Permission } from "@/contexts/PermissionsContext";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  requiredPermission?: Permission;
};
const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    to: "/clients",
    label: "Clients",
    icon: Users,
    requiredPermission: "clients.view",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: CheckSquare,
    requiredPermission: "tasks.view",
  },
  {
    to: "/invoices",
    label: "Invoices",
    icon: FileText,
    requiredPermission: "invoices.view",
  },
  {
    to: "/receipts",
    label: "Receipts",
    icon: CreditCard,
    requiredPermission: "invoices.view",
  },
  {
    to: "/services",
    label: "Services",
    icon: Layers,
    requiredPermission: "settings.view", // Assuming it falls under settings for now
  },
  {
    to: "/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    requiredPermission: "settings.view",
  },
];

import { usePathname } from "next/navigation";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() || "";
  const { can } = usePermissions();

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiredPermission) {
      return can(item.requiredPermission);
    }
    return true; // if no permission required, always show
  });

  return (
    <aside
      className={`relative flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 print:hidden ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight">
            Proactive
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.to
            : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              href={item.to as string}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed((c) => !c)}
        className="m-2 flex items-center justify-center rounded-md border bg-card p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
