"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useResendDocumentRequestMutation } from "@/lib/services/api";
import { DocumentRequest } from "@/lib/types/document-request";
import {
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

interface MagicLinkShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: (DocumentRequest & { uploadUrl?: string; emailDispatched?: boolean }) | null;
}

export function MagicLinkShareDialog({
  open,
  onOpenChange,
  request,
}: MagicLinkShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [resendEmail, { isLoading: isResending }] = useResendDocumentRequestMutation();

  if (!request) return null;

  const frontendUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:8080";

  const uploadUrl =
    request.uploadUrl || `${frontendUrl}/public/upload/${request.token}`;

  const clientName =
    typeof request.clientId === "object" ? request.clientId.name : "Client";
  const clientEmail =
    typeof request.clientId === "object" ? request.clientId.email : undefined;
  const clientPhone =
    typeof request.clientId === "object" ? request.clientId.mobile : undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      toast.success("Magic upload link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link. Please select and copy manually.");
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendEmail(request._id).unwrap();
      toast.success(
        res.emailDispatched
          ? "Reminder email sent to client with secure magic link!"
          : "Magic link ready (client email address not registered)."
      );
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to dispatch email reminder");
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${clientName},\n\nPlease upload the requested documents for "${request.title}" using our secure client upload portal:\n\n${uploadUrl}\n\nThank you!`
    );
    const phoneParam = clientPhone ? `&phone=${encodeURIComponent(clientPhone.replace(/\D/g, ""))}` : "";
    window.open(`https://api.whatsapp.com/send?text=${text}${phoneParam}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">Share Document Upload Portal</DialogTitle>
              <DialogDescription>
                Zero-friction passwordless upload link for your client.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Metadata banner */}
          <div className="rounded-xl border bg-muted/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary">
                #{request.requestNo}
              </span>
              <Badge variant="outline" className="text-xs">
                {request.status}
              </Badge>
            </div>
            <div className="font-semibold text-sm text-foreground">
              {request.title}
            </div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
              <span>Client: <strong className="text-foreground">{clientName}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Expires {new Date(request.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </div>

          {/* Copy Magic Link Input Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Client Public Upload URL
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={uploadUrl}
                className="font-mono text-xs bg-muted/40"
                id="magic-link-input"
              />
              <Button
                type="button"
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-9"
                id="copy-magic-link-btn"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 h-9 text-xs border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              Share on WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
              className="flex items-center justify-center gap-1.5 h-9 text-xs"
            >
              <Send className={`h-3.5 w-3.5 text-primary ${isResending ? "animate-pulse" : ""}`} />
              {isResending ? "Dispatching..." : clientEmail ? "Email Client Link" : "Email Link"}
            </Button>
          </div>

          {/* Checklist Items Preview */}
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Requested Files Checklist ({request.items?.length || 0})</span>
            </div>
            <div className="rounded-lg border divide-y max-h-36 overflow-y-auto text-xs">
              {request.items?.map((it, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground line-clamp-1">{it.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] py-0 px-1.5 ${
                      it.status === "Uploaded"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {it.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Open Portal in New Tab
              </a>
            </Button>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
