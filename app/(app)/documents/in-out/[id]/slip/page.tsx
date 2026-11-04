"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetHandoverSlipQuery } from "@/lib/services/api";

interface SlipPageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentHandoverSlipPage({ params }: SlipPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: slipData, isLoading, error } = useGetHandoverSlipQuery(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !slipData) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <div className="text-destructive font-semibold">
          Failed to load handover slip
        </div>
        <p className="text-sm text-muted-foreground">
          The document record could not be found or you do not have permission.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Go Back
        </Button>
      </div>
    );
  }

  const { organization, client, document: doc, slipDate } = slipData as any;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Top action toolbar (Hidden in Print) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href="/documents/in-out"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to In-Out Register</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
            id="print-slip-btn"
          >
            <Printer className="h-4 w-4" />
            <span>Print Custody Slip</span>
          </Button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="bg-card border rounded-2xl shadow-sm p-6 sm:p-10 text-card-foreground print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Document Header */}
        <div className="border-b pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-primary flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-4 w-4" />
              Physical Asset Custody Receipt
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Document Handover Acknowledgment
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref ID: <span className="font-mono text-foreground">{id}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="font-bold text-base text-foreground">
              {organization?.name || "Chartered Accountants & Legal Advisors"}
            </div>
            <div className="text-xs text-muted-foreground max-w-xs mt-0.5">
              {organization?.address ||
                "Head Office, Practice Management Suite"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Date:{" "}
              <strong className="text-foreground">
                {slipDate || new Date().toLocaleDateString("en-IN")}
              </strong>
            </div>
          </div>
        </div>

        {/* Client & Custody Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Client Details
            </div>
            <div className="text-sm font-bold text-foreground">
              {client?.name || "Client"}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {client?.phone && <div>Phone: {client.phone}</div>}
              {client?.email && <div>Email: {client.email}</div>}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Custody Location & Custodian
            </div>
            <div className="text-sm font-semibold text-foreground">
              {doc?.location || "Office Storage"}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Custodian Staff:{" "}
                {doc?.custodianName || "Authorized Practice Staff"}
              </div>
              <div>
                Action:{" "}
                <strong className="text-foreground">{doc?.category}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Item Particulars Table */}
        <div className="rounded-xl border overflow-hidden my-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Document Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Returnable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Return / Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs sm:text-sm">
              <tr>
                <td className="py-4 px-4 font-semibold text-foreground">
                  {doc?.name}
                  {doc?.notes && (
                    <div className="text-xs font-normal text-muted-foreground mt-1">
                      Notes: {doc.notes}
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-muted-foreground">{doc?.type}</td>
                <td className="py-4 px-4">
                  {doc?.isReturnable ? (
                    <Badge
                      variant="outline"
                      className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-300 text-xs"
                    >
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">No</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <Badge variant="outline" className="text-xs">
                    {doc?.status}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-right font-medium text-foreground">
                  {doc?.actualReturnedDate
                    ? new Date(doc.actualReturnedDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : doc?.returnDate
                      ? new Date(doc.returnDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legal Acknowledgment Clause */}
        <div className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed my-6">
          <strong className="text-foreground">
            Official Custody Undertaking:{" "}
          </strong>
          This document formally certifies that the aforementioned
          original/physical documents, deeds, or instruments have been logged
          into the custody register of the firm. Both parties acknowledge
          verification of physical condition, seal integrity, and page count at
          the time of handover.
        </div>

        {/* Signature & Stamp Boxes */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t mt-8">
          <div className="text-center space-y-16">
            <div className="h-16 flex items-end justify-center">
              <span className="text-xs text-muted-foreground/60 italic">
                [ Client Signature / Stamp ]
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="text-xs font-bold text-foreground">
                Received / Handed Over By
              </div>
              <div className="text-[11px] text-muted-foreground">
                Client / Authorized Representative
              </div>
            </div>
          </div>

          <div className="text-center space-y-16">
            <div className="h-16 flex items-end justify-center">
              <span className="text-xs text-muted-foreground/60 italic">
                [ Firm Seal & Signature ]
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="text-xs font-bold text-foreground">
                Authorized Signatory
              </div>
              <div className="text-[11px] text-muted-foreground">
                For {organization?.name || "Practice Partner"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
