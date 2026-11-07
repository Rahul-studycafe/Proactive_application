"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServicesTable } from "./ServicesTable";
import { PackagesTable } from "./PackagesTable";
import { CreateServiceDialog } from "./CreateServiceDialog";
import { CreatePackageDialog } from "./CreatePackageDialog";
import { withPermission } from "@/components/shared/withPermission";
import { usePermissions, Can } from "@/contexts/PermissionsContext";

function ServicesPage() {
  const { can, isSuperAdmin } = usePermissions();

  const canViewServices = isSuperAdmin || can("service:view");
  const canViewPackages = isSuperAdmin || can("package:view");

  const defaultTab = canViewServices
    ? "services"
    : canViewPackages
      ? "packages"
      : "services";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Services & Packages
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your operational blueprints and commercial packages.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            {canViewServices && (
              <TabsTrigger value="services">Services (Blueprints)</TabsTrigger>
            )}
            {canViewPackages && (
              <TabsTrigger value="packages">Packages (Commercial)</TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center gap-2">
            <Can do="service:create">
              <CreateServiceDialog />
            </Can>
            <Can do="package:create">
              <CreatePackageDialog />
            </Can>
          </div>
        </div>

        {canViewServices && (
          <TabsContent value="services" className="m-0">
            <ServicesTable />
          </TabsContent>
        )}
        {canViewPackages && (
          <TabsContent value="packages" className="m-0">
            <PackagesTable />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export default withPermission(ServicesPage, ["service:view", "package:view"], {
  title: "Services Catalog Access Restricted",
  description:
    "You do not have permission to view services or packages. Please contact your Practice Administrator.",
  backHref: "/",
  backLabel: "Return to Dashboard",
});
