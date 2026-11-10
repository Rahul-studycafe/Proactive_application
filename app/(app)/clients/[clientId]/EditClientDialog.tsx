"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateClientMutation } from "@/lib/services/api";
import { toast } from "sonner";
import { type Client } from "@/lib/types";
import { DynamicConfigSelect } from "@/components/ui/dynamic-config-select";

export function EditClientDialog({ client }: { client: Client }) {
  const [open, setOpen] = useState(false);
  const [updateClient, { isLoading }] = useUpdateClientMutation();

  const [formData, setFormData] = useState({
    name: client.name || "",
    clientNumber: client.clientNumber || client.fileNo || "",
    fileNo: client.clientNumber || client.fileNo || "",
    entityType: client.entityType || "",
    group: client.group || "",
    email: client.email || "",
    mobile: client.mobile || "",
    pan: client.pan || "",
    gstin: client.gstin || "",
    isActive: client.isActive ?? true,
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateClient({
        id: client._id || (client as any).id,
        ...formData,
      }).unwrap();
      toast.success("Client updated successfully");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> Edit Client
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Number (Optional)</Label>
                <Input
                  value={formData.clientNumber}
                  onChange={(e) => {
                    handleChange("clientNumber", e.target.value);
                    handleChange("fileNo", e.target.value);
                  }}
                  placeholder="e.g. C1234"
                />
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <DynamicConfigSelect
                  categoryKey="client_entity_types"
                  value={formData.entityType}
                  onValueChange={(val) => handleChange("entityType", val)}
                  placeholder="Select type"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client Group (Optional)</Label>
              <DynamicConfigSelect
                categoryKey="client_groups"
                value={formData.group}
                onValueChange={(val) => handleChange("group", val)}
                placeholder="Select Group"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input
                  value={formData.pan}
                  onChange={(e) =>
                    handleChange("pan", e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) =>
                    handleChange("gstin", e.target.value.toUpperCase())
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-[13px] text-muted-foreground">
                  Inactive clients cannot have new tasks
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(val) => handleChange("isActive", val)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
