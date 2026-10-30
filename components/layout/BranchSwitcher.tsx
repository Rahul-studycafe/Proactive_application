"use client";

import { useEffect, useState } from "react";
import { Building2, Check, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetBillingEntitiesQuery } from "@/lib/services/api";
import { toast } from "sonner";

export function BranchSwitcher() {
  const { data: entities = [], isLoading } = useGetBillingEntitiesQuery();
  const [activeEntityId, setActiveEntityId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && entities.length > 0) {
      const stored = localStorage.getItem("activeBillingEntityId");
      const found = entities.find((e: any) => e._id === stored);
      if (found) {
        setActiveEntityId(found._id);
      } else {
        const defaultEntity = entities.find((e: any) => e.isDefault) || entities[0];
        if (defaultEntity) {
          setActiveEntityId(defaultEntity._id);
          localStorage.setItem("activeBillingEntityId", defaultEntity._id);
        }
      }
    }
  }, [entities]);

  const handleSelect = (entity: any) => {
    setActiveEntityId(entity._id);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeBillingEntityId", entity._id);
      window.dispatchEvent(new Event("branchChanged"));
    }
    toast.success(`Active branch switched to ${entity.branchName || entity.name}`);
  };

  if (isLoading || entities.length <= 1) {
    // If only 1 entity or loading, show compact badge
    const active = entities.find((e: any) => e._id === activeEntityId) || entities[0];
    if (!active) return null;
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-xs font-medium text-foreground">
        <Building2 className="h-3.5 w-3.5 text-primary" />
        <span className="truncate max-w-[120px]">{active.branchName || active.name}</span>
      </div>
    );
  }

  const active = entities.find((e: any) => e._id === activeEntityId) || entities[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold bg-background hover:bg-muted/50 border-border shadow-2xs"
        >
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span className="truncate max-w-[140px]">{active?.branchName || active?.name || "Branch"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          Switch Regional Branch Context
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {entities.map((entity: any) => {
          const isSelected = entity._id === activeEntityId;
          return (
            <DropdownMenuItem
              key={entity._id}
              onClick={() => handleSelect(entity)}
              className="flex items-start justify-between p-2 cursor-pointer text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span>{entity.branchName || entity.name}</span>
                  {entity.isDefault && (
                    <Badge variant="secondary" className="text-[9px] py-0 px-1">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {entity.stateCode ? `State: ${entity.stateCode}` : ""}{entity.gstin ? ` • ${entity.gstin}` : ""}
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

