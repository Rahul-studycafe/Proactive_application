"use client";

import { useGetServicesQuery } from "@/lib/services/api";
import { Loader2, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ServicesTable() {
  const router = useRouter();
  const { data: response, isLoading } = useGetServicesQuery(undefined);
  const services = Array.isArray(response) ? response : [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground border rounded-lg bg-card mt-4">
        No services found. Create your first service blueprint.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>SAC</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>Default Rate</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Clients</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service: any) => (
            <TableRow
              key={service._id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/services/${service._id}`)}
            >
              <TableCell className="font-medium text-primary">
                <div>{service.name}</div>
                <div className="text-xs text-muted-foreground font-normal mt-0.5">
                  {service.isRecurring ? "Recurring" : "One-time"}
                  {service.isChecklistRequired ? " · Checklist required" : ""}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {service.sacCode || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {service.gstPercentage}%
              </TableCell>
              <TableCell className="text-muted-foreground">
                ₹{(service.defaultBillingRate || 0).toLocaleString("en-IN")}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="font-normal capitalize bg-muted text-muted-foreground hover:bg-muted"
                >
                  {service.frequency?.type?.replace("_", " ") || "One-Time"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="font-normal bg-primary/10 text-primary border-primary/20"
                >
                  {service.clientsCount || 0}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={service.isEnabled ? "default" : "secondary"}
                  className={
                    service.isEnabled
                      ? "bg-success/15 text-success hover:bg-success/20 font-normal border-success/30"
                      : "font-normal"
                  }
                >
                  {service.isEnabled ? "Active" : "Disabled"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/services/${service._id}`)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
