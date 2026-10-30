"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  QrCode,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Copy,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useGetGatewayConfigsQuery,
  useUpsertGatewayConfigMutation,
} from "@/lib/services/api";

const PROVIDERS = [
  { value: "Razorpay", label: "Razorpay (Cards, NetBanking, UPI, Auto-Settlement)", isGateway: true },
  { value: "Cashfree", label: "Cashfree Payments (PG + Direct UPI)", isGateway: true },
  { value: "UPI_Direct", label: "Direct Firm UPI VPA (Zero Gateway Fee)", isGateway: false },
];

export default function PaymentGatewaysPage() {
  const { data: configs = [], isLoading } = useGetGatewayConfigsQuery();
  const [upsertConfig, { isLoading: isSaving }] = useUpsertGatewayConfigMutation();

  const [provider, setProvider] = useState("Razorpay");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [acceptedModes, setAcceptedModes] = useState<string[]>(["UPI", "Card", "Netbanking"]);

  // Populate state when configs load
  useEffect(() => {
    if (configs && configs.length > 0) {
      const active = configs.find((c: any) => c.provider === provider) || configs[0];
      if (active) {
        setProvider(active.provider);
        setKeyId(active.keyId || "");
        setUpiVpa(active.upiVpa || "");
        setMerchantName(active.merchantName || "");
        setIsEnabled(active.isEnabled ?? true);
        if (active.acceptedModes?.length) {
          setAcceptedModes(active.acceptedModes);
        }
      }
    }
  }, [configs, provider]);

  const handleToggleMode = (mode: string) => {
    if (acceptedModes.includes(mode)) {
      if (acceptedModes.length > 1) {
        setAcceptedModes(acceptedModes.filter((m) => m !== mode));
      } else {
        toast.error("At least one payment mode must be enabled");
      }
    } else {
      setAcceptedModes([...acceptedModes, mode]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertConfig({
        provider,
        isEnabled,
        keyId: keyId.trim(),
        keySecret: keySecret ? keySecret.trim() : undefined,
        webhookSecret: webhookSecret ? webhookSecret.trim() : undefined,
        upiVpa: upiVpa.trim(),
        merchantName: merchantName.trim(),
        acceptedModes,
      }).unwrap();

      toast.success(`${provider} configuration saved successfully!`);
      setKeySecret("");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.data?.message || "Failed to save gateway config");
    }
  };

  const isGateway = provider !== "UPI_Direct";
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/v1/client-payments/webhook` : "/api/v1/client-payments/webhook";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Payment Gateway & Dynamic UPI Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure merchant keys, instant UPI QR generation, and automated webhook reconciliation for client payments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Configuration Form (Left 8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Merchant Provider Configuration</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="gateway-enable" className="text-xs font-normal text-muted-foreground">Active</Label>
                    <Switch id="gateway-enable" checked={isEnabled} onCheckedChange={setIsEnabled} />
                  </div>
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose your payment processing channel for digital client invoicing.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Provider Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Gateway / Payment Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Merchant Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="merchant-name" className="text-xs font-semibold">Firm / Merchant Legal Name</Label>
                  <Input
                    id="merchant-name"
                    placeholder="e.g. Sharma & Co. Chartered Accountants"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This business name is displayed on client payment checkout pages and UPI screens.
                  </p>
                </div>

                {/* UPI VPA Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="upi-vpa" className="text-xs font-semibold">Direct UPI VPA ID</Label>
                  <Input
                    id="upi-vpa"
                    placeholder="e.g. sharmaca@hdfcbank or 9876543210@upi"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Invoices will render a dynamic NPCI QR code linked to this handle for instant zero-fee settlement.
                  </p>
                </div>

                {/* Gateway Keys (Only for Razorpay / Cashfree) */}
                {isGateway && (
                  <div className="space-y-4 pt-3 border-t">
                    <div className="space-y-1.5">
                      <Label htmlFor="key-id" className="text-xs font-semibold">{provider} Key ID (API Key)</Label>
                      <Input
                        id="key-id"
                        placeholder="rzp_live_xxxxxxxxxxxxxx"
                        value={keyId}
                        onChange={(e) => setKeyId(e.target.value)}
                        className="text-xs font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="key-secret" className="text-xs font-semibold">{provider} Key Secret</Label>
                      <div className="relative">
                        <Input
                          id="key-secret"
                          type={showKeySecret ? "text" : "password"}
                          placeholder={configs.some((c: any) => c.provider === provider && c.hasSecret) ? "•••••••••••• (Encrypted)" : "Enter secret key"}
                          value={keySecret}
                          onChange={(e) => setKeySecret(e.target.value)}
                          className="text-xs font-mono pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeySecret(!showKeySecret)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                          {showKeySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Secrets are cryptographically encrypted at rest with AES-256-CBC.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="webhook-secret" className="text-xs font-semibold">Webhook Secret (Optional for HMAC verification)</Label>
                      <Input
                        id="webhook-secret"
                        type="password"
                        placeholder="Enter webhook secret if configured in gateway dashboard"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Accepted Payment Modes */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-xs font-semibold">Accepted Payment Channels</Label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {["UPI", "Card", "Netbanking"].map((mode) => (
                      <div key={mode} className="flex items-center gap-2">
                        <Checkbox
                          id={`mode-${mode}`}
                          checked={acceptedModes.includes(mode)}
                          onCheckedChange={() => handleToggleMode(mode)}
                        />
                        <Label htmlFor={`mode-${mode}`} className="text-xs cursor-pointer font-normal">
                          {mode === "UPI" ? "UPI (GPay / PhonePe / BHIM)" : mode === "Card" ? "Debit / Credit Cards" : "Net Banking"}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t flex justify-end">
                <Button type="submit" disabled={isSaving} className="gap-2 text-xs shadow-xs">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Gateway Credentials
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Webhook Configuration Guide Card */}
          {isGateway && (
            <Card className="border-border/80 shadow-xs bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 font-bold">
                  <Shield className="h-4 w-4 text-primary" /> Automated Webhook Settlement Endpoint
                </CardTitle>
                <CardDescription className="text-xs">
                  Copy this public webhook URL to your {provider} dashboard under <strong>Settings → Webhooks</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Input readOnly value={webhookUrl} className="font-mono text-xs bg-background h-8" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      toast.success("Webhook URL copied to clipboard!");
                    }}
                    className="gap-1 h-8 text-xs shrink-0"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Select events: <code>payment.captured</code> and <code>order.paid</code>. Webhooks are idempotently auto-reconciled under ACID transactions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Live UPI Preview Pane (Right 4/12) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <Card className="border-border/80 shadow-md bg-card">
            <CardHeader className="pb-3 text-center">
              <Badge variant="outline" className="mx-auto text-[10px] uppercase font-mono tracking-wider">
                Live Invoice Preview
              </Badge>
              <CardTitle className="text-sm font-bold mt-2">
                Dynamic UPI Scan-to-Pay
              </CardTitle>
              <CardDescription className="text-xs">
                How clients see your payment prompt on generated invoices.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center text-xs">
              {/* Simulated QR Box */}
              <div className="p-4 bg-muted/40 border-2 border-dashed rounded-xl inline-block mx-auto">
                <div className="h-36 w-36 bg-background rounded-lg border flex flex-col items-center justify-center p-2 shadow-xs">
                  <QrCode className="h-24 w-24 text-foreground/80" />
                  <span className="text-[9px] font-mono text-muted-foreground mt-1">NPCI UPI Compliant</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground text-xs block">
                  {merchantName || "Your Practice Name"}
                </span>
                <span className="font-mono text-[11px] text-primary block bg-primary/10 py-1 px-2 rounded-md">
                  {upiVpa || "yourvpa@bank"}
                </span>
              </div>

              {/* Supported UPI Apps Row */}
              <div className="pt-2 border-t text-muted-foreground text-[10px] space-y-1">
                <span>Instant Mobile Settlement via</span>
                <div className="flex items-center justify-center gap-2 pt-1 font-semibold text-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted">GPay</span>
                  <span className="px-2 py-0.5 rounded bg-muted">PhonePe</span>
                  <span className="px-2 py-0.5 rounded bg-muted">Paytm</span>
                  <span className="px-2 py-0.5 rounded bg-muted">BHIM</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

