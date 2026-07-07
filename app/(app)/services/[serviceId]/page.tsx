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
} from "lucide-react";
import {
  useGetServiceByIdQuery,
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
import { cn } from "@/lib/utils";
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

export default function ServiceDetailPage() {
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

  const [formData, setFormData] = useState<any>(null);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/services")}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link
            href="/services"
            className="text-base font-medium text-primary hover:underline"
          >
            Services
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-base font-semibold">{formData.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isUpdating || !hasChanges}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>

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
                  This will remove "{formData.name}" from your workspace.
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
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={(v) => router.replace(`?tab=${v}`, { scroll: false })} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
          {[
            { v: "settings", l: "Settings" },
            { v: "checklist", l: "Checklist" },
            { v: "subtasks", l: "Subtasks" },
            { v: "fields", l: "Custom Fields" },
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
                      <TooltipContent className="bg-zinc-900 text-white p-3 text-sm max-w-[250px] leading-relaxed">
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
                      <div className="text-slate-400  cursor-grab active:cursor-grabbing hover:text-slate-600 transition-colors">
                        <Equal className="h-5 w-5" />
                      </div>
                      <div className="flex-1 flex bg-slate-50/30 items-stretch rounded-xl border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
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
                            className="border-slate-200 focus-visible:ring-1"
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
                            className="border-slate-200 min-h-[80px] resize-none focus-visible:ring-1"
                          />
                        </div>

                        {/* Middle Side: Configs */}
                        <div className="w-[280px] p-5 flex flex-col justify-center space-y-6 text-sm text-slate-600">
                          {/* Due Date Popover */}
                          <Popover>
                            <PopoverTrigger className="flex items-center gap-3 hover:text-blue-600 group text-left">
                              <div className="border border-slate-200 rounded-full p-2 group-hover:border-blue-300 transition-colors shadow-sm shrink-0">
                                <Calendar className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
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
                            <PopoverTrigger className="flex items-center gap-3 hover:text-blue-600 group text-left">
                              <div className="border border-slate-200 rounded-full p-2 group-hover:border-blue-300 transition-colors shadow-sm shrink-0">
                                <Calendar className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
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
                                        className="h-8 w-8 border-2 border-white text-xs shadow-sm"
                                      >
                                        <AvatarFallback className="bg-slate-600 text-white font-medium uppercase">
                                          {user?.name?.slice(0, 2) || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="border border-slate-200 rounded-full p-2 group-hover:border-blue-300 transition-colors shadow-sm shrink-0">
                                  <User className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
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
                        <div className="w-[80px] flex flex-col items-center justify-center border-l border-slate-100/80 bg-slate-50/30">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-red-50 hover:bg-red-100 text-red-500 h-11 w-11 rounded-lg"
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
                                    x._id === f._id ? { ...x, isRequired: v } : x,
                                ),
                              })
                            }
                          />
                          <Label htmlFor={`required-${f._id}`} className="text-sm cursor-pointer whitespace-nowrap">
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
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Dropdown Options (comma separated)</Label>
                          <Input
                            placeholder="Option 1, Option 2, Option 3"
                            value={(f.options || []).join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                              update({
                                customFieldsDef: formData.customFieldsDef.map(
                                  (x: any) =>
                                    x._id === f._id
                                      ? { ...x, options: opts.length > 0 ? opts : [] }
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
