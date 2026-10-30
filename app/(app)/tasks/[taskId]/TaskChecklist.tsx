"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useToggleTaskChecklistStepMutation,
  useAddTaskChecklistStepMutation,
  useDeleteTaskChecklistStepMutation,
} from "@/lib/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TaskChecklist({
  taskId,
  checklist = [],
  isReadOnly = false,
}: {
  taskId: string;
  checklist: any[];
  isReadOnly?: boolean;
}) {
  const [newTaskName, setNewTaskName] = useState("");

  const [toggleStep] = useToggleTaskChecklistStepMutation();
  const [addStep, { isLoading: isAdding }] = useAddTaskChecklistStepMutation();
  const [deleteStep] = useDeleteTaskChecklistStepMutation();

  const handleToggle = async (stepIndex: number, currentStatus: boolean) => {
    if (isReadOnly) return;
    try {
      await toggleStep({
        taskId,
        stepIndex,
        isCompleted: !currentStatus,
      }).unwrap();
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to update step status");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newTaskName.trim()) return;
    try {
      await addStep({
        taskId,
        stepName: newTaskName.trim(),
      }).unwrap();
      setNewTaskName("");
      toast.success("To-Do added");
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to add To-Do");
    }
  };

  const handleDelete = async (stepIndex: number) => {
    if (isReadOnly) return;
    try {
      await deleteStep({
        taskId,
        stepIndex,
      }).unwrap();
      toast.success("To-Do deleted");
    } catch (error: any) {
      toast.error(error?.data?.message || error?.message || "Failed to delete To-Do");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-2 mb-6">
        {checklist.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            <p>No To-Do items yet.</p>
          </div>
        ) : (
          checklist.map((step, index) => (
            <div
              key={step._id || index}
              className={cn(
                "group flex items-center justify-between p-3 border rounded-lg transition-colors",
                step.isCompleted
                  ? "bg-muted/50 border-transparent"
                  : "bg-card hover:border-primary/50",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3 flex-1",
                  isReadOnly ? "cursor-default" : "cursor-pointer"
                )}
                onClick={() => handleToggle(index, step.isCompleted)}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-5 w-5 rounded border transition-colors",
                    step.isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input",
                    isReadOnly && "opacity-75"
                  )}
                >
                  {step.isCompleted && <Check className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium transition-all",
                    step.isCompleted && "line-through text-muted-foreground",
                  )}
                >
                  {step.stepName}
                </span>
              </div>
              {!isReadOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {isReadOnly ? (
        <div className="p-3 text-xs text-muted-foreground bg-muted/40 rounded-lg text-center border">
          To-Do checklist is locked because this task is finalized.
        </div>
      ) : (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Add a new to-do..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            disabled={isAdding}
            className="flex-1"
          />
          <Button type="submit" disabled={isAdding || !newTaskName.trim()}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
