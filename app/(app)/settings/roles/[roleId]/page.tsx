"use client";

import { useParams } from "next/navigation";
import { RoleEditorPageContent } from "@/components/settings/RoleEditorPageContent";
import { withPermission } from "@/components/shared/withPermission";

function EditRolePage() {
  const params = useParams();
  const roleId = params?.roleId as string;

  return <RoleEditorPageContent roleId={roleId} />;
}

export default withPermission(
  EditRolePage,
  ["role:manage", "role:view", "settings:manage"],
  {
    title: "Role Configuration Restricted",
    description:
      "You do not have permission to view or modify roles. Please contact your Practice Administrator.",
    backHref: "/settings?module=user-roles",
    backLabel: "Return to User Roles",
  },
);
