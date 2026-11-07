"use client";

import { RoleEditorPageContent } from "@/components/settings/RoleEditorPageContent";
import { withPermission } from "@/components/shared/withPermission";

function CreateRolePage() {
  return <RoleEditorPageContent roleId="new" />;
}

export default withPermission(
  CreateRolePage,
  ["role:manage", "settings:manage"],
  {
    title: "Role Creation Restricted",
    description:
      "You do not have permission to create custom roles. Please contact your Practice Administrator.",
    backHref: "/settings?module=user-roles",
    backLabel: "Return to User Roles",
  },
);
