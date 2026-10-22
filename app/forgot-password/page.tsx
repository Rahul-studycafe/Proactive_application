"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useForgotPasswordMutation } from "@/lib/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [apiError, setApiError] = useState("");
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!email) {
      setApiError("Email is required");
      return;
    }

    try {
      const data = await forgotPassword({ email }).unwrap();
      setIsSubmitted(true);
    } catch (err: any) {
      setApiError(
        err.data?.message || "Failed to send reset link. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-foreground relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card text-card-foreground rounded-3xl shadow-xl p-8 lg:p-10 border border-border">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {isSubmitted ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Mail size={32} />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight">
              Check your email
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              We sent a password reset link to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
              The link will expire in 15 minutes.
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-full bg-secondary text-secondary-foreground py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Reset password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {apiError && (
              <div className="mb-6 rounded-xl bg-destructive/15 p-4 text-sm text-destructive border border-destructive/30">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-background border border-input focus:border-ring rounded-full outline-none py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full cursor-pointer text-primary-foreground rounded-full py-3 font-medium transition-colors ${
                  isLoading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ArrowLeft size={16} />
                  Back to login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
