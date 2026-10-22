"use client";

import { useState, Suspense } from "react";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useResetPasswordMutation } from "@/lib/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!token) {
      setApiError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    if (password.length < 6) {
      setApiError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      setIsSuccess(true);
      // Wait a few seconds then redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setApiError(
        err.data?.message ||
          "Failed to reset password. The link might have expired.",
      );
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          No reset token found. Please request a new password reset link.
        </div>
        <Link
          href="/forgot-password"
          className="inline-block w-full rounded-full bg-[#111] py-3 text-sm font-medium text-white hover:bg-black transition-colors"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success border border-success/30">
          <Lock size={32} />
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Password Reset Successfully
        </h2>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          Your password has been successfully updated. Redirecting you to
          login...
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
          Create new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Please enter your new password below. Make sure it's at least 6
          characters.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 rounded-xl bg-destructive/15 p-4 text-sm text-destructive border border-destructive/30">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock size={18} />
          </div>
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-background border border-input focus:border-ring rounded-full outline-none py-3 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 transition-colors"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock size={18} />
          </div>
          <input
            type={showConfirmPw ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-background border border-input focus:border-ring rounded-full outline-none py-3 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPw((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 transition-colors"
          >
            {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full cursor-pointer text-primary-foreground rounded-full py-3 font-medium transition-colors ${
              isLoading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-foreground relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-xl p-8 lg:p-10 border border-border">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground py-10">
              Loading...
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
