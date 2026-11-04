"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useVerifyInviteQuery,
  useActivateInviteMutation,
} from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    data: inviteData,
    isLoading,
    isError,
    error,
  } = useVerifyInviteQuery(token, {
    skip: !token,
  });

  const [activateInvite, { isLoading: isActivating }] =
    useActivateInviteMutation();

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Missing Invitation Token
        </h2>
        <p className="text-sm text-muted-foreground">
          No invitation token was found in the link. Please check the email you
          received and click the link again.
        </p>
        <Link href="/login">
          <Button variant="outline" className="mt-4">
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center space-y-4 py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          Verifying invitation link...
        </p>
      </div>
    );
  }

  if (isError || !inviteData) {
    const errorMsg =
      (error as any)?.data?.message ||
      "This invitation link is invalid or has expired.";
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Invitation Expired or Invalid
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {errorMsg}
        </p>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="outline">Back to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      await activateInvite({
        token,
        password,
        confirmPassword,
      }).unwrap();
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login?activated=true");
      }, 2000);
    } catch (err: any) {
      setFormError(
        err?.data?.message || "Failed to activate account. Please try again.",
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Account Activated!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your password has been set. Redirecting you to sign in...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Team Invitation</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to {inviteData.organizationName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up a password for{" "}
          <strong className="text-foreground">{inviteData.email}</strong> to
          activate your staff account.
        </p>
      </div>

      {formError && (
        <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Create Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
              disabled={isActivating}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isActivating}
          />
        </div>

        <Button
          type="submit"
          className="w-full gap-2 font-medium"
          disabled={isActivating}
        >
          {isActivating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Activating Account...</span>
            </>
          ) : (
            <>
              <span>Activate & Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-xl p-8">
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <ActivateContent />
        </Suspense>
      </div>
    </div>
  );
}
