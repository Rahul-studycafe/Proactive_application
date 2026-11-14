import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Returns the base URL of the backend server (without /api/v1).
 * e.g., https://api-pms.automationcafe.in or http://localhost:5050
 */
export function getApiBaseUrl(): string {
  const envUrl = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
  }

  return "http://localhost:5050";
}

/**
 * Returns the full API endpoint base URL (with /api/v1).
 * e.g., https://api-pms.automationcafe.in/api/v1 or http://localhost:5050/api/v1
 */
export function getApiUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, "");
    return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
  }
  return `${getApiBaseUrl()}/api/v1`;
}

/**
 * Formats a relative asset/upload path into an absolute URL pointing to the backend.
 * Handles leading slashes and pre-existing absolute URLs (http/https).
 */
export function getAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
