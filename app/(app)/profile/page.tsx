"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-sm text-muted-foreground animate-pulse">
        Redirecting to Profile settings...
      </div>
    </div>
  );
}
