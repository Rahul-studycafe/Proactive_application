import { HolidaysView } from "@/components/holidays/HolidaysView";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata = {
  title: "Official Holidays | Proactive SaaS",
  description: "Configure official office holidays and closures.",
};

export default function HolidaysPage() {
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
