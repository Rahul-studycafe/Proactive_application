"use client";

import { HolidaysView } from "@/components/holidays/HolidaysView";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { withPermission } from "@/components/shared/withPermission";

function HolidaysPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Holidays & Gazettes" },
        ]}
      />
      <HolidaysView />
    </div>
  );
}

export default withPermission(HolidaysPage, "settings:manage", {
  title: "Holidays Settings Restricted",
  description:
    "You do not have permission to manage organization holidays. Please contact your Practice Administrator.",
  backHref: "/settings",
  backLabel: "Return to Settings",
});
