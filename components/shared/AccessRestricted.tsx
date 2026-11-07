"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccessRestrictedProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function AccessRestricted({
  title = "Access Restricted",
  description = "You do not have administrative permissions to view or configure this section. Please contact your Practice Administrator or Super Admin if you require access.",
  backHref = "/",
  backLabel = "Return to Dashboard",
}: AccessRestrictedProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in-50">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs mb-4">
        <Lock className="h-8 w-8" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {backHref ? (
          <Link href={backHref}>
            <Button variant="default" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              <span>{backLabel}</span>
            </Button>
          </Link>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Button>
        )}

        <Link href="/settings/profile">
          <Button variant="outline" size="sm" className="gap-2">
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
