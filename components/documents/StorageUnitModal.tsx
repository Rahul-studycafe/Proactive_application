"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateStorageLocationMutation,
  useUpdateStorageLocationMutation,
} from "@/lib/services/api";
import {
  StorageLocationSummary,
  StorageUnitType,
} from "@/lib/types/physical-document";
import { Archive, MapPin, Building, Tag } from "lucide-react";

interface StorageUnitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitToEdit?: StorageLocationSummary | null;
}

const STORAGE_UNIT_TYPES: StorageUnitType[] = [
  "Cabinet",
  "Shelf",
  "Safe Box",
  "Locker",
  "Drawer",
  "Archive Room",
  "Other",
];

export function StorageUnitModal({
  open,
  onOpenChange,
  unitToEdit,
}: StorageUnitModalProps) {
  const isEditing = !!unitToEdit;

  const [createUnit, { isLoading: isCreating }] =
    useCreateStorageLocationMutation();
  const [updateUnit, { isLoading: isUpdating }] =
    useUpdateStorageLocationMutation();
  const isSubmitting = isCreating || isUpdating;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unitType, setUnitType] = useState<StorageUnitType>("Cabinet");
  const [roomOrFloor, setRoomOrFloor] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    if (unitToEdit) {
      setName(unitToEdit.location || "");
      setCode(unitToEdit.code || "");
      setUnitType(unitToEdit.unitType || "Cabinet");
      setRoomOrFloor(unitToEdit.roomOrFloor || "");
      setDescription(unitToEdit.description || "");
    } else {
      setName("");
      setCode("");
      setUnitType("Cabinet");
      setRoomOrFloor("");
      setDescription("");
    }
  }, [open, unitToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      toast.error("Storage unit name must be at least 2 characters.");
      return;
    }

    try {
      if (isEditing && unitToEdit?._id) {
        await updateUnit({
          id: unitToEdit._id,
          data: {
            name: name.trim(),
            code: code.trim() || undefined,
            unitType,
            roomOrFloor: roomOrFloor.trim() || undefined,
            description: description.trim() || undefined,
            updateReferencedDocs: true,
          },
        }).unwrap();
        toast.success(`Storage unit "${name.trim()}" updated successfully.`);
      } else {
        await createUnit({
          name: name.trim(),
          code: code.trim() || undefined,
          unitType,
          roomOrFloor: roomOrFloor.trim() || undefined,
          description: description.trim() || undefined,
        }).unwrap();
        toast.success(`Storage unit "${name.trim()}" created successfully.`);
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Failed to save storage unit";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Storage Unit" : "Add Office Storage Unit"}
              </DialogTitle>
              <DialogDescription>
                Configure office filing cabinets, shelves, safe boxes, and
                lockers to keep client assets organized.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Unit Name */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">
              Unit Name / Location Label{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="unit-name"
              placeholder="e.g. Cabinet A, Shelf 1 or Fireproof Safe 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Unit Type & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit-type">Unit Type</Label>
              <Select
                value={unitType}
                onValueChange={(val) => setUnitType(val as StorageUnitType)}
              >
                <SelectTrigger id="unit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_UNIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-code" className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Unit Code (Optional)
              </Label>
              <Input
                id="unit-code"
                placeholder="e.g. CAB-A-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          {/* Room / Floor Location */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-room" className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-muted-foreground" />
              Room / Floor / Section
            </Label>
            <Input
              id="unit-room"
              placeholder="e.g. Accounts Department, 2nd Floor, Room 204"
              value={roomOrFloor}
              onChange={(e) => setRoomOrFloor(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="unit-desc">
              Description / Stored Asset Guidelines
            </Label>
            <Textarea
              id="unit-desc"
              rows={2}
              placeholder="e.g. Restricted to original company deeds, seals, and confidential director passbooks."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sticky bottom-0 bg-background/95 backdrop-blur border-t mt-4 pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Storage Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
