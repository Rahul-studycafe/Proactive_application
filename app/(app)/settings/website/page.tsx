"use client";

import { useState, useEffect } from "react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import Link from "next/link";
import {
  Globe,
  Palette,
  Shield,
  Upload,
  CheckCircle2,
  Copy,
  ExternalLink,
  Save,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useGetWebsiteSettingsQuery,
  useUpdateWebsiteSettingsMutation,
} from "@/lib/services/api";
import { usePermissions } from "@/contexts/PermissionsContext";
import { AccessRestricted } from "@/components/shared/AccessRestricted";

const COLOR_PRESETS = [
  { name: "Classic Blue", hex: "#2563eb" },
  { name: "Indigo Tech", hex: "#4f46e5" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Royal Violet", hex: "#7c3aed" },
  { name: "Slate Charcoal", hex: "#334155" },
  { name: "Rose Crimson", hex: "#e11d48" },
];

export default function WebsiteSettingsPage() {
  const { isSuperAdmin, can } = usePermissions();

  const { data: websiteData, isLoading } = useGetWebsiteSettingsQuery();
  const [updateWebsite, { isLoading: isSaving }] =
    useUpdateWebsiteSettingsMutation();

  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [firmName, setFirmName] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [services, setServices] = useState<
    Array<{ title: string; description: string; isActive: boolean }>
  >([]);
  const [isPublished, setIsPublished] = useState(true);

  // Initialize form with backend data
  useEffect(() => {
    if (websiteData) {
      setSubdomain(websiteData.subdomain || "");
      setCustomDomain(websiteData.customDomain || "");
      setFirmName(websiteData.branding?.firmName || "");
      setBrandColor(websiteData.branding?.brandColor || "#2563eb");
      setLogoUrl(websiteData.branding?.logoUrl || "");
      setFaviconUrl(websiteData.branding?.faviconUrl || "");
      setHeroTitle(websiteData.hero?.title || "Client Self-Service Portal");
      setHeroSubtitle(
        websiteData.hero?.subtitle ||
          "Track statutory filings, view acknowledged tax returns, and access invoices securely.",
      );
      setContactEmail(websiteData.contact?.email || "");
      setContactPhone(websiteData.contact?.phone || "");
      setContactAddress(websiteData.contact?.address || "");
      setServices(
        websiteData.services?.length
          ? websiteData.services
          : [
              {
                title: "GST Filings & Advisory",
                description: "Monthly GSTR-3B & GSTR-1 compliances",
                isActive: true,
              },
              {
                title: "Income Tax Returns",
                description: "Annual corporate & individual filing",
                isActive: true,
              },
              {
                title: "Audit & Assurance",
                description: "Statutory, internal and tax audits",
                isActive: true,
              },
            ],
      );
      setIsPublished(websiteData.isPublished ?? true);
    }
  }, [websiteData]);

  if (!isSuperAdmin && !can("settings:manage")) {
    return (
      <div className="space-y-6">
        <AccessRestricted
          title="Website CMS Access Restricted"
          description="Only practice administrators can configure the firm portal, custom domains, and branding."
          backHref="/settings"
          backLabel="Return to Settings"
        />
      </div>
    );
  }

  const handleAddService = () => {
    setServices([...services, { title: "", description: "", isActive: true }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleUpdateService = (index: number, field: string, val: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: val };
    setServices(updated);
  };

  const handleSave = async () => {
    try {
      await updateWebsite({
        subdomain: subdomain.trim().toLowerCase(),
        customDomain: customDomain.trim().toLowerCase(),
        branding: {
          firmName: firmName.trim(),
          brandColor,
          logoUrl: logoUrl.trim(),
          faviconUrl: faviconUrl.trim(),
        },
        hero: {
          title: heroTitle.trim(),
          subtitle: heroSubtitle.trim(),
        },
        contact: {
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          address: contactAddress.trim(),
        },
        services: services.filter((s) => s.title.trim().length > 0),
        isPublished,
      }).unwrap();

      toast.success("Website and Portal branding updated successfully!");
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to update website settings",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Breadcrumbs
              items={[
                { label: "Settings", href: "/settings" },
                { label: "Website", href: "/settings/website" },
              ]}
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight pt-4">
            White-Label Website & Portal CMS
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Configure your custom practice portal subdomain, primary branding
            color, hero messaging, and client self-service landing experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 shadow-xs"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Editor (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form Columns (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="domain" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="domain">Domain & DNS</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="hero">Hero & Copy</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            {/* TAB 1: Domain & DNS Settings */}
            <TabsContent value="domain" className="pt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Practice
                    Subdomain & Custom URL
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your clients access their documents and compliance calendar
                    through this address.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="subdomain"
                      className="text-xs font-semibold"
                    >
                      Proactive Subdomain
                    </Label>
                    <div className="flex rounded-md shadow-xs">
                      <Input
                        id="subdomain"
                        type="text"
                        placeholder="your-firm-name"
                        value={subdomain}
                        onChange={(e) =>
                          setSubdomain(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          )
                        }
                        className="rounded-r-none text-xs"
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-xs">
                        .proactive.in
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Public portal address:{" "}
                      <strong className="text-foreground">
                        {subdomain || "your-firm"}.proactive.in/portal
                      </strong>
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t">
                    <Label
                      htmlFor="custom-domain"
                      className="text-xs font-semibold"
                    >
                      Custom Domain (CNAME)
                    </Label>
                    <Input
                      id="custom-domain"
                      type="text"
                      placeholder="portal.yourcaadvisory.com"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="text-xs"
                    />
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> DNS Setup
                        Instructions:
                      </div>
                      <p>
                        Add a CNAME record at your DNS provider (GoDaddy,
                        Cloudflare, Namecheap):
                      </p>
                      <div className="font-mono bg-background/80 p-1.5 rounded border text-[10px]">
                        CNAME {customDomain || "portal"} → cname.proactive.in
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">
                        Publish Portal Landing Page
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        When enabled, clients can view your branded login and
                        service showcase.
                      </p>
                    </div>
                    <Switch
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Branding & Theming */}
            <TabsContent value="branding" className="pt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" /> Visual Identity
                    & Colors
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Apply your practice's exact brand color and firm logos to
                    all portal screens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="firm-name"
                      className="text-xs font-semibold"
                    >
                      Practice / Firm Name
                    </Label>
                    <Input
                      id="firm-name"
                      type="text"
                      placeholder="e.g. Sharma & Associates Chartered Accountants"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Primary Brand Theme Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="h-10 w-12 rounded border cursor-pointer p-0.5"
                      />
                      <Input
                        type="text"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-32 font-mono text-xs uppercase"
                        maxLength={7}
                      />
                    </div>
                    {/* Quick Palette Presets */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setBrandColor(preset.hex)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] hover:bg-muted transition-colors"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t">
                    <Label htmlFor="logo-url" className="text-xs font-semibold">
                      Firm Logo URL
                    </Label>
                    <Input
                      id="logo-url"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Recommended: Transparent PNG or SVG (height 48px–64px).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="favicon-url"
                      className="text-xs font-semibold"
                    >
                      Favicon URL (Optional)
                    </Label>
                    <Input
                      id="favicon-url"
                      type="url"
                      placeholder="https://example.com/favicon.ico"
                      value={faviconUrl}
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Hero & Contact Copy */}
            <TabsContent value="hero" className="pt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Hero Header &
                    Contact Info
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Customize greeting headlines and footer contact channels
                    shown to clients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="hero-title"
                      className="text-xs font-semibold"
                    >
                      Portal Title
                    </Label>
                    <Input
                      id="hero-title"
                      type="text"
                      placeholder="Client Self-Service Portal"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hero-sub" className="text-xs font-semibold">
                      Portal Subtitle
                    </Label>
                    <Textarea
                      id="hero-sub"
                      rows={2}
                      placeholder="Track statutory filings, view acknowledged tax returns, and access invoices securely."
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="contact-email"
                        className="text-xs font-semibold"
                      >
                        Contact Email
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="help@agency.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="contact-phone"
                        className="text-xs font-semibold"
                      >
                        Support Phone
                      </Label>
                      <Input
                        id="contact-phone"
                        type="text"
                        placeholder="+91 98765 43210"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="contact-address"
                      className="text-xs font-semibold"
                    >
                      Office Address
                    </Label>
                    <Input
                      id="contact-address"
                      type="text"
                      placeholder="e.g. 402, Nariman Point, Mumbai 400021"
                      value={contactAddress}
                      onChange={(e) => setContactAddress(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Services Showcase */}
            <TabsContent value="services" className="pt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Practice Services Showcase
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Highlight statutory capabilities on the client login
                      landing page.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddService}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Service
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {services.map((srv, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Service Title (e.g. GST Annual Audit)"
                          value={srv.title}
                          onChange={(e) =>
                            handleUpdateService(idx, "title", e.target.value)
                          }
                          className="text-xs font-semibold"
                        />
                        <Input
                          placeholder="Short description or benefits"
                          value={srv.description}
                          onChange={(e) =>
                            handleUpdateService(
                              idx,
                              "description",
                              e.target.value,
                            )
                          }
                          className="text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={srv.isActive}
                          onCheckedChange={(checked) =>
                            handleUpdateService(idx, "isActive", checked)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveService(idx)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No custom services added. Click "+ Add Service" to
                      showcase capabilities.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Interactive Preview Pane (Right 5/12) */}
        <div className="lg:col-span-5 sticky top-20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> Live Client Preview
            </span>
            <Badge variant="outline" className="text-[10px] font-mono">
              Live Simulation
            </Badge>
          </div>

          {/* Miniature Branded Frame */}
          <div
            className="rounded-xl border shadow-md bg-linear-to-br from-slate-50 via-slate-100/50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-5 overflow-hidden transition-all duration-300"
            style={{ "--preview-primary": brandColor } as React.CSSProperties}
          >
            {/* Top Browser Pill */}
            <div className="flex items-center gap-1.5 pb-3 border-b mb-4">
              <div className="h-2 w-2 rounded-full bg-rose-400" />
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <div className="ml-2 bg-muted/80 px-2 py-0.5 rounded text-[9px] font-mono text-muted-foreground truncate max-w-[200px]">
                https://{subdomain || "sharma-ca"}.proactive.in/portal
              </div>
            </div>

            {/* Branded Mini Header */}
            <div className="text-center space-y-2 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 mx-auto object-contain rounded"
                />
              ) : (
                <div
                  className="h-10 w-10 mx-auto rounded-xl flex items-center justify-center text-white shadow-xs font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  <Shield className="h-5 w-5" />
                </div>
              )}
              <div
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: brandColor }}
              >
                {firmName || "Sharma & Associates"}
              </div>
              <div className="text-sm font-bold text-foreground">
                {heroTitle || "Client Self-Service Portal"}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 px-2">
                {heroSubtitle ||
                  "Access statutory filings, download tax returns, and view invoices securely."}
              </p>
            </div>

            {/* Mini Login Card Mockup */}
            <div className="bg-card border rounded-lg p-3 shadow-xs space-y-2.5">
              <div className="flex rounded border text-[10px] text-center font-medium">
                <div
                  className="flex-1 py-1 rounded bg-muted/60 font-semibold"
                  style={{ color: brandColor }}
                >
                  OTP Login
                </div>
                <div className="flex-1 py-1 text-muted-foreground">
                  Password
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-2 w-16 bg-muted rounded" />
                <div className="h-7 border rounded bg-background/50 px-2 flex items-center text-[10px] text-muted-foreground">
                  Registered Mobile or Email
                </div>
              </div>

              <div
                className="h-7 rounded flex items-center justify-center text-[11px] font-medium text-white shadow-xs"
                style={{ backgroundColor: brandColor }}
              >
                Send Verification Code
              </div>
            </div>

            {/* Mini Footer */}
            <div className="mt-4 pt-3 border-t text-center text-[9px] text-muted-foreground space-y-1">
              <div className="flex justify-center gap-3">
                {contactPhone && <span>📞 {contactPhone}</span>}
                {contactEmail && <span>✉️ {contactEmail}</span>}
              </div>
              {contactAddress && (
                <p className="truncate px-2">{contactAddress}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
