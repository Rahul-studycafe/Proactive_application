"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRevealPasswordMutation } from "@/lib/services/api";
import { ClientPassword, RevealPasswordResponse } from "@/lib/types/passwords";
import {
  ShieldAlert,
  Copy,
  Check,
  Eye,
  ExternalLink,
  ShieldCheck,
  Lock,
  User,
  History,
  AlertTriangle,
} from "lucide-react";

interface RevealPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: ClientPassword | null;
  onAuditLogsClick?: () => void;
}

export function RevealPasswordDialog({
  open,
  onOpenChange,
  credential,
  onAuditLogsClick,
}: RevealPasswordDialogProps) {
  const [purpose, setPurpose] = useState("Portal Login / Statutory Filing");
  const [revealedData, setRevealedData] = useState<RevealPasswordResponse | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);

  const [revealPassword, { isLoading }] = useRevealPasswordMutation();

  useEffect(() => {
    if (open) {
      setRevealedData(null);
      setCopiedPass(false);
      setCopiedUser(false);
      setPurpose("Portal Login / Statutory Filing");
    }
  }, [open, credential]);

  const handleReveal = async () => {
    if (!credential) return;

    try {
      const res = await revealPassword({
        id: credential._id,
        purpose: purpose.trim() || "Portal Login / Client Operations",
      }).unwrap();

      setRevealedData(res);
      toast.success("Password decrypted. Access attempt logged in audit trail.");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to decrypt password";
      toast.error(msg);
    }
  };

  const handleCopyPassword = async () => {
    if (!revealedData?.password) return;
    try {
      await navigator.clipboard.writeText(revealedData.password);
      setCopiedPass(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopiedPass(false), 2500);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const handleCopyUsername = async () => {
    const userToCopy = revealedData?.username || credential?.username;
    if (!userToCopy) return;
    try {
      await navigator.clipboard.writeText(userToCopy);
      setCopiedUser(true);
      toast.success("Username copied to clipboard");
      setTimeout(() => setCopiedUser(false), 2500);
    } catch {
      toast.error("Failed to copy username");
    }
  };

  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                Decrypted Password Reveal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {credential.portalName} • <span className="font-mono">{credential.username}</span>
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!revealedData ? (
            /* Prompt for purpose before decryption */
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Security Compliance Notice</p>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Revealing statutory passwords decrypts client credentials and creates a permanent, immutable audit log with your User ID, IP address, and timestamp.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Reason / Purpose for Decryption
                </Label>
                <Input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Filing GSTR-3B, Income Tax e-verification"
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReveal}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white min-w-[130px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Decrypting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>Reveal Password</span>
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Revealed Plaintext Password Screen */
            <div className="space-y-4">
              {/* Username row */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/60">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Username
                  </p>
                  <p className="font-mono text-sm font-medium text-foreground select-all">
                    {revealedData.username}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUsername}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copiedUser ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Check className="h-3.5 w-3.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </span>
                  )}
                </Button>
              </div>

              {/* Password row */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-background via-muted/30 to-background border-2 border-primary/30 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Plaintext Password
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Decrypted from Vault
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-lg font-bold text-foreground tracking-wide select-all break-all">
                    {revealedData.password}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3.5 font-medium"
                  >
                    {copiedPass ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Check className="h-4 w-4" /> Copied!
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs">
                        <Copy className="h-4 w-4" /> Copy Password
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* External Portal Link if present */}
              {revealedData.portalUrl && (
                <div className="flex justify-end">
                  <a
                    href={revealedData.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <span>Launch {revealedData.portalName}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* Security Audit Trail Confirmation */}
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                <span className="text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Access recorded in statutory audit trail.
                </span>
                {onAuditLogsClick && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onAuditLogsClick();
                    }}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                  >
                    <History className="h-3 w-3" /> View Log
                  </button>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto"
                >
                  Close & Mask
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
