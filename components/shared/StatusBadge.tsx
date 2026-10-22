import { Badge } from "@/components/ui/badge";

export type StatusType =
  | "active"
  | "pending"
  | "completed"
  | "inactive"
  | "error"
  | "warning";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let badgeColorClass = "";

  switch (normalizedStatus) {
    case "active":
    case "completed":
    case "success":
      variant = "default";
      badgeColorClass =
        "bg-success/15 text-success hover:bg-success/25 border-success/30";
      break;
    case "pending":
    case "warning":
    case "in progress":
      variant = "secondary";
      badgeColorClass =
        "bg-warning/15 text-warning-foreground hover:bg-warning/25 border-warning/30";
      break;
    case "error":
    case "failed":
    case "inactive":
      variant = "destructive";
      badgeColorClass =
        "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/30";
      break;
    default:
      variant = "outline";
      badgeColorClass =
        "bg-muted text-muted-foreground hover:bg-muted/80 border-border";
  }

  const displayLabel =
    label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant={variant}
      className={`${badgeColorClass} ${className || ""}`}
    >
      {displayLabel}
    </Badge>
  );
}
