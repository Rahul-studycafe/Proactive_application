"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Plus,
  Trash2,
  Upload,
  FileText,
  X,
  Loader2,
  Calendar,
  User,
  GripVertical,
  Pencil,
  Equal,
  Users,
  Search,
  ExternalLink,
  Building2,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  useGetServiceByIdQuery,
  useGetServiceClientsQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetUsersQuery,
} from "@/lib/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { withPermission } from "@/components/shared/withPermission";
import { Can } from "@/contexts/PermissionsContext";

// DB types mapping
const FREQUENCIES = [
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
  "one_time",
];
const GST_OPTIONS = ["0", "5", "12", "18", "28"];

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const QUARTER_OFFSETS = ["First", "Second", "Third", "Last"];
const HALF_YEARLY_OFFSETS = [
  "Apr & Oct",
  "Jan & Jul",
  "Feb & Aug",
  "Mar & Sep",
  "May & Nov",
  "Jun & Dec",
];

function ToggleField({
  label,
  checked,
  onChange,
  info,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info?: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        id={`toggle-${label.replace(/\s+/g, "-")}`}
      />
      <Label
        htmlFor={`toggle-${label.replace(/\s+/g, "-")}`}
        className="flex items-center gap-1.5 text-sm font-medium leading-none cursor-pointer"
      >
        {label}
        {info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p>{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Label>
    </div>
  );
}

const FIELD_TYPES = ["text", "number", "select", "date"];

function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "settings";
  const serviceId = params?.serviceId as string;

  const {
    data: response,
    isLoading,
    error,
  } = useGetServiceByIdQuery(serviceId);
  const svc = response; // Response returns the object directly

  const { data: usersResponse, isLoading: isUsersLoading } =
    useGetUsersQuery(undefined);
  const users = Array.isArray(usersResponse)
    ? usersResponse
    : usersResponse?.users || [];

  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const { data: subscribedClients = [], isLoading: isLoadingClients } =
    useGetServiceClientsQuery(serviceId);

  const [formData, setFormData] = useState<any>(null);
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return subscribedClients;
    const q = clientSearch.toLowerCase();
    return subscribedClients.filter(
      (c: any) =>
        c.name?.toLowerCase().includes(q) ||
        c.fileNo?.toLowerCase().includes(q) ||
        c.pan?.toLowerCase().includes(q) ||
        c.gstin?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [subscribedClients, clientSearch]);

  const totalRecurringValue = useMemo(() => {
    return subscribedClients.reduce(
      (acc: number, c: any) => acc + (c.effectivePrice || 0),
      0,
    );
  }, [subscribedClients]);

  // Initialize form data when API data arrives
  useEffect(() => {
    if (svc && !formData) {
      setFormData(JSON.parse(JSON.stringify(svc))); // Deep copy
    }
  }, [svc, formData]);

  const update = (patch: any) => {
    setFormData((prev: any) => ({ ...prev, ...patch }));
  };

  const hasChanges = useMemo(() => {
    if (!svc || !formData) return false;
    return JSON.stringify(svc) !== JSON.stringify(formData);
  }, [svc, formData]);

  const handleSave = async () => {
    try {
      // Ensure frequency object exists if recurring
      const payload = { ...formData };

      if (payload.isRecurring) {
        payload.frequency = {
          type: payload.frequency?.type || "monthly",
          periodLogic: payload.frequency?.periodLogic || "recently_completed",
          creationDay: payload.frequency?.creationDay || 1,
          dueDay: payload.frequency?.dueDay || 10,
        };
      } else {
        // If not recurring, remove frequency from payload so Zod doesn't try to validate an empty/partial object
        delete payload.frequency;
      }

      // Strip temporary IDs from subtasks and custom fields so Mongoose can generate real ObjectIds
      if (payload.subtasks) {
        payload.subtasks = payload.subtasks.map((st: any) => {
          if (st._id && st._id.toString().startsWith("temp_")) {
            const { _id, ...rest } = st;
            return rest;
          }
          return st;
        });
      }

      if (payload.customFieldsDef) {
        payload.customFieldsDef = payload.customFieldsDef.map((cf: any) => {
          if (cf._id && cf._id.toString().startsWith("temp_")) {
            const { _id, ...rest } = cf;
            return rest;
          }
          return cf;
        });
      }

      // Convert assignedUsers to an array of string IDs (since API populates it as an array of objects)
      if (payload.assignedUsers && Array.isArray(payload.assignedUsers)) {
        payload.assignedUsers = payload.assignedUsers.map((u: any) =>
          typeof u === "string" ? u : u._id,
        );
      }

      await updateService({ id: serviceId, ...payload }).unwrap();
      toast.success("Service saved successfully");

      // The API response will update 'svc', which will then trigger useEffect and recalculate hasChanges.
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save service");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteService(serviceId).unwrap();
      toast.success("Service deleted");
      router.push("/services");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete service");
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !svc) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center mt-6">
        <h2 className="text-lg font-semibold">Service not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The service you're looking for doesn't exist or was deleted.
        </p>
        <Button asChild className="mt-4">
          <Link href="/services">Back to Services</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standard Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: "Services", href: "/services" },
          { label: formData.name || "Service Details" },
        ]}
      />

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{formData.name}</h1>
          <p className="text-sm text-muted-foreground">
            Configure service workflow, recurring schedules, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Can do="service:edit">
            <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </Can>

          <Can do="service:delete">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete service?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove &quot;{formData.name}&quot; from your workspace.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Can>
        </div>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={(v) => router.replace(`?tab=${v}`, { scroll: false })}
        className="space-y-4"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          {[
            { v: "settings", l: "Settings" },
            { v: "checklist", l: "Checklist" },
            { v: "subtasks", l: "Subtasks" },
            { v: "fields", l: "Custom Fields" },
            {
              v: "clients",
              l: `Clients (${subscribedClients.length})`,
            },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="relative rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2 ">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="name">
                    Service Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-1 pb-1">
                  <ToggleField
                    label="Is Enabled?"
                    checked={formData.isEnabled ?? true}
                    onChange={(v) => update({ isEnabled: v })}
                  />
                  <ToggleField
                    label="Checklist Required?"
                    checked={formData.isChecklistRequired ?? false}
                    onChange={(v) => update({ isChecklistRequired: v })}
                    info="If enabled, tasks for this service cannot be marked complete until every checklist item is done."
                  />
                  <ToggleField
                    label="Is Recurring?"
                    checked={formData.isRecurring ?? false}
                    onChange={(v) => update({ isRecurring: v })}
                  />
                </div>
                {formData.isRecurring && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>
                        Auto Task Creation Frequency{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.frequency?.type || "monthly"}
                        onValueChange={(v) =>
                          update({
                            frequency: { type: v }, // Reset other fields when changing type
                          })
                        }
                      >
                        <SelectTrigger className="capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((f) => (
                            <SelectItem
                              key={f}
                              value={f}
                              className="capitalize"
                            >
                              {f.replace("_", "-")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.frequency?.type === "monthly" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>
                            Creation Date{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <Select
                              value={String(
                                formData.frequency?.creationDay || "1",
                              )}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of every month</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>
                            Due Date <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <Select
                              value={String(formData.frequency?.dueDay || "1")}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of every month</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.frequency?.type === "quarterly" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Creation Date</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              value={String(
                                formData.frequency?.creationDay || "1",
                              )}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of</span>
                            <Select
                              value={
                                formData.frequency?.creationMonthOffset ||
                                "First"
                              }
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationMonthOffset: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUARTER_OFFSETS.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">
                              month of every quarter
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Due Date</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              value={String(formData.frequency?.dueDay || "1")}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of</span>
                            <Select
                              value={
                                formData.frequency?.dueMonthOffset || "First"
                              }
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueMonthOffset: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUARTER_OFFSETS.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">
                              month of every quarter
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.frequency?.type === "half_yearly" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Creation Date</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              value={String(
                                formData.frequency?.creationDay || "1",
                              )}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of</span>
                            <Select
                              value={
                                formData.frequency?.creationMonthOffset ||
                                "Apr & Oct"
                              }
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationMonthOffset: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HALF_YEARLY_OFFSETS.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">month</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Due Date</Label>
                          <div className="flex flex-wrap items-center gap-3">
                            <Select
                              value={String(formData.frequency?.dueDay || "1")}
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueDay: Number(v),
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((d) => (
                                  <SelectItem key={d} value={String(d)}>
                                    {getOrdinal(d)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">of</span>
                            <Select
                              value={
                                formData.frequency?.dueMonthOffset ||
                                "Apr & Oct"
                              }
                              onValueChange={(v) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueMonthOffset: v,
                                  },
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {HALF_YEARLY_OFFSETS.map((o) => (
                                  <SelectItem key={o} value={o}>
                                    {o}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-sm">month</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.frequency?.type === "yearly" && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>
                            Creation Date{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="date"
                              className="w-[160px]"
                              value={formData.frequency?.creationDate || ""}
                              onChange={(e) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    creationDate: e.target.value,
                                  },
                                })
                              }
                            />
                            <span className="text-sm">of every year</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>
                            Due Date <span className="text-destructive">*</span>
                          </Label>
                          <div className="flex items-center gap-3">
                            <Input
                              type="date"
                              className="w-[160px]"
                              value={formData.frequency?.dueDate || ""}
                              onChange={(e) =>
                                update({
                                  frequency: {
                                    ...formData.frequency,
                                    dueDate: e.target.value,
                                  },
                                })
                              }
                            />
                            <span className="text-sm">of every year</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="created">Creation Date</Label>
                  <Input
                    id="created"
                    type="date"
                    value={
                      formData.createdAt
                        ? new Date(formData.createdAt)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sac">SAC Code</Label>
                    <Input
                      id="sac"
                      value={formData.sacCode || ""}
                      onChange={(e) => update({ sacCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      GST % <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={String(formData.gstPercentage ?? "18")}
                      onValueChange={(v) =>
                        update({ gstPercentage: Number(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rate">
                    Default Billing Rate (Excl. of Tax)
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="rate"
                      type="number"
                      className="pl-7"
                      value={formData.defaultBillingRate || ""}
                      onChange={(e) =>
                        update({
                          defaultBillingRate: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <ToggleField
                  label="Mark its tasks billable by default"
                  checked={formData.isBillable ?? true}
                  onChange={(v) => update({ isBillable: v })}
                />
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg">
                  Document Collection Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <ToggleField
                  label="Create Document Collection Request Automatically?"
                  checked={formData.autoDocCollection?.isEnabled ?? false}
                  onChange={(v) =>
                    update({
                      autoDocCollection: {
                        ...(formData.autoDocCollection || {}),
                        isEnabled: v,
                      },
                    })
                  }
                />
                {formData.autoDocCollection?.isEnabled && (
                  <div className="space-y-1.5 pt-2">
                    <Label>
                      Doc. Collection Request Default Message{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      rows={4}
                      placeholder="Please provide the following documents..."
                      value={formData.autoDocCollection?.defaultMessage || ""}
                      onChange={(e) =>
                        update({
                          autoDocCollection: {
                            ...(formData.autoDocCollection || {}),
                            defaultMessage: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="">
              <CardHeader>
                <CardTitle className="text-lg">
                  Assign Auto Tasks to (Users)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5 lg:w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        {formData.assignedUsers &&
                        formData.assignedUsers.length > 0
                          ? `${formData.assignedUsers.length} user(s) selected`
                          : "Select..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No user found.</CommandEmpty>
                          <CommandGroup>
                            {users.map((u: any) => {
                              const currentIds = (
                                formData.assignedUsers || []
                              ).map((x: any) => x._id || x);
                              const isSelected = currentIds.includes(u._id);
                              return (
                                <CommandItem
                                  key={u._id}
                                  value={u.name}
                                  onSelect={() => {
                                    if (isSelected) {
                                      update({
                                        assignedUsers: currentIds.filter(
                                          (id: string) => id !== u._id,
                                        ),
                                      });
                                    } else {
                                      update({
                                        assignedUsers: [...currentIds, u._id],
                                      });
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {u.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Display selected badges */}
                  {formData.assignedUsers &&
                    formData.assignedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.assignedUsers.map((id: any) => {
                          const uid = id._id || id;
                          const userObj = users.find((u: any) => u._id === uid);
                          if (!userObj) return null;
                          return (
                            <Badge
                              key={uid}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {userObj.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => {
                                  const currentIds = (
                                    formData.assignedUsers || []
                                  ).map((x: any) => x._id || x);
                                  update({
                                    assignedUsers: currentIds.filter(
                                      (x: string) => x !== uid,
                                    ),
                                  });
                                }}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checklist */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Default Checklist</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update({
                    checklist: [
                      ...(formData.checklist || []),
                      {
                        _id: `temp_${Date.now()}`,
                        stepName: "New item",
                        orderIndex: (formData.checklist?.length || 0) + 1,
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add item
              </Button>
            </CardHeader>
            <CardContent>
              {!formData.checklist || formData.checklist.length === 0 ? (
                <Empty
                  title="No checklist items"
                  description="Add reusable steps that should appear on every task created for this service."
                />
              ) : (
                <ul className="space-y-2">
                  {formData.checklist.map((item: any, i: number) => (
                    <li
                      key={item._id}
                      className="flex items-center gap-3 rounded-md border bg-card p-2"
                    >
                      <span className="w-6 text-xs text-muted-foreground">
                        {i + 1}.
                      </span>
                      <Input
                        value={item.stepName || ""}
                        onChange={(e) =>
                          update({
                            checklist: formData.checklist.map((c: any) =>
                              c._id === item._id
                                ? { ...c, stepName: e.target.value }
                                : c,
                            ),
                          })
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update({
                            checklist: formData.checklist.filter(
                              (c: any) => c._id !== item._id,
                            ),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subtasks */}
        <TabsContent value="subtasks">
          <Card className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <CardHeader className="flex px-16 flex-row items-center justify-between pb-6">
              <div className="flex items-center gap-4">
                <CardTitle className="text-xl font-semibold">
                  Update Subtasks
                </CardTitle>
                <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 bg-background shadow-sm">
                  <Switch
                    id="workflow-toggle"
                    checked={formData.isWorkflowEnabled ?? false}
                    onCheckedChange={(v) => update({ isWorkflowEnabled: v })}
                  />
                  <Label
                    htmlFor="workflow-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Enable Workflow
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover text-popover-foreground border border-border p-3 text-sm max-w-[250px] leading-relaxed shadow-md">
                        Once a subtask is completed, the next one will be
                        automatically generated.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!formData.subtasks || formData.subtasks.length === 0 ? (
                <Empty
                  title="No subtasks"
                  description="Auto-add subtasks to every task created for this service."
                />
              ) : (
                <ul className="space-y-4">
                  {formData.subtasks.map((st: any) => (
                    <li key={st._id} className="flex items-center gap-4 ">
                      <div className="text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground transition-colors">
                        <Equal className="h-5 w-5" />
                      </div>
                      <div className="flex-1 flex bg-card items-stretch rounded-xl border border-border shadow-xs overflow-hidden">
                        {/* Left Side: Inputs */}
                        <div className="flex-1 p-5 space-y-4">
                          <Input
                            placeholder="Title"
                            value={st.title || ""}
                            onChange={(e) =>
                              update({
                                subtasks: formData.subtasks.map((x: any) =>
                                  x._id === st._id
                                    ? { ...x, title: e.target.value }
                                    : x,
                                ),
                              })
                            }
                            className="border-border focus-visible:ring-1"
                          />
                          <Textarea
                            placeholder="Description"
                            value={st.description || ""}
                            onChange={(e) =>
                              update({
                                subtasks: formData.subtasks.map((x: any) =>
                                  x._id === st._id
                                    ? { ...x, description: e.target.value }
                                    : x,
                                ),
                              })
                            }
                            className="border-border min-h-[80px] resize-none focus-visible:ring-1"
                          />
                        </div>

                        {/* Middle Side: Configs */}
                        <div className="w-[280px] p-5 flex flex-col justify-center space-y-6 text-sm text-muted-foreground">
                          {/* Due Date Popover */}
                          <Popover>
                            <PopoverTrigger className="flex items-center gap-3 hover:text-primary group text-left">
                              <div className="border border-border rounded-full p-2 group-hover:border-primary/50 transition-colors shadow-xs shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="flex-1 text-xs leading-tight">
                                {st.relativeDueDays !== undefined &&
                                st.relativeDueDays !== null ? (
                                  <>
                                    <span className="block">
                                      Due Date: Creation
                                    </span>
                                    <span className="block">
                                      Date + {st.relativeDueDays} Days
                                    </span>
                                  </>
                                ) : (
                                  <span>No Due Date</span>
                                )}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm">
                                  Set Due Date
                                </h4>
                                <div className="flex items-center gap-2 text-sm">
                                  <span>Creation Date +</span>
                                  <Input
                                    type="number"
                                    className="w-20"
                                    value={st.relativeDueDays ?? ""}
                                    onChange={(e) =>
                                      update({
                                        subtasks: formData.subtasks.map(
                                          (x: any) =>
                                            x._id === st._id
                                              ? {
                                                  ...x,
                                                  relativeDueDays: e.target
                                                    .value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                                }
                                              : x,
                                        ),
                                      })
                                    }
                                  />
                                  <span>Days</span>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Target Date Popover */}
                          <Popover>
                            <PopoverTrigger className="flex items-center gap-3 hover:text-primary group text-left">
                              <div className="border border-border rounded-full p-2 group-hover:border-primary/50 transition-colors shadow-xs shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="flex-1 text-xs leading-tight">
                                {st.relativeTargetDays !== undefined &&
                                st.relativeTargetDays !== null ? (
                                  <>
                                    <span className="block">
                                      Target Date: Creation
                                    </span>
                                    <span className="block">
                                      Date + {st.relativeTargetDays} Days
                                    </span>
                                  </>
                                ) : (
                                  <span>No Target Date</span>
                                )}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-4">
                                <h4 className="font-medium text-sm">
                                  Set Target Date
                                </h4>
                                <div className="flex items-center gap-2 text-sm">
                                  <span>Creation Date +</span>
                                  <Input
                                    type="number"
                                    className="w-20"
                                    value={st.relativeTargetDays ?? ""}
                                    onChange={(e) =>
                                      update({
                                        subtasks: formData.subtasks.map(
                                          (x: any) =>
                                            x._id === st._id
                                              ? {
                                                  ...x,
                                                  relativeTargetDays: e.target
                                                    .value
                                                    ? Number(e.target.value)
                                                    : undefined,
                                                }
                                              : x,
                                        ),
                                      })
                                    }
                                  />
                                  <span>Days</span>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Assign Users Popover */}
                          <Popover>
                            <PopoverTrigger className="flex items-center gap-3 hover:text-blue-600 group text-left">
                              {st.assignedUserIds &&
                              st.assignedUserIds.length > 0 ? (
                                <div className="flex -space-x-1.5 shrink-0">
                                  {st.assignedUserIds.map((uid: string) => {
                                    const user = users.find(
                                      (u: any) => u._id === uid,
                                    );
                                    return (
                                      <Avatar
                                        key={uid}
                                        className="h-8 w-8 border-2 border-background text-xs shadow-xs"
                                      >
                                        <AvatarFallback className="bg-primary/20 text-primary font-medium uppercase">
                                          {user?.name?.slice(0, 2) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="border border-border rounded-full p-2 group-hover:border-primary/50 transition-colors shadow-xs shrink-0">
                                  <User className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                              )}
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[300px] p-0"
                              align="start"
                            >
                              <Command>
                                <CommandInput placeholder="Search users..." />
                                <CommandList>
                                  <CommandEmpty>No user found.</CommandEmpty>
                                  <CommandGroup>
                                    {users.map((u: any) => {
                                      const currentIds =
                                        st.assignedUserIds || [];
                                      const isSelected = currentIds.includes(
                                        u._id,
                                      );
                                      return (
                                        <CommandItem
                                          key={u._id}
                                          value={u.name}
                                          onSelect={() => {
                                            const newIds = isSelected
                                              ? currentIds.filter(
                                                  (id: string) => id !== u._id,
                                                )
                                              : [...currentIds, u._id];
                                            update({
                                              subtasks: formData.subtasks.map(
                                                (x: any) =>
                                                  x._id === st._id
                                                    ? {
                                                        ...x,
                                                        assignedUserIds: newIds,
                                                      }
                                                    : x,
                                              ),
                                            });
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              isSelected
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          {u.name}
                                        </CommandItem>
                                      );
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Right Side: Delete Action */}
                        <div className="w-[80px] flex flex-col items-center justify-center border-l border-border bg-muted/20">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-destructive/10 hover:bg-destructive/20 text-destructive h-11 w-11 rounded-lg"
                            onClick={() =>
                              update({
                                subtasks: formData.subtasks.filter(
                                  (x: any) => x._id !== st._id,
                                ),
                              })
                            }
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex justify-center">
                <Button
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-6 font-normal shadow-sm"
                  onClick={() =>
                    update({
                      subtasks: [
                        ...(formData.subtasks || []),
                        {
                          _id: `temp_${Date.now()}`,
                          title: "",
                          description: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Subtask
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields */}
        <TabsContent value="fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Custom Fields</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update({
                    customFieldsDef: [
                      ...(formData.customFieldsDef || []),
                      {
                        _id: `temp_${Date.now()}`,
                        label: "New field",
                        fieldType: "text",
                      },
                    ],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add field
              </Button>
            </CardHeader>
            <CardContent>
              {!formData.customFieldsDef ||
              formData.customFieldsDef.length === 0 ? (
                <Empty
                  title="No custom fields"
                  description="Capture extra information on each task — e.g. assessment year, period, reference number."
                />
              ) : (
                <ul className="space-y-2">
                  {formData.customFieldsDef.map((f: any) => (
                    <li
                      key={f._id}
                      className="flex flex-col gap-3 rounded-md border bg-card p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          placeholder="Field Label (e.g. Assessment Year)"
                          value={f.label || ""}
                          onChange={(e) =>
                            update({
                              customFieldsDef: formData.customFieldsDef.map(
                                (x: any) =>
                                  x._id === f._id
                                    ? { ...x, label: e.target.value }
                                    : x,
                              ),
                            })
                          }
                        />
                        <Select
                          value={f.fieldType || "text"}
                          onValueChange={(v) =>
                            update({
                              customFieldsDef: formData.customFieldsDef.map(
                                (x: any) =>
                                  x._id === f._id ? { ...x, fieldType: v } : x,
                              ),
                            })
                          }
                        >
                          <SelectTrigger className="w-[140px] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((t) => (
                              <SelectItem
                                key={t}
                                value={t}
                                className="capitalize"
                              >
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 border rounded-md px-3 h-10 bg-background">
                          <Switch
                            id={`required-${f._id}`}
                            checked={f.isRequired ?? false}
                            onCheckedChange={(v) =>
                              update({
                                customFieldsDef: formData.customFieldsDef.map(
                                  (x: any) =>
                                    x._id === f._id
                                      ? { ...x, isRequired: v }
                                      : x,
                                ),
                              })
                            }
                          />
                          <Label
                            htmlFor={`required-${f._id}`}
                            className="text-sm cursor-pointer whitespace-nowrap"
                          >
                            Required
                          </Label>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            update({
                              customFieldsDef: formData.customFieldsDef.filter(
                                (x: any) => x._id !== f._id,
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>

                      {f.fieldType === "select" && (
                        <div className="pl-2 border-l-2 border-muted ml-1">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">
                            Dropdown Options (comma separated)
                          </Label>
                          <Input
                            placeholder="Option 1, Option 2, Option 3"
                            value={(f.options || []).join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              update({
                                customFieldsDef: formData.customFieldsDef.map(
                                  (x: any) =>
                                    x._id === f._id
                                      ? {
                                          ...x,
                                          options: opts.length > 0 ? opts : [],
                                        }
                                      : x,
                                ),
                              });
                            }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribed Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subscribed Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {subscribedClients.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active client retainers linked to this service
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recurring Retainer Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalRecurringValue.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cumulative billing volume per cycle
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Standard Rate / SAC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₹{(formData?.defaultBillingRate || 0).toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  SAC: {formData?.sacCode || "N/A"} · GST:{" "}
                  {formData?.gstPercentage || 18}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Subscribed Clients
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clients enrolled in this service blueprint for automated
                    compliance task generation and retainer billing.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, PAN, GSTIN..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingClients ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-foreground">
                    No Subscribed Clients Found
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    {clientSearch
                      ? `No clients match the search "${clientSearch}".`
                      : "No clients are currently subscribed to this service blueprint. You can assign this service directly from any client's Retainers tab or package subscription."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">
                        Client Name & Details
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        PAN / GSTIN
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Contact
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Agreed Rate
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        Subscribed Via
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-center">
                        Tasks
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client: any) => (
                      <TableRow
                        key={client._id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                              <AvatarFallback className="rounded-lg">
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                href={`/clients/${client._id}`}
                                className="font-semibold text-xs text-primary hover:underline block"
                              >
                                {client.name}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {client.fileNo && (
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    #{client.fileNo}
                                  </span>
                                )}
                                {client.entityType && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4 font-normal"
                                  >
                                    {client.entityType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {client.pan && <div>{client.pan}</div>}
                          {client.gstin ? (
                            <div className="text-[11px] text-muted-foreground">
                              {client.gstin}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground">
                              No GSTIN
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {client.email && (
                            <div className="text-muted-foreground">
                              {client.email}
                            </div>
                          )}
                          {client.mobile && (
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {client.mobile}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-right">
                          <div>
                            ₹
                            {(client.effectivePrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </div>
                          {client.customPrice !== null &&
                          client.customPrice !== undefined ? (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-3.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-200"
                            >
                              Custom Retainer
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Standard
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-muted/40"
                          >
                            {client.subscriptionSource}
                          </Badge>
                          {client.subscribedAt && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              Since {formatDate(client.subscribedAt)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <div className="font-semibold">
                            {client.totalTasks} total
                          </div>
                          {client.pendingTasks > 0 ? (
                            <span className="text-[10px] text-amber-600 font-medium">
                              {client.pendingTasks} active
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              All done
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                          >
                            <Link href={`/clients/${client._id}`}>
                              <span>View Client</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default withPermission(ServiceDetailPage, "service:view", {
  title: "Service Details Restricted",
  description:
    "You do not have permission to view service blueprints. Please contact your Practice Administrator.",
  backHref: "/services",
  backLabel: "Return to Services",
});
