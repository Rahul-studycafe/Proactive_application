"use client";

import { useState, useMemo } from "react";
import { useGetUsersQuery, useUpdateTaskMutation } from "@/lib/services/api";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Search, X, Loader2, UserPlus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Assignee {
  _id: string;
  name: string;
  photoUrl?: string;
  email?: string;
}

interface TaskAssigneeSelectorProps {
  taskId: string;
  assignees?: Assignee[];
  isReadOnly?: boolean;
  variant?: "card" | "table";
}

export function TaskAssigneeSelector({
  taskId,
  assignees = [],
  isReadOnly = false,
  variant = "card",
}: TaskAssigneeSelectorProps) {
  const { can, isSuperAdmin } = usePermissions();
  const canAssign = isSuperAdmin || can("task:assign") || can("task:edit");
  const isEditable = canAssign && !isReadOnly;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRemovingId, setActiveRemovingId] = useState<string | null>(null);

  const { data: usersRes, isLoading: isUsersLoading } = useGetUsersQuery(
    { limit: 100 },
    { skip: !open },
  );

  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const allUsers: Assignee[] = useMemo(() => {
    const raw = usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
    return raw.filter((u: any) => u.isActive !== false);
  }, [usersRes]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const currentIds = useMemo(() => {
    return assignees
      .map((a) => (typeof a === "object" ? a._id : a))
      .filter(Boolean);
  }, [assignees]);

  const handleToggleAssignee = async (userId: string, userName: string) => {
    if (!isEditable || isUpdating) return;

    const isAssigned = currentIds.includes(userId);
    const newIds = isAssigned
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];

    try {
      await updateTask({
        id: taskId,
        assigneeIds: newIds,
      }).unwrap();

      if (isAssigned) {
        toast.success(`Unassigned ${userName} from task`);
      } else {
        toast.success(`Assigned ${userName} to task`);
      }
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to update assignees",
      );
    }
  };

  const handleRemoveSingle = async (
    e: React.MouseEvent,
    userId: string,
    userName: string,
  ) => {
    e.stopPropagation();
    if (!isEditable || isUpdating) return;

    setActiveRemovingId(userId);
    const newIds = currentIds.filter((id) => id !== userId);

    try {
      await updateTask({
        id: taskId,
        assigneeIds: newIds,
      }).unwrap();
      toast.success(`Unassigned ${userName} from task`);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to remove assignee",
      );
    } finally {
      setActiveRemovingId(null);
    }
  };

  const popoverContent = (
    <PopoverContent
      className="w-72 p-0 shadow-lg border-border"
      align={variant === "table" ? "start" : "end"}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search team member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/40">
        {isUsersLoading ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading team members...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No team members found
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isAssigned = currentIds.includes(user._id);
            return (
              <button
                key={user._id}
                type="button"
                onClick={() => handleToggleAssignee(user._id, user.name)}
                disabled={isUpdating}
                className={cn(
                  "w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-left rounded-md transition-colors text-xs hover:bg-muted/70",
                  isAssigned && "bg-primary/10 hover:bg-primary/15",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={user.photoUrl} />
                    <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-semibold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-1">
                  {isAssigned ? (
                    <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{currentIds.length} assigned</span>
        {currentIds.length > 0 && isEditable && (
          <button
            type="button"
            onClick={async () => {
              try {
                await updateTask({ id: taskId, assigneeIds: [] }).unwrap();
                toast.success("Unassigned all users from task");
              } catch (err: any) {
                toast.error(err?.data?.message || "Failed to clear assignees");
              }
            }}
            disabled={isUpdating}
            className="text-destructive hover:underline text-[11px] font-medium"
          >
            Clear all
          </button>
        )}
      </div>
    </PopoverContent>
  );

  // Table Variant: used in TasksTable rows
  if (variant === "table") {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild disabled={!isEditable}>
            <button
              type="button"
              className={cn(
                "group flex items-center gap-1 text-left rounded-md p-1 transition-colors",
                isEditable
                  ? "hover:bg-muted/60 cursor-pointer"
                  : "cursor-default",
              )}
              title={isEditable ? "Click to change assignees" : undefined}
            >
              {assignees.length > 0 ? (
                <div className="flex items-center">
                  {assignees.slice(0, 3).map((assignee, idx) => (
                    <div
                      key={assignee._id}
                      className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground shadow-xs ring-2 ring-background"
                      title={assignee.name}
                      style={{ marginLeft: idx > 0 ? "-0.4rem" : "0" }}
                    >
                      {assignee.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {assignees.length > 3 && (
                    <div
                      className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground ring-2 ring-background"
                      style={{ marginLeft: "-0.4rem" }}
                    >
                      +{assignees.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground text-xs hover:text-foreground">
                  Unassigned
                </span>
              )}

              {isEditable && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary ml-1">
                  <UserPlus className="h-3 w-3" />
                </span>
              )}
            </button>
          </PopoverTrigger>
          {isEditable && popoverContent}
        </Popover>
      </div>
    );
  }

  // Card Variant: used on /tasks/:id?tab=details in the Assignment & Tags card
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {assignees.length > 0 ? (
          assignees.map((assignee) => {
            const isRemoving = activeRemovingId === assignee._id;
            return (
              <div
                key={assignee._id}
                className="group flex items-center gap-2 bg-accent/60 hover:bg-accent px-2.5 py-1 rounded-md border text-xs transition-colors"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={assignee.photoUrl} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                    {assignee.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {assignee.name}
                </span>

                {isEditable && (
                  <button
                    type="button"
                    onClick={(e) =>
                      handleRemoveSingle(e, assignee._id, assignee.name)
                    }
                    disabled={isUpdating || isRemoving}
                    title={`Unassign ${assignee.name}`}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-0.5 ml-0.5 transition-colors"
                  >
                    {isRemoving ? (
                      <Loader2 className="h-3 w-3 animate-spin text-destructive" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <span className="text-sm text-muted-foreground">
            No users assigned
          </span>
        )}

        {isEditable && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 px-2.5 border-dashed hover:border-primary hover:text-primary"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>
                  {assignees.length === 0 ? "Assign Staff" : "Add Assignee"}
                </span>
              </Button>
            </PopoverTrigger>
            {popoverContent}
          </Popover>
        )}
      </div>
    </div>
  );
}
