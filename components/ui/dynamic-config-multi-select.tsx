"use client";

import * as React from "react";
import { useState } from "react";
import { Check, Plus, X, Tag as TagIcon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetConfigurationOptionsQuery,
  useCreateConfigurationOptionMutation,
} from "@/lib/services/api";
import { toast } from "sonner";

export interface DynamicConfigMultiSelectProps {
  categoryKey?: string;
  value?: string[];
  onValueChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustomAdd?: boolean;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

export function DynamicConfigMultiSelect({
  categoryKey = "tags",
  value = [],
  onValueChange,
  placeholder = "Select or create tags...",
  disabled = false,
  className,
  allowCustomAdd = true,
}: DynamicConfigMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const { data: dbOptions = [], isLoading } = useGetConfigurationOptionsQuery(
    { categoryKey, includeInactive: false },
    { skip: !categoryKey }
  );

  const [createOption, { isLoading: isCreating }] =
    useCreateConfigurationOptionMutation();

  const handleToggle = (itemValue: string) => {
    if (value.includes(itemValue)) {
      onValueChange(value.filter((v) => v !== itemValue));
    } else {
      onValueChange([...value, itemValue]);
    }
  };

  const handleRemove = (itemValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(value.filter((v) => v !== itemValue));
  };

  const handleCreateNewOption = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed) {
      toast.error("Please enter a name for the tag");
      return;
    }

    try {
      const created = await createOption({
        categoryKey,
        label: trimmed,
        value: trimmed,
        color: newColor,
      }).unwrap();

      toast.success(`Tag "${trimmed}" created`);
      setDialogOpen(false);
      setNewLabel("");
      setNewColor(PRESET_COLORS[0]);

      if (!value.includes(created.value)) {
        onValueChange([...value, created.value]);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to create tag");
    }
  };

  const openCreateDialogWithSearch = (presetName?: string) => {
    setNewLabel(presetName || search || "");
    setDialogOpen(true);
  };

  // Find option styling helper
  const getOptionColor = (val: string) => {
    const found = dbOptions.find((o) => o.value === val || o.label === val);
    return found?.color || null;
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* Chips Display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-1 bg-muted/20 border rounded-md">
            {value.map((val) => {
              const color = getOptionColor(val);
              return (
                <Badge
                  key={val}
                  variant="secondary"
                  className="text-xs px-2 py-0.5 flex items-center gap-1.5 font-normal"
                  style={
                    color
                      ? {
                          borderColor: color,
                          backgroundColor: `${color}18`,
                          color: color,
                        }
                      : undefined
                  }
                >
                  <TagIcon className="h-3 w-3 shrink-0 opacity-70" />
                  <span>{val}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(val, e)}
                      className="ml-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Dropdown Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-between font-normal text-left h-9 text-xs sm:text-sm bg-background border-input hover:bg-accent/50"
            >
              <span className="text-muted-foreground flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 opacity-60" />
                {placeholder}
              </span>
              <Plus className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0" align="start">
            <Command shouldFilter={true}>
              <CommandInput
                placeholder="Search tags..."
                value={search}
                onValueChange={setSearch}
                className="h-9 text-xs"
              />
              <CommandList className="max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Loading tags...
                  </div>
                ) : null}

                <CommandEmpty>
                  <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                    No matching tags found.
                    {allowCustomAdd && search.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateDialogWithSearch(search.trim())}
                        className="mt-2 w-full text-xs h-7 gap-1 border-dashed"
                      >
                        <Plus className="h-3 w-3" />
                        Create tag &ldquo;{search.trim()}&rdquo;
                      </Button>
                    )}
                  </div>
                </CommandEmpty>

                <CommandGroup>
                  {dbOptions.map((opt) => {
                    const isSelected = value.includes(opt.value) || value.includes(opt.label);
                    return (
                      <CommandItem
                        key={opt._id}
                        value={`${opt.label} ${opt.value}`}
                        onSelect={() => handleToggle(opt.value)}
                        className="text-xs flex items-center justify-between cursor-pointer py-1.5 px-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: opt.color || "#64748B" }}
                          />
                          <span className="font-medium truncate">{opt.label}</span>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-3.5 w-3.5 shrink-0",
                            isSelected ? "opacity-100 text-primary" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                {allowCustomAdd && (
                  <>
                    <CommandSeparator />
                    <div className="p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openCreateDialogWithSearch()}
                        className="w-full justify-start text-xs h-8 text-primary font-medium hover:bg-primary/10 hover:text-primary gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create New Tag</span>
                      </Button>
                    </div>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Add Tag Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Create New Tag
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a colored tag for categorization across tasks, clients, and documents.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewOption} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="tag-name" className="text-xs font-medium">
                Tag Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tag-name"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. VIP, Priority, Retainer, Urgent..."
                className="text-xs h-9"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tag Color</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform border border-black/10 dark:border-white/10 flex items-center justify-center",
                      newColor === c ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && <Check className="h-3 w-3 text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating || !newLabel.trim()}
                className="text-xs gap-1.5"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Create & Select
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

