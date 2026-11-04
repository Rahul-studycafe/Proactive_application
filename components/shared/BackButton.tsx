"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  /** Target route URL to navigate back to */
  href?: string;
  /** Custom click handler (e.g. state reset or custom modal dismissal) */
  onClick?: () => void;
  /** Label to display next to the arrow icon (defaults to "Back") */
  label?: string;
  /** Optional right-side actions or buttons */
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
  /** Optional container class name */
  className?: string;
}

/**
 * Standard Proactive back button component.
 * Renders an inline back breadcrumb link with an ArrowLeft icon,
 * matching the established pattern across tasks, clients, and settings.
 */
export function BackButton({
  href,
  onClick,
  label = "Back",
  children,
  rightAction,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (!href) {
      router.back();
    }
  };

  const actionContent = rightAction || children;

  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm text-muted-foreground",
        className,
      )}
    >
      {href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{label}</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground cursor-pointer bg-transparent border-0 p-0 text-sm font-normal text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      )}

      {actionContent ? <div>{actionContent}</div> : null}
    </div>
  );
}
