"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  Shield,
  Save,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Building2,
  Sparkles,
  Smartphone,
  Banknote,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useGetGatewayConfigsQuery,
  useUpsertGatewayConfigMutation,
} from "@/lib/services/api";

export default function PaymentGatewaysPage() {
  const { data: configs = [], isLoading } = useGetGatewayConfigsQuery();
  const [upsertConfig, { isLoading: isSaving }] =
    useUpsertGatewayConfigMutation();

  const [upiVpa, setUpiVpa] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [acceptedModes, setAcceptedModes] = useState<string[]>([
    "UPI",
    "BankTransfer",
  ]);

  // Populate state when configs load
  useEffect(() => {
    if (configs && configs.length > 0) {
      const active = configs[0];
      if (active) {
        setUpiVpa(active.upiVpa || "");
        setMerchantName(active.merchantName || "");
        setIsEnabled(active.isEnabled ?? true);
        if (active.acceptedModes?.length) {
          setAcceptedModes(active.acceptedModes);
        }
      }
    }
  }, [configs]);

  const handleToggleMode = (mode: string) => {
    if (acceptedModes.includes(mode)) {
      if (acceptedModes.length > 1) {
        setAcceptedModes(acceptedModes.filter((m) => m !== mode));
      } else {
        toast.error("At least one settlement channel must remain enabled");
      }
    } else {
      setAcceptedModes([...acceptedModes, mode]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertConfig({
        provider: "UPI_Direct",
        isEnabled,
        keyId: "direct_firm_upi",
        upiVpa: upiVpa.trim(),
        merchantName: merchantName.trim(),
        acceptedModes,
      }).unwrap();

      toast.success("Firm UPI & settlement settings saved successfully!");
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to save UPI settlement settings",
      );
    }
  };

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
            <QrCode className="h-6 w-6 text-primary" /> Direct UPI & Settlement
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure direct firm UPI VPA, dynamic NPCI QR codes, and zero-fee
            bank settlements for client invoices.
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
                  <span>Direct UPI Configuration</span>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="gateway-enable"
                      className="text-xs font-normal text-muted-foreground"
                    >
                      Active
                    </Label>
                    <Switch
                      id="gateway-enable"
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                    />
                  </div>
                </CardTitle>
                <CardDescription className="text-xs">
                  Zero intermediary transaction fees (0%). Payments settle
                  straight into your firm bank account.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                {/* Firm Legal / Merchant Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="merchant-name"
                    className="text-xs font-semibold"
                  >
                    Firm / Payee Display Name
                  </Label>
                  <Input
                    id="merchant-name"
                    placeholder="e.g. Sharma & Co. Chartered Accountants"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This payee name is embedded in the NPCI UPI string and shown
                    on client UPI apps.
                  </p>
                </div>

                {/* UPI VPA Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="upi-vpa" className="text-xs font-semibold">
                    Firm UPI VPA ID (Virtual Payment Address)
                  </Label>
                  <Input
                    id="upi-vpa"
                    placeholder="e.g. 9625809384@kotakbank or sharmaca@hdfcbank"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Every generated invoice renders a dynamic QR code pre-filled
                    with this VPA, invoice number, and exact amount due.
                  </p>
                </div>

                {/* Accepted Payment Modes */}
                <div className="space-y-2 pt-3 border-t">
                  <Label className="text-xs font-semibold">
                    Accepted Payment Channels
                  </Label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mode-upi"
                        checked={acceptedModes.includes("UPI")}
                        onCheckedChange={() => handleToggleMode("UPI")}
                      />
                      <Label
                        htmlFor="mode-upi"
                        className="text-xs cursor-pointer font-normal"
                      >
                        Dynamic UPI QR (Google Pay, PhonePe, Paytm, BHIM, Cred)
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="mode-bank"
                        checked={acceptedModes.includes("BankTransfer")}
                        onCheckedChange={() => handleToggleMode("BankTransfer")}
                      />
                      <Label
                        htmlFor="mode-bank"
                        className="text-xs cursor-pointer font-normal"
                      >
                        Direct Bank Transfer (NEFT / RTGS / IMPS)
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 text-xs shadow-xs"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settlement Settings
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Benefits Card */}
          <Card className="border-border/80 shadow-xs bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <Shield className="h-4 w-4 text-emerald-600" /> Why Direct UPI
                Settlement?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-emerald-900/80 dark:text-emerald-300/80">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Gateway Fees (0%):</strong> No 2% transaction
                  charges or platform cuts. 100% of the funds go straight into
                  your firm bank account.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Settlement:</strong> Client funds are credited
                  directly to your bank account without multi-day settlement
                  delays (T+2).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>No KYC & Aggregators:</strong> No lengthy merchant
                  onboarding, API credential management, or third-party gateway
                  contracts.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live UPI Preview Pane (Right 4/12) */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <Card className="border-border/80 shadow-md bg-card">
            <CardHeader className="pb-3 text-center">
              <Badge
                variant="outline"
                className="mx-auto text-[10px] uppercase font-mono tracking-wider"
              >
                Live Invoice Preview
              </Badge>
              <CardTitle className="text-sm font-bold mt-2">
                Dynamic UPI Scan-to-Pay
              </CardTitle>
              <CardDescription className="text-xs">
                How clients see your payment prompt on generated invoices and
                portal.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center text-xs">
              {/* Simulated QR Box */}
              <div className="p-4 bg-muted/40 border-2 border-dashed rounded-xl inline-block mx-auto">
                <div className="h-36 w-36 bg-background rounded-lg border flex flex-col items-center justify-center p-2 shadow-xs">
                  <QrCode className="h-24 w-24 text-foreground/80" />
                  <span className="text-[9px] font-mono text-muted-foreground mt-1">
                    NPCI UPI Compliant
                  </span>
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
