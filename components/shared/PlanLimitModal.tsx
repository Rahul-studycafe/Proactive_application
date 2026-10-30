"use client";

import { AlertTriangle, ArrowUpRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  limitType?: "users" | "clients" | "storage" | "feature";
  currentCount?: number;
  maxLimit?: number;
  planTier?: string;
}

export function PlanLimitModal({
  open,
  onOpenChange,
  title,
  description,
  limitType = "clients",
  currentCount,
  maxLimit,
  planTier = "Starter",
}: PlanLimitModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/settings/subscription");
  };

  const getLimitLabel = () => {
    switch (limitType) {
      case "users":
        return "Staff User Seats";
      case "clients":
        return "Active Client Accounts";
      case "storage":
        return "Cloud Document Storage";
      case "feature":
        return "Enterprise Feature";
      default:
        return "Subscription Limit";
    }
  };

  const defaultDescription =
    description ||
    `Your organization has reached the limit for ${getLimitLabel()} on the ${planTier} plan. Upgrade to unlock higher quotas and advanced multi-branch features.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            {title || `${getLimitLabel()} Limit Reached`}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {currentCount !== undefined && maxLimit !== undefined && (
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Current Usage:</span>
              <span className="text-foreground">
                {currentCount} / {maxLimit} ({Math.min(100, Math.round((currentCount / maxLimit) * 100))}%)
              </span>
            </div>
            <Progress
              value={Math.min(100, (currentCount / maxLimit) * 100)}
              className="h-2 [&>div]:bg-destructive"
            />
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Stay on {planTier}
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-primary-foreground gap-1.5"
          >
            <Zap className="h-4 w-4 fill-current" />
            Upgrade Plan
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

