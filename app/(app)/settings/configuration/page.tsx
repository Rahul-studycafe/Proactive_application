"use client";

import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { TenantConfigurationView } from "@/components/settings/TenantConfigurationView";

export default function ConfigurationSettingsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Organization Configuration" },
        ]}
      />
      <TenantConfigurationView />
    </div>
  );
}

