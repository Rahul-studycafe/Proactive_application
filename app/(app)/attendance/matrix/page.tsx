import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { MonthlyMatrixGrid } from "@/components/attendance/MonthlyMatrixGrid";

export const metadata = {
  title: "Monthly Attendance Matrix | Proactive SaaS",
  description:
    "31-day visual attendance matrix, staff payable days breakdown, and payroll export.",
};

export default function MonthlyMatrixPage() {
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
          31-day operational calendar view, statutory holiday tracking, and payable days audit.
        </p>
      </div>

      <MonthlyMatrixGrid />
    </div>
  );
}
