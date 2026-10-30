"use client";

import Link from "next/link";
import {
  useParams,
  notFound,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Building2,
  Package as PackageIcon,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Contact,
  Hash,
  Tag,
  Clock,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  FileQuestion,
  Wallet,
  Plus,
  Trash2,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RecurrenceBadge } from "@/components/services/RecurrenceBadge";
import {
  useGetClientByIdQuery,
  useUploadClientPhotoMutation,
  useUpdateClientMutation,
  useUnsubscribeClientFromServiceMutation,
} from "@/lib/services/api";
import { formatDate } from "@/lib/utils";
import { SubscribeDialog } from "./SubscribeDialog";
import { EditClientDialog } from "./EditClientDialog";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "../../tasks/CreateTaskDialog";
import { ClientRetainersTab } from "./ClientRetainersTab";
import { ClientLedgerTab } from "./ClientLedgerTab";
import { ClientDSCTab } from "./ClientDSCTab";
import { ClientDocumentsTab } from "./ClientDocumentsTab";
import { ClientPasswordsTab } from "@/components/passwords";
import { ClientExpensesTab } from "@/components/expenses";
import { ClientPortalTab } from "./ClientPortalTab";
import { EnablePortalLoginModal } from "@/components/clients/EnablePortalLoginModal";


export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "details";

  const handleTabChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams?.toString() || "");
    newParams.set("tab", val);
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  const { data: client, isLoading } = useGetClientByIdQuery(clientId);



  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadClientPhoto, { isLoading: isUploadingPhoto }] =
    useUploadClientPhotoMutation();
  const [updateClient] = useUpdateClientMutation();
  const [unsubscribeService] = useUnsubscribeClientFromServiceMutation();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res: any = await uploadClientPhoto(formData).unwrap();
      const photoUrl = res?.photoUrl || res;

      await updateClient({
        id: clientId as string,
        name: client?.name,
        photoUrl,
      }).unwrap();

      toast.success("Client photo updated successfully");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update client photo");
    } finally {
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };



  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) throw notFound();

  // Tasks are now populated from the backend!
  const clientTasks = client.tasks || [];

  const pendingTasks = clientTasks.filter(
    (t: any) => t.status === "Pending",
  ).length;
  const holdTasks = clientTasks.filter(
    (t: any) => t.status === "On Hold",
  ).length;
  const inProgressTasks = clientTasks.filter(
    (t: any) => t.status === "In Progress",
  ).length;
  const completedTasks = clientTasks.filter(
    (t: any) => t.status === "Completed",
  ).length;
  const unbilledTasks = clientTasks.filter(
    (t: any) => t.isBillable && !t.isBilled,
  ).length;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
    "http://localhost:5000";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: client.name || "Client Details" },
        ]}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
            {client.photoUrl ? (
              <Avatar className="h-14 w-14 rounded-xl ring-2 ring-border">
                <AvatarImage
                  src={`${baseUrl}${client.photoUrl}`}
                  alt={client.name}
                  className={`object-cover ${isUploadingPhoto ? "opacity-50" : ""}`}
                />
                <AvatarFallback className="rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
                  {client.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground ring-2 ring-border ${isUploadingPhoto ? "opacity-50" : ""}`}
              >
                {client.name?.[0] || "?"}
              </div>
            )}
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => photoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border hover:bg-accent text-foreground transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Upload client photo"
              aria-label="Upload client photo"
            >
              {isUploadingPhoto ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <Camera className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">
                {client.fileNo || "No File No."}
              </span>
              <span>·</span>
              <span>{client.entityType || "Unknown Entity"}</span>
              <Badge
                variant="outline"
                className={
                  client.isActive
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-muted text-muted-foreground"
                }
              >
                {client.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EnablePortalLoginModal clientId={clientId} client={client} />
          <EditClientDialog client={client} />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="details"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Services{client?.subscribedServices?.length ? ` (${client.subscribedServices.length})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="retainers"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Retainers{client?.subscribedPackages?.length ? ` (${client.subscribedPackages.length})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Tasks ({clientTasks.length})
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="dsc"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            DSC Register
          </TabsTrigger>
          <TabsTrigger
            value="ledger"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Ledger
          </TabsTrigger>

          <TabsTrigger
            value="passwords"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Passwords
          </TabsTrigger>
          <TabsTrigger
            value="expenses"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger
            value="portal"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Portal Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 pt-2">
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingTasks}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Pending
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-full">
                  <PauseCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{holdTasks}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    On Hold
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{inProgressTasks}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    In Progress
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-full">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{completedTasks}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Completed
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-red-50 text-red-600 rounded-full">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{unbilledTasks}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Unbilled
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-border">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {client.openingBalance ? `₹${client.openingBalance}` : "₹0"}
                  </p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Ledger
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General & Financial */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" /> General & Financial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">File No</span>
                  <span className="text-sm font-medium">
                    {client.fileNo || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">PAN</span>
                  <span className="text-sm font-medium">
                    {client.pan || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">GSTIN</span>
                  <span className="text-sm font-medium">
                    {client.gstin || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Opening Balance
                  </span>
                  <span className="text-sm font-medium">
                    {client.openingBalance ? `₹${client.openingBalance}` : "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Date of Birth / Inc.
                  </span>
                  <span className="text-sm font-medium">
                    {client.dateOfBirth
                      ? new Date(client.dateOfBirth).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Address */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Contact className="h-4 w-4 text-primary" /> Contact & Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Contact Person
                  </span>
                  <span className="text-sm font-medium">
                    {client.contactPersonName || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">
                    {client.email || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium">
                    {client.mobile || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Alternate Phone
                  </span>
                  <span className="text-sm font-medium">
                    {client.secondaryMobile || "—"}
                  </span>
                </div>
                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="text-sm font-medium leading-relaxed">
                    {client.address
                      ? `${client.address}, ${client.city || ""} ${client.state || ""} ${client.pincode || ""}`
                          .replace(/,\s*$/, "")
                          .trim()
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            {client.customFieldValues &&
              Object.keys(client.customFieldValues).length > 0 && (
                <Card className="shadow-sm border-border lg:col-span-2">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Additional
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      {Object.entries(client.customFieldValues).map(
                        ([key, val]) => (
                          <div
                            key={key}
                            className="grid grid-cols-[140px_1fr] gap-4 items-center"
                          >
                            <span
                              className="text-sm text-muted-foreground truncate"
                              title={key}
                            >
                              {key}
                            </span>
                            <span
                              className="text-sm font-medium truncate"
                              title={String(val)}
                            >
                              {(val as string) || "—"}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Tags & Users */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Classification & Team
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </h4>
                  {client.tags && client.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {client.tags.map((tag: string) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="font-normal"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No tags assigned
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> Assigned Users
                  </h4>
                  {client.assignedUsers && client.assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {client.assignedUsers.map((u: any, idx: number) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="font-normal bg-background"
                        >
                          {u.name || "User"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No users assigned
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="text-base font-semibold">
                  Individual Subscribed Services
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Standalone compliance and advisory services subscribed by this client.
                </p>
              </div>
              <SubscribeDialog
                clientId={clientId}
                client={client}
                defaultTab="service"
                triggerButton={
                  <Button size="sm" className="gap-2 shadow-xs">
                    <Plus className="h-4 w-4" /> Add Service
                  </Button>
                }
              />
            </div>

            {/* Note banner if client has retainers */}
            {client.subscribedPackages && client.subscribedPackages.length > 0 && (
              <div className="mx-5 mt-4 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <PackageIcon className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    This client is also enrolled in{" "}
                    <strong>{client.subscribedPackages.length} commercial Retainer package(s)</strong>.
                  </span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-semibold text-primary"
                  onClick={() => handleTabChange("retainers")}
                >
                  View Retainers →
                </Button>
              </div>
            )}

            {!client.subscribedServices || client.subscribedServices.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-1">
                  <FileText className="h-6 w-6 opacity-60" />
                </div>
                <h4 className="text-sm font-semibold">No Individual Services Subscribed</h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-2">
                  No standalone services are directly assigned to this client.
                </p>
                <SubscribeDialog
                  clientId={clientId}
                  client={client}
                  defaultTab="service"
                  triggerButton={
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" /> Subscribe to a Service
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y">
                {client.subscribedServices.map((sub: any, idx: number) => {
                  const svcId = sub.serviceId?._id || sub.serviceId;
                  const svcName = sub.serviceId?.name || "Service Subscription";
                  return (
                    <li
                      key={`svc-${idx}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-blue-500/10 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            <span>{svcName}</span>
                            <RecurrenceBadge
                              frequency={sub.serviceId?.frequency}
                              isRecurring={sub.serviceId?.isRecurring}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Subscribed on:{" "}
                            {sub.subscribedAt
                              ? new Date(sub.subscribedAt).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="bg-success/10 text-success border-success/20 font-normal text-xs"
                        >
                          Active Service
                        </Badge>
                        {sub.customPrice !== undefined && (
                          <span className="text-sm font-semibold">
                            ₹{Number(sub.customPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Unsubscribe Service"
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to unsubscribe from "${svcName}"?`)) return;
                            try {
                              await unsubscribeService({
                                clientId,
                                serviceId: svcId.toString(),
                              }).unwrap();
                              toast.success("Successfully unsubscribed from service");
                            } catch (err: any) {
                              toast.error(err?.data?.message || "Failed to unsubscribe");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="retainers">
          <ClientRetainersTab clientId={clientId} client={client} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-end">
            <CreateTaskDialog
              defaultClientId={clientId}
              triggerNode={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Create Task
                </Button>
              }
            />
          </div>
          <div className="rounded-xl border bg-card shadow-sm">
            {clientTasks.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No tasks yet.
              </div>
            ) : (
              <ul className="divide-y">
                {clientTasks.map((t: any) => {
                  const periodLabel =
                    t.period?.label ||
                    (t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : null);

                  return (
                    <li
                      key={t.id || t._id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/tasks/${t.id || t._id}`}
                            className="text-sm font-semibold hover:underline cursor-pointer text-foreground hover:text-primary transition-colors"
                          >
                            {t.serviceId?.name || t.description || "Unknown Task"}
                          </Link>
                          {periodLabel && (
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-medium px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                            >
                              {periodLabel}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          {periodLabel && (
                            <span>
                              Period:{" "}
                              <strong className="text-foreground font-medium">
                                {periodLabel}
                              </strong>
                            </span>
                          )}
                          <span>
                            Due{" "}
                            {t.dueDate
                              ? new Date(t.dueDate).toLocaleDateString()
                              : "No date"}
                          </span>
                          {(t.billableAmount !== undefined && t.billableAmount !== null) && (
                            <span>
                              Amount:{" "}
                              <strong className="text-foreground font-medium">
                                ₹{Number(t.billableAmount).toLocaleString("en-IN")}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{t.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <ClientDocumentsTab
            clientId={clientId}
            clientName={client?.name}
            initialSubTab={activeTab === "docs-in-out" ? "physical" : undefined}
          />
        </TabsContent>
        <TabsContent value="dsc">
          <ClientDSCTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="ledger">
          <ClientLedgerTab clientId={clientId} />
        </TabsContent>
        <TabsContent value="docs-in-out">
          <ClientDocumentsTab
            clientId={clientId}
            clientName={client?.name}
            initialSubTab="physical"
          />
        </TabsContent>
        <TabsContent value="passwords">
          <ClientPasswordsTab
            clientId={clientId}
            clientName={client?.name}
            clientFileNo={client?.fileNo}
          />
        </TabsContent>
        <TabsContent value="expenses">
          <ClientExpensesTab clientId={clientId} clientName={client?.name} />
        </TabsContent>
        <TabsContent value="portal">
          <ClientPortalTab clientId={clientId} client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
