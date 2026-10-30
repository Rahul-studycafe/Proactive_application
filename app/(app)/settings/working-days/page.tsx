import { WorkingDaysView } from "@/components/settings/WorkingDaysView";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata = {
  title: "Working Days & Weekends | Proactive SaaS",
  description: "Configure standard working hours and alternate weekend rules.",
};

export default function WorkingDaysPage() {
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
