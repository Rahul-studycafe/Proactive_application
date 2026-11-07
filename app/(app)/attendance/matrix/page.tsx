"use client";

import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { MonthlyMatrixGrid } from "@/components/attendance/MonthlyMatrixGrid";
import { MyAttendanceDesk } from "@/components/attendance/MyAttendanceDesk";
import { usePermissions } from "@/contexts/PermissionsContext";
import { withPermission } from "@/components/shared/withPermission";

function MonthlyMatrixPage() {
  return (
    <div className="space-y-6 pb-20">
      <Breadcrumbs
        items={[
          { label: "Attendance", href: "/attendance" },
          { label: "Matrix" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Monthly Attendance Matrix
        </h1>
        <p className="text-sm text-muted-foreground">
          31-day operational calendar view, statutory holiday tracking, and
          payable days audit.
        </p>
      </div>

      <MonthlyMatrixGrid />
    </div>
  );
}

function MonthlyMatrixGateway() {
  const { can, isSuperAdmin } = usePermissions();
  const canViewMatrix =
    isSuperAdmin ||
    can("attendance:matrix_view") ||
    can("attendance:matrix_view_self") ||
    can("attendance:view_all");

  if (!canViewMatrix) {
    return <MyAttendanceDesk />;
  }

  return <MonthlyMatrixPage />;
}

export default withPermission(
  MonthlyMatrixGateway,
  [
    "attendance:matrix_view",
    "attendance:matrix_view_self",
    "attendance:view_all",
    "attendance:view_self",
  ],
  {
    title: "Attendance Matrix Restricted",
    description:
      "You do not have permission to view the monthly attendance matrix. Please contact your Practice Administrator.",
    backHref: "/attendance",
    backLabel: "Return to Attendance",
  },
);
