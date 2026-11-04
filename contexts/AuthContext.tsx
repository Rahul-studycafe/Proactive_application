"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useGetMeQuery } from "../lib/services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Accountant" | "Staff" | "Team Leader";
  tenant: string;
  joinDate: string;
  workspace: string;
  phone: string;
  location: string;
  bio: string;
  initials: string;
  plan: string;
  avatar?: string;
  isOwner?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Read token from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("accessToken"));
    }
    setIsInitialized(true);
  }, []);

  // Silent proactive refresh timer: keeps user seamlessly logged in before access token expires
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (typeof window === "undefined") return;
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      if (!accessToken || !refreshToken) return;

      try {
        const payloadBase64 = accessToken.split(".")[1];
        if (!payloadBase64) return;
        const decoded = JSON.parse(atob(payloadBase64));
        const expMs = decoded.exp * 1000;
        const now = Date.now();
        // If access token expires in less than 3 minutes (or already expired)
        if (expMs - now < 3 * 60 * 1000) {
          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
          const res = await fetch(`${baseUrl}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.ok) {
            const json = await res.json();
            const payload = json.data || json;
            if (payload?.accessToken) {
              localStorage.setItem("accessToken", payload.accessToken);
              if (payload?.refreshToken) {
                localStorage.setItem("refreshToken", payload.refreshToken);
              }
              setToken(payload.accessToken);
            }
          }
        }
      } catch {
        // Silent catch: baseQueryWithReauth will handle reactive 401 refresh on demand
      }
    };

    const interval = setInterval(checkAndRefreshToken, 60 * 1000);
    checkAndRefreshToken();

    return () => clearInterval(interval);
  }, []);

  const {
    data,
    isLoading: isQueryLoading,
    isFetching,
    isError,
  } = useGetMeQuery(undefined, {
    skip: !token, // Only fetch if token exists
  });

  // Loading state: we are loading if we haven't checked localStorage yet,
  // OR if we have a token and the query is still fetching.
  const isAuthLoading =
    !isInitialized || (!!token && (isQueryLoading || isFetching) && !data);

  let user: AuthUser | null = null;

  if (data?.user) {
    const backendUser = data.user;
    user = {
      id: backendUser._id || backendUser.id,
      name: backendUser.name || backendUser.username,
      email: backendUser.email,
      role: backendUser.roleId?.name || "Admin",
      tenant: backendUser.tenantId?.name || "Workspace",
      joinDate: backendUser.createdAt,
      workspace: backendUser.tenantId?.name || "Default Workspace",
      phone: backendUser.phone || "",
      location: backendUser.location || "",
      bio: backendUser.bio || "",
      plan: backendUser.tenantId?.plan?.razorpaySubscriptionId
        ? "Premium"
        : "Free",
      avatar: backendUser.photoUrl
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${backendUser.photoUrl}`
        : undefined,
      initials: (
        backendUser.name?.[0] ||
        backendUser.email?.[0] ||
        "U"
      ).toUpperCase(),
      isOwner: backendUser.isOwner || false,
    };
  }

  const setAuthToken = (newToken: string) => {
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    if (isError) {
      logout();
    }
  }, [isError]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isAuthLoading,
        setAuthToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
