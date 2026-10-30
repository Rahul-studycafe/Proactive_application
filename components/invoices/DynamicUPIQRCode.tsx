"use client";

import { useState } from "react";
import {
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useGetInvoiceUpiQrQuery } from "@/lib/services/api";

interface DynamicUPIQRCodeProps {
  invoiceId: string;
  invoiceNo?: string;
  amountDue?: number;
}

export function DynamicUPIQRCode({ invoiceId, invoiceNo, amountDue }: DynamicUPIQRCodeProps) {
  const { data: qrData, isLoading, error } = useGetInvoiceUpiQrQuery(invoiceId);
  const [copied, setCopied] = useState(false);

  const handleCopyUpi = () => {
    if (qrData?.upiId) {
      navigator.clipboard.writeText(qrData.upiId);
      setCopied(true);
      toast.success("UPI ID copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    if (qrData?.qrDataUrl) {
      const a = document.createElement("a");
      a.href = qrData.qrDataUrl;
      a.download = `UPI-QR-${invoiceNo || invoiceId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("QR code downloaded");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-card border rounded-xl space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Generating Dynamic NPCI UPI QR...</span>
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="p-4 bg-muted/40 border border-dashed rounded-xl text-center text-xs text-muted-foreground space-y-1">
        <QrCode className="h-6 w-6 mx-auto text-muted-foreground/60" />
        <p className="font-medium text-foreground">Direct Bank Transfer</p>
        <p className="text-[11px]">UPI gateway not yet configured for this billing entity.</p>
      </div>
    );
  }

  const payableAmount = amountDue ?? qrData.amount;

  return (
    <Card className="border-border/80 shadow-xs bg-card overflow-hidden">
      <CardContent className="p-4 space-y-3 text-center text-xs">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-primary" /> Scan & Pay via UPI
          </span>
          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
            Zero Gateway Fee
          </Badge>
        </div>

        {/* QR Code Image */}
        <div className="p-2 bg-white rounded-xl border inline-block mx-auto shadow-xs">
          {qrData.qrDataUrl ? (
            <img
              src={qrData.qrDataUrl}
              alt="UPI QR Code"
              className="h-40 w-40 object-contain mx-auto"
            />
          ) : (
            <div className="h-40 w-40 flex items-center justify-center text-muted-foreground">
              <QrCode className="h-20 w-20" />
            </div>
          )}
        </div>

        {/* Amount & VPA */}
        <div className="space-y-1">
          <span className="text-base font-bold text-foreground block">
            ₹{payableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <div className="flex items-center justify-center gap-1.5">
            <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
              {qrData.upiId}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyUpi}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Copy UPI ID"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQr}
            className="h-7 text-xs gap-1"
          >
            <Download className="h-3 w-3" /> Save QR
          </Button>
          {qrData.npciUri && (
            <Button
              asChild
              size="sm"
              variant="default"
              className="h-7 text-xs gap-1"
            >
              <a href={qrData.npciUri}>
                <Smartphone className="h-3 w-3" /> Pay with App
              </a>
            </Button>
          )}
        </div>

        {/* Supported Apps Footer */}
        <div className="pt-2 border-t text-[10px] text-muted-foreground flex items-center justify-center gap-2">
          <span>Supported:</span>
          <span className="font-semibold text-foreground/80">Google Pay • PhonePe • Paytm • BHIM</span>
        </div>
      </CardContent>
    </Card>
  );
}

