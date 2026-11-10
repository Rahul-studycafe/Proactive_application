"use client";

import * as React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useGetConfigurationOptionsQuery,
  useCreateConfigurationOptionMutation,
} from "@/lib/services/api";
import { ConfigurationOption } from "@/lib/types/configuration";
import { toast } from "sonner";

export interface DynamicConfigSelectProps {
  categoryKey: string;
  value?: string;
  onValueChange: (value: string, option?: ConfigurationOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustomAdd?: boolean;
  itemDisplayMode?: "label" | "value" | "both";
  additionalOptions?: { label: string; value: string; description?: string }[];
}

export function DynamicConfigSelect({
  categoryKey,
  value,
  onValueChange,
  placeholder = "Select an option...",
  disabled = false,
  className,
  allowCustomAdd = true,
  itemDisplayMode = "label",
  additionalOptions = [],
}: DynamicConfigSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPortalUrl, setNewPortalUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("");

  const { data: dbOptions = [], isLoading } = useGetConfigurationOptionsQuery(
    { categoryKey, includeInactive: false },
    { skip: !categoryKey }
  );

  const [createOption, { isLoading: isCreating }] =
    useCreateConfigurationOptionMutation();

  // Combine DB options with any static/additional options provided
  const allOptions: Array<{
    _id?: string;
    label: string;
    value: string;
    color?: string | null;
    description?: string;
    isSystemDefault?: boolean;
    rawOption?: ConfigurationOption;
  }> = React.useMemo(() => {
    const list: any[] = dbOptions.map((opt) => ({
      _id: opt._id,
      label: opt.label,
      value: opt.value,
      color: opt.color,
      description: opt.description,
      isSystemDefault: opt.isSystemDefault,
      rawOption: opt,
    }));

    // Add additionalOptions if not already in list
    for (const add of additionalOptions) {
      if (!list.some((item) => item.value === add.value)) {
        list.push({
          label: add.label,
          value: add.value,
          description: add.description,
        });
      }
    }

    return list;
  }, [dbOptions, additionalOptions]);

  // Find currently selected option
  const selectedOption = allOptions.find((opt) => opt.value === value || opt.label === value);

  // Friendly category display name
  const categoryTitle = React.useMemo(() => {
    return categoryKey
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }, [categoryKey]);

  const handleCreateNewOption = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newLabel.trim();
    if (!trimmed) {
      toast.error("Please enter a name for the new option");
      return;
    }

    try {
      const created = await createOption({
        categoryKey,
        label: trimmed,
        value: trimmed,
        description: newDescription.trim() || undefined,
        color: newColor.trim() || undefined,
        metadata:
          categoryKey === "portals_and_authorities" && newPortalUrl.trim()
            ? {
                url: newPortalUrl.trim(),
                portalUrl: newPortalUrl.trim(),
              }
            : undefined,
      }).unwrap();

      toast.success(`"${trimmed}" added to ${categoryTitle}`);
      setDialogOpen(false);
      setNewLabel("");
      setNewPortalUrl("");
      setNewDescription("");
      setNewColor("");
      setOpen(false);
      onValueChange(created.value, created);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to create option");
    }
  };

  const openCreateDialogWithSearch = (presetName?: string) => {
    setNewLabel(presetName || search || "");
    setDialogOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal text-left h-9 text-xs sm:text-sm bg-background border-input hover:bg-accent/50 focus:ring-1 focus:ring-ring",
              !value && "text-muted-foreground",
              className
            )}
          >
            <span className="truncate flex items-center gap-2">
              {selectedOption ? (
                <>
                  {selectedOption.color && (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: selectedOption.color }}
                    />
                  )}
                  <span>{selectedOption.label}</span>
                </>
              ) : value ? (
                <span className="text-foreground">{value}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
          <Command shouldFilter={true}>
            <CommandInput
              placeholder={`Search ${categoryTitle}...`}
              value={search}
              onValueChange={setSearch}
              className="h-9 text-xs"
            />
            <CommandList className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Loading options...
                </div>
              ) : null}

              <CommandEmpty>
                <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                  No matching options found.
                  {allowCustomAdd && search.trim() && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateDialogWithSearch(search.trim())}
                      className="mt-2 w-full text-xs h-7 gap-1 border-dashed"
                    >
                      <Plus className="h-3 w-3" />
                      Add &ldquo;{search.trim()}&rdquo;
                    </Button>
                  )}
                </div>
              </CommandEmpty>

              <CommandGroup>
                {allOptions.map((opt) => {
                  const isSelected = value === opt.value || value === opt.label;
                  return (
                    <CommandItem
                      key={opt._id || opt.value}
                      value={`${opt.label} ${opt.value} ${opt.description || ""}`}
                      onSelect={() => {
                        onValueChange(opt.value, opt.rawOption);
                        setOpen(false);
                      }}
                      className="text-xs flex items-center justify-between cursor-pointer py-1.5 px-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.color && (
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                        )}
                        <span className="font-medium truncate">{opt.label}</span>
                        {itemDisplayMode === "both" && opt.value !== opt.label && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            ({opt.value})
                          </span>
                        )}
                        {opt.description && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                            — {opt.description}
                          </span>
                        )}
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
                      <span>Add New Option</span>
                    </Button>
                  </div>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Add Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Add New {categoryTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This option will be saved to your organization&apos;s settings and available for all team members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewOption} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label htmlFor="opt-name" className="text-xs font-medium">
                Option Name / Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="opt-name"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Registered Rent Agreement, HDFC Current A/c..."
                className="text-xs h-9"
                autoFocus
                required
              />
            </div>

            {categoryKey === "portals_and_authorities" && (
              <div className="space-y-1">
                <Label htmlFor="opt-portal-url" className="text-xs font-medium">
                  Portal URL / Website Link (Optional)
                </Label>
                <Input
                  id="opt-portal-url"
                  type="url"
                  value={newPortalUrl}
                  onChange={(e) => setNewPortalUrl(e.target.value)}
                  placeholder="https://services.gst.gov.in/services/login"
                  className="text-xs h-9"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="opt-desc" className="text-xs font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="opt-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief note or guidelines for team members..."
                className="text-xs min-h-[60px]"
              />
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
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> Save & Select
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

