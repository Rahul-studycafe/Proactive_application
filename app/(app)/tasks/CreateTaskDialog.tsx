"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DynamicConfigMultiSelect } from "@/components/ui/dynamic-config-multi-select";

import {
  useGetClientsQuery,
  useGetServicesQuery,
  useGetUsersQuery,
  useGetTagsQuery,
  useCreateTaskMutation,
  useGetClientByIdQuery,
} from "@/lib/services/api";
import { type TaskPriority } from "@/lib/types";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export interface PeriodOption {
  label: string;
  month?: number;
  year?: number;
  isDefault?: boolean;
}

export function getPeriodOptionsForFrequency(
  frequencyType?: string,
  referenceDate: Date = new Date(),
): PeriodOption[] {
  const normFreq = (frequencyType || "").toLowerCase().replace("-", "_");
  const currentYear = referenceDate.getFullYear();
  const currentMonthIdx = referenceDate.getMonth(); // 0 to 11

  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (normFreq === "monthly") {
    const options: PeriodOption[] = [];
    // 2 future months, current month, 9 past months (12 months)
    for (let offset = 2; offset >= -9; offset--) {
      const d = new Date(currentYear, currentMonthIdx + offset, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = `${MONTH_NAMES[mIdx]} ${y}`;
      options.push({
        label,
        month: mIdx + 1,
        year: y,
        isDefault: offset === 0,
      });
    }
    return options;
  }

  if (normFreq === "quarterly") {
    const fyStart = currentMonthIdx < 3 ? currentYear - 1 : currentYear;
    const quarters: PeriodOption[] = [];

    // Next FY, Current FY, Previous FY
    for (const fy of [fyStart + 1, fyStart, fyStart - 1]) {
      quarters.push(
        { label: `Q4 (Jan - Mar ${fy + 1})`, month: 3, year: fy + 1 },
        { label: `Q3 (Oct - Dec ${fy})`, month: 12, year: fy },
        { label: `Q2 (Jul - Sep ${fy})`, month: 9, year: fy },
        { label: `Q1 (Apr - Jun ${fy})`, month: 6, year: fy },
      );
    }

    let currentQLbl = "";
    if (currentMonthIdx >= 3 && currentMonthIdx <= 5)
      currentQLbl = `Q1 (Apr - Jun ${fyStart})`;
    else if (currentMonthIdx >= 6 && currentMonthIdx <= 8)
      currentQLbl = `Q2 (Jul - Sep ${fyStart})`;
    else if (currentMonthIdx >= 9 && currentMonthIdx <= 11)
      currentQLbl = `Q3 (Oct - Dec ${fyStart})`;
    else currentQLbl = `Q4 (Jan - Mar ${fyStart + 1})`;

    return quarters.map((q) => ({
      ...q,
      isDefault: q.label === currentQLbl,
    }));
  }

  if (normFreq === "half_yearly") {
    const fyStart = currentMonthIdx < 3 ? currentYear - 1 : currentYear;
    const halfYears: PeriodOption[] = [];
    for (const fy of [fyStart + 1, fyStart, fyStart - 1]) {
      halfYears.push(
        { label: `H2 (Oct - Mar ${fy + 1})`, month: 3, year: fy + 1 },
        { label: `H1 (Apr - Sep ${fy})`, month: 9, year: fy },
      );
    }
    const currentHLbl =
      currentMonthIdx >= 3 && currentMonthIdx <= 8
        ? `H1 (Apr - Sep ${fyStart})`
        : `H2 (Oct - Mar ${fyStart + 1})`;

    return halfYears.map((h) => ({
      ...h,
      isDefault: h.label === currentHLbl,
    }));
  }

  if (normFreq === "yearly") {
    const fyStart = currentMonthIdx < 3 ? currentYear - 1 : currentYear;
    const years: PeriodOption[] = [];
    for (let offset = 1; offset >= -2; offset--) {
      const fy = fyStart + offset;
      const nextShort = String((fy + 1) % 100).padStart(2, "0");
      years.push({
        label: `FY ${fy}-${nextShort}`,
        year: fy,
        month: 3,
        isDefault: offset === 0,
      });
    }
    return years;
  }

  return [];
}

export function CreateTaskDialog({
  defaultClientId = "",
  triggerNode,
}: {
  defaultClientId?: string;
  triggerNode?: React.ReactNode;
}) {
  const params = useParams();
  const routeClientId = params?.clientId as string;
  const lockedClientId = defaultClientId || routeClientId;

  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");

  const clientId = lockedClientId || selectedClientId;
  const [serviceId, setServiceId] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(
    null,
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isBillable, setIsBillable] = useState(false);
  const [billableAmount, setBillableAmount] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [docCollectionRequest, setDocCollectionRequest] = useState(false);
  const [docCollectionMessage, setDocCollectionMessage] = useState("");

  // Reset service selection whenever client changes
  useEffect(() => {
    setServiceId("");
  }, [clientId]);

  const { data: clientsRes, isLoading: clientsLoading } =
    useGetClientsQuery(undefined);
  const { data: servicesRes, isLoading: servicesLoading } =
    useGetServicesQuery(undefined);
  const { data: usersRes, isLoading: usersLoading } =
    useGetUsersQuery(undefined);
  const { data: existingTags = [] } = useGetTagsQuery(undefined);

  const { data: clientData } = useGetClientByIdQuery(clientId, {
    skip: !clientId,
  });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();

  const clients = clientsRes?.clients || [];
  const services = Array.isArray(servicesRes) ? servicesRes : [];
  const users = Array.isArray(usersRes) ? usersRes : usersRes?.users || [];

  // Strictly resolve ONLY services subscribed by the client (direct or via package)
  const subscribedServicesList = useMemo(() => {
    if (!clientId || !clientData) return [];

    const allowedServiceIds = new Set<string>();
    const directServices: any[] = [];

    clientData.subscribedServices?.forEach((sub: any) => {
      const s = sub.serviceId;
      const id = typeof s === "object" ? s?._id : s;
      if (id) {
        allowedServiceIds.add(String(id));
        if (typeof s === "object" && s?.name) {
          directServices.push({ _id: String(id), name: s.name });
        }
      }
    });

    clientData.subscribedPackages?.forEach((sub: any) => {
      const pkgServices = sub.packageId?.serviceIds || sub.packageId?.services;
      if (Array.isArray(pkgServices)) {
        pkgServices.forEach((s: any) => {
          const id = typeof s === "object" ? s?._id : s;
          if (id) {
            allowedServiceIds.add(String(id));
            if (typeof s === "object" && s?.name) {
              directServices.push({ _id: String(id), name: s.name });
            }
          }
        });
      }
    });

    if (allowedServiceIds.size === 0) return [];

    if (services.length > 0) {
      return services.filter((s: any) => allowedServiceIds.has(String(s._id)));
    }

    const seen = new Set<string>();
    return directServices.filter((s) => {
      if (seen.has(s._id)) return false;
      seen.add(s._id);
      return true;
    });
  }, [clientId, clientData, services]);

  const availableServices = subscribedServicesList;

  const selectedService = useMemo(() => {
    return (
      services.find((s: any) => String(s._id) === serviceId) ||
      availableServices.find((s: any) => String(s._id) === serviceId)
    );
  }, [services, availableServices, serviceId]);

  const isRecurring = Boolean(
    selectedService?.isRecurring &&
    selectedService?.frequency?.type &&
    selectedService?.frequency?.type !== "one_time",
  );

  const frequencyType = selectedService?.frequency?.type;

  const periodOptions = useMemo(() => {
    if (!isRecurring || !frequencyType) return [];
    return getPeriodOptionsForFrequency(frequencyType);
  }, [isRecurring, frequencyType]);

  const handleCreate = async () => {
    if (!clientId || !serviceId || assigneeIds.length === 0) return;

    if (isRecurring && !selectedPeriod?.label) {
      toast.error(
        `Please select a Period for this ${frequencyType?.replace("_", "-") || "recurring"} service.`,
      );
      return;
    }

    const periodPayload = selectedPeriod?.label
      ? {
          month: selectedPeriod.month,
          year: selectedPeriod.year,
          label: selectedPeriod.label,
        }
      : dueDate
        ? {
            month: new Date(dueDate).getMonth() + 1,
            year: new Date(dueDate).getFullYear(),
            label: new Date(dueDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
          }
        : undefined;

    try {
      await createTask({
        clientId,
        serviceId,
        assigneeIds,
        description: description || undefined,
        priority,
        period: periodPayload,
        dueDate: dueDate || undefined,
        targetDate: targetDate || undefined,
        isBillable,
        billableAmount:
          isBillable && billableAmount ? Number(billableAmount) : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        docCollectionRequest,
        docCollectionMessage: docCollectionRequest
          ? docCollectionMessage
          : undefined,
      }).unwrap();

      toast.success("Task created successfully");
      setOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Failed to create task", err);
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to create task",
      );
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setServiceId("");
    setSelectedPeriod(null);
    setAssigneeIds([]);
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setTargetDate("");
    setIsBillable(false);
    setBillableAmount("");
    setSelectedTags([]);
    setTagInput("");
    setDocCollectionRequest(false);
    setDocCollectionMessage("");
  };

  const availableTags = existingTags.filter(
    (t: string) => !selectedTags.includes(t),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {triggerNode ? (
          triggerNode
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>
                Client <span className="text-red-500">*</span>
              </Label>
              <Select
                value={clientId}
                onValueChange={setSelectedClientId}
                disabled={!!lockedClientId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      clientsLoading ? "Loading..." : "Select Client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  Service <span className="text-red-500">*</span>
                </Label>
                {clientId && subscribedServicesList.length > 0 && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {subscribedServicesList.length} Subscribed Service
                    {subscribedServicesList.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <Select
                value={serviceId}
                onValueChange={(val) => {
                  setServiceId(val);
                  const selected =
                    services.find((s: any) => String(s._id) === val) ||
                    availableServices.find((s: any) => String(s._id) === val);

                  if (selected) {
                    setIsBillable(selected.isBillable ?? true);

                    // Check if service is recurring
                    const isRec = Boolean(
                      selected.isRecurring &&
                      selected.frequency?.type &&
                      selected.frequency?.type !== "one_time",
                    );

                    if (isRec && selected.frequency?.type) {
                      const opts = getPeriodOptionsForFrequency(
                        selected.frequency.type,
                      );
                      const def = opts.find((o) => o.isDefault) || opts[0];
                      if (def) {
                        setSelectedPeriod({
                          label: def.label,
                          month: def.month,
                          year: def.year,
                        });

                        // Auto-populate due date based on service dueDay if empty
                        if (selected.frequency.dueDay) {
                          const targetMonth =
                            def.month || new Date().getMonth() + 1;
                          const targetYear =
                            def.year || new Date().getFullYear();
                          const nextM =
                            targetMonth === 12 ? 1 : targetMonth + 1;
                          const nextY =
                            targetMonth === 12 ? targetYear + 1 : targetYear;
                          const maxDays = new Date(nextY, nextM, 0).getDate();
                          const day = Math.min(
                            selected.frequency.dueDay,
                            maxDays,
                          );
                          const pad = (n: number) => String(n).padStart(2, "0");
                          setDueDate(`${nextY}-${pad(nextM)}-${pad(day)}`);
                        }
                      }
                    } else {
                      setSelectedPeriod(null);
                    }

                    // Check if client has a custom negotiated price for this service
                    const clientSub = clientData?.subscribedServices?.find(
                      (sub: any) => {
                        const sId =
                          typeof sub.serviceId === "object"
                            ? sub.serviceId?._id
                            : sub.serviceId;
                        return String(sId) === val;
                      },
                    );

                    if (
                      clientSub &&
                      clientSub.customPrice !== undefined &&
                      clientSub.customPrice !== null &&
                      clientSub.customPrice !== "" &&
                      Number(clientSub.customPrice) > 0
                    ) {
                      setBillableAmount(String(clientSub.customPrice));
                    } else if (
                      selected.defaultBillingRate !== undefined &&
                      selected.defaultBillingRate !== null
                    ) {
                      setBillableAmount(String(selected.defaultBillingRate));
                    }

                    if (selected.autoDocCollection?.isEnabled) {
                      setDocCollectionRequest(true);
                      if (selected.autoDocCollection.defaultMessage) {
                        setDocCollectionMessage(
                          selected.autoDocCollection.defaultMessage,
                        );
                      }
                    }
                  }
                }}
                disabled={!clientId || subscribedServicesList.length === 0}
              >
                <SelectTrigger
                  className={
                    !clientId || subscribedServicesList.length === 0
                      ? "opacity-75"
                      : ""
                  }
                >
                  <SelectValue
                    placeholder={
                      !clientId
                        ? "Select Client first"
                        : subscribedServicesList.length === 0
                          ? "No subscribed services"
                          : servicesLoading
                            ? "Loading services..."
                            : "Select Subscribed Service"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subscribedServicesList.length > 0 ? (
                    <>
                      <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Subscribed Services ({subscribedServicesList.length})
                      </div>
                      {subscribedServicesList.map((service: any) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    <div className="p-3 text-xs text-amber-600 dark:text-amber-400 text-center">
                      No subscribed services found for this client.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {clientId && subscribedServicesList.length === 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  This client has not subscribed to any services. Tasks can only
                  be created for subscribed services. Please subscribe this
                  client under their profile first.
                </p>
              )}
            </div>
          </div>

          {/* Dynamic Period Selector for Recurring Services */}
          {isRecurring && (
            <div className="grid gap-2 p-3.5 rounded-lg border border-primary/25 bg-primary/5 dark:bg-primary/10 transition-all">
              <div className="flex items-center justify-between">
                <Label className="text font-semibold flex items-center gap-2 text-xs text-primary dark:text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary " />
                  Period (
                  {frequencyType
                    ? frequencyType.replace("_", "-").toUpperCase()
                    : "RECURRING"}
                  ) <span className="text-red-500">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Select compliance period
                </span>
              </div>
              <Select
                value={selectedPeriod?.label || ""}
                onValueChange={(val) => {
                  const found = periodOptions.find((p) => p.label === val);
                  if (found) {
                    setSelectedPeriod({
                      label: found.label,
                      month: found.month,
                      year: found.year,
                    });
                    if (selectedService?.frequency?.dueDay) {
                      const targetMonth =
                        found.month || new Date().getMonth() + 1;
                      const targetYear = found.year || new Date().getFullYear();
                      const nextM = targetMonth === 12 ? 1 : targetMonth + 1;
                      const nextY =
                        targetMonth === 12 ? targetYear + 1 : targetYear;
                      const maxDays = new Date(nextY, nextM, 0).getDate();
                      const day = Math.min(
                        selectedService.frequency.dueDay,
                        maxDays,
                      );
                      const pad = (n: number) => String(n).padStart(2, "0");
                      setDueDate(`${nextY}-${pad(nextM)}-${pad(day)}`);
                    }
                  }
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue
                    placeholder={`Select ${
                      frequencyType ? frequencyType.replace("_", "-") : "period"
                    }`}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {periodOptions.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{opt.label}</span>
                        {opt.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>
                Assignees <span className="text-red-500">*</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start font-normal"
                  >
                    {assigneeIds.length === 0
                      ? "Select Assignees"
                      : `${assigneeIds.length} Assignee(s) Selected`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[260px]">
                  {users.map((user: any) => (
                    <DropdownMenuCheckboxItem
                      key={user._id}
                      checked={assigneeIds.includes(user._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAssigneeIds([...assigneeIds, user._id]);
                        } else {
                          setAssigneeIds(
                            assigneeIds.filter((id) => id !== user._id),
                          );
                        }
                      }}
                    >
                      {user.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Due Date (Optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Target Date (Optional)</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2 border border-border p-3 rounded-md bg-muted/40">
            <div className="flex items-center justify-between">
              <Label>Is this task billable?</Label>
              <Switch checked={isBillable} onCheckedChange={setIsBillable} />
            </div>
            {isBillable && (
              <div className="grid gap-2 mt-2">
                <Label>Billable Amount</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={billableAmount}
                  onChange={(e) => setBillableAmount(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2 border border-border p-3 rounded-md bg-muted/40">
            <div className="flex items-center justify-between">
              <Label>Create Doc. Collection Request</Label>
              <Switch
                checked={docCollectionRequest}
                onCheckedChange={setDocCollectionRequest}
              />
            </div>
            {docCollectionRequest && (
              <div className="grid gap-2 mt-2">
                <Label>Doc. Collection Request Message</Label>
                <Textarea
                  placeholder="Message to the client..."
                  value={docCollectionMessage}
                  onChange={(e) => setDocCollectionMessage(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tags (Optional)</Label>
            <DynamicConfigMultiSelect
              categoryKey="tags"
              value={selectedTags}
              onValueChange={setSelectedTags}
              placeholder="Select or create tags..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add any extra notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isCreating || !clientId || !serviceId || assigneeIds.length === 0
            }
          >
            {isCreating ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
