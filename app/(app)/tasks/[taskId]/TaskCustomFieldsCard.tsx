"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit2, Loader2, Check, X } from "lucide-react";
import { useUpdateTaskMutation } from "@/lib/services/api";
import { toast } from "sonner";

interface CustomFieldDef {
  _id: string;
  label: string;
  fieldType: "text" | "number" | "select" | "date";
  options?: string[];
  isRequired?: boolean;
}

export function TaskCustomFieldsCard({
  taskId,
  customFieldsDef,
  customFieldValues = {},
  isReadOnly = false,
}: {
  taskId: string;
  customFieldsDef: CustomFieldDef[];
  customFieldValues: Record<string, any>;
  isReadOnly?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(
    customFieldValues || {},
  );
  const [updateTask, { isLoading }] = useUpdateTaskMutation();

  if (!customFieldsDef || customFieldsDef.length === 0) {
    return null;
  }

  const handleSave = async () => {
    try {
      await updateTask({
        id: taskId,
        customFieldValues: values,
      }).unwrap();
      toast.success("Custom fields updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update custom fields");
    }
  };

  const handleCancel = () => {
    setValues(customFieldValues || {});
    setIsEditing(false);
  };

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Custom Fields</CardTitle>
        {!isReadOnly && !isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs px-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        ) : !isReadOnly && isEditing ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {customFieldsDef.map((field) => {
          const val = values[field._id] || "";

          if (!isEditing) {
            return (
              <div
                key={field._id}
                className="grid grid-cols-[120px_1fr] gap-4 items-center"
              >
                <span className="text-sm text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-sm font-medium">{val || "—"}</span>
              </div>
            );
          }

          return (
            <div key={field._id} className="space-y-1.5">
              <Label>
                {field.label}{" "}
                {field.isRequired && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              {field.fieldType === "select" ? (
                <Select
                  value={String(val)}
                  onValueChange={(v) =>
                    setValues({ ...values, [field._id]: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={
                    field.fieldType === "number"
                      ? "number"
                      : field.fieldType === "date"
                        ? "date"
                        : "text"
                  }
                  value={val}
                  onChange={(e) =>
                    setValues({ ...values, [field._id]: e.target.value })
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
