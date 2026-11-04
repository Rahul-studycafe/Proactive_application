"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  useAddSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetUsersQuery,
} from "@/lib/services/api";
import { toast } from "sonner";
import { cn, getInitials } from "@/lib/utils";

const TASK_STATUSES = [
  "Pending",
  "In Progress",
  "Under Review",
  "On Hold",
  "Completed",
  "Cancelled",
];

export function TaskSubtasks({
  taskId,
  subtasks = [],
  isReadOnly = false,
}: {
  taskId: string;
  subtasks: any[];
  isReadOnly?: boolean;
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date>();

  const { data: usersData } = useGetUsersQuery(undefined);
  const users = Array.isArray(usersData) ? usersData : usersData?.users || [];

  const [addSubtask, { isLoading: isAdding }] = useAddSubtaskMutation();
  const [updateSubtask] = useUpdateSubtaskMutation();
  const [deleteSubtask] = useDeleteSubtaskMutation();

  const handleStatusChange = async (subtaskId: string, newStatus: string) => {
    if (isReadOnly) return;
    try {
      await updateSubtask({
        taskId,
        subtaskId,
        status: newStatus,
      }).unwrap();
      toast.success("Subtask status updated");
    } catch (error: any) {
      const message =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to update status";
      toast.error(message);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newTitle.trim()) return;
    try {
      await addSubtask({
        taskId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        assignedUserId: newAssignee || undefined,
        dueDate: newDueDate ? newDueDate.toISOString() : undefined,
      }).unwrap();
      setIsAddDialogOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewAssignee("");
      setNewDueDate(undefined);
      toast.success("Subtask added");
    } catch (error: any) {
      const message =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to add subtask";
      toast.error(message);
    }
  };

  const handleDelete = async (subtaskId: string) => {
    if (isReadOnly) return;
    try {
      await deleteSubtask({
        taskId,
        subtaskId,
      }).unwrap();
      toast.success("Subtask deleted");
    } catch (error: any) {
      const message =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to delete subtask";
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20";
      case "In Progress":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20";
      case "Pending":
        return "text-muted-foreground bg-muted border-border";
      case "Under Review":
        return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20";
      case "On Hold":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20";
      case "Cancelled":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20";
      default:
        return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-sm text-muted-foreground">
          Manage sub-tasks to track granular progress
        </h3>
        {!isReadOnly && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Subtask
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subtask</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Gather documents"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional details..."
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select value={newAssignee} onValueChange={setNewAssignee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user: any) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newDueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newDueDate ? (
                            format(newDueDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newDueDate}
                          onSelect={setNewDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isAdding || !newTitle.trim()}>
                    {isAdding && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Subtask
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {subtasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            <p>No subtasks created yet.</p>
          </div>
        ) : (
          subtasks.map((subtask) => {
            // Find assignee user object since backend only stores/returns ObjectId in subtask list sometimes
            const assignee =
              typeof subtask.assignedUserId === "object"
                ? subtask.assignedUserId
                : users.find((u: any) => u._id === subtask.assignedUserId);

            return (
              <div
                key={subtask._id}
                className="group flex flex-col gap-3 p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4
                      className={cn(
                        "font-medium",
                        subtask.status === "Completed" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {subtask.title}
                    </h4>
                    {subtask.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {subtask.description}
                      </p>
                    )}
                  </div>
                  <Select
                    value={subtask.status}
                    onValueChange={(val) =>
                      handleStatusChange(subtask._id, val)
                    }
                    disabled={isReadOnly}
                  >
                    <SelectTrigger
                      className={cn(
                        "w-[140px] h-8 text-xs font-medium",
                        getStatusColor(subtask.status),
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignee?.photoUrl} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(assignee?.name || "U A")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{assignee?.name || "Unassigned"}</span>
                    </div>
                    {subtask.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span
                          className={cn(
                            new Date(subtask.dueDate) < new Date() &&
                              subtask.status !== "Completed" &&
                              "text-destructive font-medium",
                          )}
                        >
                          {format(new Date(subtask.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(subtask._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
