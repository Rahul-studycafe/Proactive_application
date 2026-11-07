"use client";

import { WorkingDaysView } from "@/components/settings/WorkingDaysView";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { withPermission } from "@/components/shared/withPermission";

function WorkingDaysPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Working Days & Office Perimeter" },
        ]}
      />
      <WorkingDaysView />
    </div>
  );
}

export default withPermission(WorkingDaysPage, "settings:manage", {
  title: "Working Days Settings Restricted",
  description:
    "You do not have permission to configure working hours and attendance policies. Please contact your Practice Administrator.",
  backHref: "/settings",
  backLabel: "Return to Settings",
});
