import { HolidaysView } from "@/components/holidays/HolidaysView";
import { BackButton } from "@/components/shared/BackButton";
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
      <BackButton href="/settings" label="Back to Settings" />
      <HolidaysView />
    </div>
  );
}
