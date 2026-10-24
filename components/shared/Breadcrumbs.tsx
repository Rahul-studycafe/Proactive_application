"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbSegment {
  /** Display label for the breadcrumb item */
  label: string;
  /** Optional target URL (if omitted or item is last, renders as current page) */
  href?: string;
  /** Optional icon to render next to the label */
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export interface BreadcrumbsProps {
  /** Ordered list of breadcrumb items from root to current page */
  items: BreadcrumbSegment[];
  /** Optional container class name */
  className?: string;
  /** Whether to show a root Home icon (defaults to false) */
  showHome?: boolean;
  /** Optional right-side actions or controls (e.g. export button, date selector) */
  rightAction?: React.ReactNode;
}

/**
 * Common hierarchical breadcrumb component for pages 2+ levels deep.
 * Standardizes navigation across nested modules (e.g. Attendance > Matrix > Summary).
 */
export function Breadcrumbs({
  items,
  className,
  showHome = false,
  rightAction,
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm",
        className
      )}
    >
      <Breadcrumb>
        <BreadcrumbList className="flex items-center gap-1.5 sm:gap-2">
          {showHome && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only">Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              </BreadcrumbSeparator>
            </>
          )}

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const Icon = item.icon;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage className="font-semibold text-foreground flex items-center gap-1.5">
                      {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
                      <span>{item.label}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{item.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>

                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
}
