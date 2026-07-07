"use client";

import { useState } from "react";
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

import {
  useGetClientsQuery,
  useGetServicesQuery,
  useGetUsersQuery,
  useGetTagsQuery,
  useCreateTaskMutation,
  useGetClientByIdQuery,
} from "@/lib/services/api";
import { type TaskPriority } from "@/lib/types";
import { useMemo } from "react";
import { useParams } from "next/navigation";

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

  const { data: clientsRes, isLoading: clientsLoading } =
    useGetClientsQuery(undefined);
  const { data: servicesRes, isLoading: servicesLoading } =
    useGetServicesQuery(undefined);
  const { data: usersRes, isLoading: usersLoading } =
    useGetUsersQuery(undefined);
  const { data: existingTags = [] } = useGetTagsQuery(undefined);
  
  const { data: clientData } = useGetClientByIdQuery(clientId, { skip: !clientId });

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();

  const clients = clientsRes?.clients || [];
  const services = Array.isArray(servicesRes) ? servicesRes : [];
  const users = Array.isArray(usersRes) ? usersRes : (usersRes?.users || []);

  const availableServices = useMemo(() => {
    if (!clientId || !clientData) return services;
    
    const allowedServiceIds = new Set<string>();
    
    clientData.subscribedServices?.forEach((sub: any) => {
      const id = typeof sub.serviceId === 'object' ? sub.serviceId?._id : sub.serviceId;
      if (id) allowedServiceIds.add(String(id));
    });

    clientData.subscribedPackages?.forEach((sub: any) => {
      if (sub.packageId?.services) {
        sub.packageId.services.forEach((s: any) => {
           const id = typeof s === 'object' ? s._id : s;
           if (id) allowedServiceIds.add(String(id));
        });
      }
    });

    // If a client has NO services, we might still want to let them select one if they are admin, 
    // but the user requested to only show available services.
    return services.filter((s: any) => allowedServiceIds.has(String(s._id)));
  }, [clientId, clientData, services]);

  const handleCreate = async () => {
    if (!clientId || !serviceId || assigneeIds.length === 0) return;

    try {
      await createTask({
        clientId,
        serviceId,
        assigneeIds,
        description: description || undefined,
        priority,
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

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setServiceId("");
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
              <Select value={clientId} onValueChange={setSelectedClientId} disabled={!!lockedClientId}>
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
              <Label>
                Service <span className="text-red-500">*</span>
              </Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      servicesLoading ? "Loading..." : "Select Service"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service: any) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name}
                    </SelectItem>
                  ))}
                  {availableServices.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No services subscribed by this client
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div className="grid gap-2 border p-3 rounded-md bg-slate-50/50 dark:bg-slate-900/50">
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

          <div className="grid gap-2 border p-3 rounded-md bg-slate-50/50 dark:bg-slate-900/50">
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

          <div className="grid gap-2">
            <Label>Tags (Optional)</Label>
            <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] items-center cursor-text bg-background"
                  onClick={() => setTagPopoverOpen(true)}
                >
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 px-2 py-0.5 rounded-full font-normal"
                    >
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTags(
                            selectedTags.filter((t) => t !== tag),
                          );
                        }}
                      />
                    </Badge>
                  ))}
                  {selectedTags.length === 0 && (
                    <span className="text-muted-foreground text-sm pl-1">
                      Select or create tags...
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search or create a tag..."
                    value={tagInput}
                    onValueChange={setTagInput}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {tagInput ? (
                        <div
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                          onClick={() => {
                            if (!selectedTags.includes(tagInput.trim())) {
                              setSelectedTags([
                                ...selectedTags,
                                tagInput.trim(),
                              ]);
                            }
                            setTagInput("");
                            setTagPopoverOpen(false);
                          }}
                        >
                          Create tag &quot;
                          <span className="font-medium">{tagInput}</span>&quot;
                        </div>
                      ) : (
                        "No tags found."
                      )}
                    </CommandEmpty>
                    {availableTags.length > 0 && (
                      <CommandGroup heading="Existing Tags">
                        {availableTags.map((tag: string) => (
                          <CommandItem
                            key={tag}
                            value={tag}
                            onSelect={(currentValue) => {
                              if (!selectedTags.includes(currentValue)) {
                                setSelectedTags([
                                  ...selectedTags,
                                  currentValue,
                                ]);
                              }
                              setTagInput("");
                              setTagPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedTags.includes(tag)
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {tagInput &&
                      !availableTags.some(
                        (t: string) =>
                          t.toLowerCase() === tagInput.toLowerCase(),
                      ) && (
                        <CommandGroup heading="Create New">
                          <CommandItem
                            onSelect={() => {
                              if (!selectedTags.includes(tagInput.trim())) {
                                setSelectedTags([
                                  ...selectedTags,
                                  tagInput.trim(),
                                ]);
                              }
                              setTagInput("");
                              setTagPopoverOpen(false);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create &quot;{tagInput}&quot;
                          </CommandItem>
                        </CommandGroup>
                      )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
