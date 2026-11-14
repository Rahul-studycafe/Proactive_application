"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeSsoTicketMutation, useUpdateSsoOrganizationNameMutation } from "@/lib/services/api";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, Building2, Sparkles } from "lucide-react";
import Link from "next/link";

function SsoExchangeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticket = searchParams.get("ticket");
  const state = searchParams.get("state");

  const { setAuthToken } = useAuth();
  const [exchangeTicket, { isLoading }] = useExchangeSsoTicketMutation();
  const [updateOrgName, { isLoading: isUpdatingOrg }] = useUpdateSsoOrganizationNameMutation();

  const [status, setStatus] = useState<"verifying" | "onboarding" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [targetOrgName, setTargetOrgName] = useState<string>("");
  const [orgNameInput, setOrgNameInput] = useState<string>("");
  const [destinationPath, setDestinationPath] = useState<string>("/");
  const exchangedRef = React.useRef(false);

  useEffect(() => {
    if (!ticket) {
      setStatus("error");
      setErrorMessage("No SSO authentication ticket provided. Please launch Practice Management from your authorized platform.");
      return;
    }

    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const performExchange = async () => {
      try {
        console.log("[SSO Exchange] Starting ticket exchange for:", ticket);
        const result = await exchangeTicket({ ticket }).unwrap();
        console.log("[SSO Exchange] Successfully exchanged ticket:", result);

        if (result?.accessToken) {
          // Store tokens in localStorage matching existing PMS auth session
          localStorage.setItem("accessToken", result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem("refreshToken", result.refreshToken);
          }

          // Update AuthContext state
          setAuthToken(result.accessToken);

          const orgName = result.organization?.name || "";
          setTargetOrgName(orgName);
          setOrgNameInput(orgName);

          // Target destination
          const destination = result.redirectPath && result.redirectPath.startsWith("/")
            ? result.redirectPath
            : "/";
          setDestinationPath(destination);

          // If this is a newly provisioned organization, prompt for organization name!
          const isNew = result.isNewOrganization || result.organization?.isNewOrganization;
          if (isNew) {
            console.log("[SSO Exchange] New organization detected, prompting user for organization name");
            setStatus("onboarding");
          } else {
            setStatus("success");
            console.log("[SSO Exchange] Existing organization detected, navigating to:", destination);
            setTimeout(() => {
              window.location.replace(destination);
            }, 300);
          }
        } else {
          throw new Error("No session tokens returned from SSO exchange.");
        }
      } catch (err: any) {
        console.error("[SSO Exchange] Exchange error:", err);
        setStatus("error");
        setErrorMessage(
          err?.data?.error?.message ||
            err?.data?.message ||
            err?.message ||
            "Unable to verify Single Sign-On ticket. The ticket may have expired (valid for 60 seconds) or has already been used."
        );
      }
    };

    performExchange();
  }, [ticket, exchangeTicket, setAuthToken]);

  const handleSaveOrganizationName = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = orgNameInput.trim() || targetOrgName || "My Practice";

    try {
      if (finalName !== targetOrgName) {
        await updateOrgName({ name: finalName }).unwrap();
      }
      setTargetOrgName(finalName);
      setStatus("success");
      setTimeout(() => {
        window.location.replace(destinationPath);
      }, 300);
    } catch (err: any) {
      console.error("[SSO Exchange] Error updating organization name:", err);
      // Fallback to proceed even if update failed
      setStatus("success");
      setTimeout(() => {
        window.location.replace(destinationPath);
      }, 300);
    }
  };

  const handleSkipOrKeepDefault = () => {
    setStatus("success");
    setTimeout(() => {
      window.location.replace(destinationPath);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        {/* Brand Logo */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Verifying / Loading State */}
        {status === "verifying" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Connecting to Practice Management
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
                Verifying your secure single sign-on assertion and preparing your workspace...
              </p>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mx-auto mt-2">
              <div className="h-full bg-primary animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* Onboarding State: Prompt for Organization Name */}
        {status === "onboarding" && (
          <form onSubmit={handleSaveOrganizationName} className="space-y-5 animate-in fade-in duration-300 w-full text-left">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5 justify-center">
                <span>Name Your Workspace</span>
                <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Welcome to Practice Management! Enter the name of your CA firm or practice to finish setting up.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="orgName" className="text-xs font-semibold text-foreground">
                Practice / Firm Name <span className="text-primary">*</span>
              </label>
              <Input
                id="orgName"
                type="text"
                value={orgNameInput}
                onChange={(e) => setOrgNameInput(e.target.value)}
                placeholder="e.g. Rahul Chauhan & Associates"
                required
                autoFocus
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                You can always rename this anytime in Settings &gt; Practice Profile.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                type="submit"
                disabled={isUpdatingOrg || !orgNameInput.trim()}
                className="w-full gap-2 text-xs h-10 font-medium"
              >
                {isUpdatingOrg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Save &amp; Enter Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSkipOrKeepDefault}
                disabled={isUpdatingOrg}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Keep &ldquo;{targetOrgName || "Default"}&rdquo; &amp; Continue
              </Button>
            </div>
          </form>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Authentication Verified
              </h1>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
                {targetOrgName
                  ? `Entering ${targetOrgName}...`
                  : "Opening your practice workspace..."}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="space-y-4 animate-in fade-in duration-200 w-full">
            <div className="h-14 w-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Single Sign-On Failed
              </h1>
              <p className="text-xs text-muted-foreground mt-2 bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="sm" className="w-full gap-2 text-xs">
                  <span>Go to Standard Login</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PMS Practice Management. Secure Unified Authentication.
      </div>
    </div>
  );
}

export default function SsoExchangePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SsoExchangeContent />
    </Suspense>
  );
}
