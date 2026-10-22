"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedCharacters, type CharMode } from "./AnimatedCharacters";
import { Logo } from "./ui/logo";
import { useLoginMutation } from "../lib/services/api";

import { ThemeToggle } from "./ui/theme-toggle";

import { useAuth } from "../contexts/AuthContext";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [apiError, setApiError] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const router = useRouter();
  const { setAuthToken, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const [login, { isLoading }] = useLoginMutation();

  const mode: CharMode =
    submitState === "success"
      ? "success"
      : submitState === "error"
        ? "error"
        : pwFocused && !showPw
          ? "hidden"
          : email.length > 0
            ? "typing"
            : "idle";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSubmitState("idle");

    try {
      const result = await login({ email, password }).unwrap();
      setSubmitState("success");
      // Store tokens
      if (result?.accessToken) {
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
        setAuthToken(result.accessToken);
      }
      router.push("/"); // redirect to dashboard root

      console.log("Login Success");
    } catch (err: any) {
      setSubmitState("error");
      setApiError(
        err?.data?.error?.message ||
          err.message ||
          "An error occurred during login.",
      );
      setTimeout(() => setSubmitState("idle"), 2400);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex items-center justify-center overflow-hidden relative">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full h-full grid md:grid-cols-2 overflow-hidden bg-card border border-border shadow-2xl relative">
        {/* Left: illustration */}
        <div className="bg-muted/30 hidden md:flex items-end justify-center p-8 pb-12 relative border-r border-border">
          <AnimatedCharacters mode={mode} />
        </div>

        {/* Right: form */}
        <div className="bg-card p-6 sm:p-6 lg:py-6 lg:px-16 flex flex-col justify-center overflow-y-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <Logo />
            <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your details to log in.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {apiError && (
              <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm p-3 rounded-md mb-4 text-center">
                {apiError}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Mail size={18} />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email id"
                className="w-full bg-background border border-input focus:border-ring rounded-full outline-none py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="Password"
                className={`w-full bg-background border ${submitState === "error" ? "border-destructive focus:border-destructive" : "border-input focus:border-ring"} rounded-full outline-none py-3 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-primary"
                />
                Remember for 30 days
              </label>
              <Link
                href="/forgot-password"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
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
              {isLoading ? "Logging in..." : "Log In"}
            </button>

            <button
              type="button"
              className="w-full cursor-pointer bg-secondary text-secondary-foreground border border-border rounded-full py-3 font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors"
            >
              <GoogleG />
              Log in with Google
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Don't have an account?{" "}
            <a
              href={`${process.env.NEXT_PUBLIC_MAIN_URL || "http://localhost:3000"}/signup`}
              className="text-foreground font-semibold hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
