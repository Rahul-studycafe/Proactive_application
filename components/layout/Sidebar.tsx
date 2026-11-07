"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  CreditCard,
  FileMinus,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  CalendarCheck,
  KeyRound,
  ArrowLeftRight,
  FileUp,
  Receipt,
  Landmark,
  Files,
  UserCheck,
  CalendarDays,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  Clock,
  Lock,
  QrCode,
} from "lucide-react";

import { usePermissions, type Permission } from "@/contexts/PermissionsContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type SingleNavItem = {
  type?: "link";
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  requiredPermission?: Permission | Permission[];
};

type GroupNavItem = {
  type: "group";
  label: string;
  icon: typeof LayoutDashboard;
  children: SingleNavItem[];
};

type NavItem = SingleNavItem | GroupNavItem;

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
    to: "/services",
    label: "Services",
    icon: Layers,
    requiredPermission: ["service:view", "package:view"],
  },
  {
    type: "group",
    label: "Billing & Invoices",
    icon: Landmark,
    children: [
      {
        to: "/quotations",
        label: "Quotations",
        icon: FileSpreadsheet,
        requiredPermission: "quotation:view",
      },
      {
        to: "/invoices",
        label: "Invoices",
        icon: FileText,
        requiredPermission: "invoice:view",
      },
      {
        to: "/credit-notes",
        label: "Credit Notes",
        icon: FileMinus,
        requiredPermission: "credit_note:view",
      },
      {
        to: "/receipts",
        label: "Receipts",
        icon: CreditCard,
        requiredPermission: "receipt:view",
      },
      {
        to: "/expenses",
        label: "Expenses",
        icon: Receipt,
        requiredPermission: "expense:view",
      },
      {
        to: "/finance/payments",
        label: "Digital Payments",
        icon: QrCode,
        requiredPermission: ["billing:manage", "settings:manage"],
      },
    ],
  },
  {
    type: "group",
    label: "Vaults",
    icon: Lock,
    children: [
      {
        to: "/dsc",
        label: "DSC Register",
        icon: KeyRound,
        requiredPermission: "dsc:view",
      },
      {
        to: "/passwords",
        label: "Password Vault",
        icon: ShieldCheck,
        requiredPermission: "vault:view",
      },
    ],
  },
  {
    type: "group",
    label: "Documents",
    icon: Files,
    children: [
      {
        to: "/documents/in-out",
        label: "Docs. In-Out",
        icon: ArrowLeftRight,
        requiredPermission: "document:physical_manage",
      },
      {
        to: "/documents/requests",
        label: "Doc. Requests",
        icon: FileUp,
        requiredPermission: "document:request",
      },
    ],
  },

  {
    type: "group",
    label: "HR & Attendance",
    icon: UserCheck,
    children: [
      {
        to: "/attendance",
        label: "Attendance",
        icon: CalendarCheck,
        exact: true,
        requiredPermission: ["attendance:view_self", "attendance:view_all"],
      },
      {
        to: "/attendance/matrix",
        label: "Monthly Matrix",
        icon: CalendarDays,
        requiredPermission: [
          "attendance:matrix_view_self",
          "attendance:matrix_view",
          "attendance:view_all",
          "attendance:manage",
        ],
      },
    ],
  },
  {
    type: "group",
    label: "Reports",
    icon: BarChart3,
    children: [
      {
        to: "/reports/tasks",
        label: "Task Velocity",
        icon: CheckSquare,
        requiredPermission: "report:view",
      },
      {
        to: "/reports/dsc",
        label: "DSC Renewals",
        icon: KeyRound,
        requiredPermission: "report:view",
      },
      {
        to: "/reports/invoices",
        label: "Invoices Report",
        icon: FileText,
        requiredPermission: "report:view",
      },
      {
        to: "/reports/debtors-aging",
        label: "Debtors Aging",
        icon: Clock,
        requiredPermission: "report:view",
      },
    ],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    requiredPermission: [
      "settings:view",
      "settings:manage",
      "role:view",
      "user:view",
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname() || "";
  const { can } = usePermissions();

  const toggleGroup = (groupLabel: string, isGroupActive: boolean) => {
    setOpenGroups((prev) => {
      const currentlyOpen =
        prev[groupLabel] !== undefined ? prev[groupLabel] : isGroupActive;
      return {
        ...prev,
        [groupLabel]: !currentlyOpen,
      };
    });
  };

  const isPermitted = (item: SingleNavItem) => {
    if (item.requiredPermission) {
      if (Array.isArray(item.requiredPermission)) {
        return item.requiredPermission.some((p) => can(p));
      }
      return can(item.requiredPermission);
    }
    return true;
  };

  // Filter items based on permissions
  const filteredNavItems = navItems
    .map((item) => {
      if ("children" in item && item.type === "group") {
        const permittedChildren = item.children.filter(isPermitted);
        if (permittedChildren.length === 0) return null;
        return {
          ...item,
          children: permittedChildren,
        };
      }
      return isPermitted(item as SingleNavItem) ? item : null;
    })
    .filter((item): item is NavItem => item !== null);

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

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          // 1. Group Item (Documents, Finance, HR & Attendance)
          if ("children" in item && item.type === "group") {
            const GroupIcon = item.icon;
            const isGroupActive =
              item.children.some((child) =>
                child.exact
                  ? pathname === child.to
                  : pathname.startsWith(child.to),
              ) ||
              (item.label === "Reports" && pathname.startsWith("/reports"));
            const isOpen =
              openGroups[item.label] !== undefined
                ? openGroups[item.label]
                : isGroupActive;

            // Collapsed sidebar dropdown view
            if (collapsed) {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`flex w-full items-center justify-center rounded-md p-2 text-sm font-medium transition-colors ${
                        isGroupActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                      title={item.label}
                    >
                      <GroupIcon className="h-4 w-4 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-48 p-1.5 shadow-lg border-border"
                  >
                    <DropdownMenuLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    {item.children.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const subActive = subItem.exact
                        ? pathname === subItem.to
                        : pathname.startsWith(subItem.to);
                      return (
                        <DropdownMenuItem key={subItem.to} asChild>
                          <Link
                            href={subItem.to}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                              subActive
                                ? "bg-accent text-accent-foreground font-semibold"
                                : "text-popover-foreground hover:bg-accent/50"
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 opacity-80" />
                            <span>{subItem.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            // Expanded sidebar view
            return (
              <div key={item.label} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label, isGroupActive)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isGroupActive
                      ? "text-sidebar-foreground font-semibold bg-sidebar-accent/50"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon
                      className={`h-4 w-4 shrink-0 ${
                        isGroupActive ? "text-primary" : ""
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ease-in-out ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="ml-3.5 space-y-0.5 border-l border-sidebar-border/70 pl-2.5 pt-0.5 pb-1">
                      {item.children.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = subItem.exact
                          ? pathname === subItem.to
                          : pathname.startsWith(subItem.to);
                        return (
                          <Link
                            key={subItem.to}
                            href={subItem.to}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              subActive
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // 2. Single Link Item
          const singleItem = item as SingleNavItem;
          const Icon = singleItem.icon;
          const active = singleItem.exact
            ? pathname === singleItem.to
            : pathname.startsWith(singleItem.to);

          return (
            <Link
              key={singleItem.to}
              href={singleItem.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
              title={collapsed ? singleItem.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{singleItem.label}</span>}
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
