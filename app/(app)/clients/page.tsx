"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search, Filter, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetClientsQuery } from "@/lib/services/api";
import { type Client } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Can } from "@/components/shared/Can";
import { withPermission } from "@/components/shared/withPermission";

const entityTypes = [
  "Individual",
  "Sole Proprietorship",
  "Partnership Firm",
  "Private Limited",
  "One Person Company",
  "LLP",
  "Trust",
  "NGO",
  "HUF",
  "Public Limited",
  "Other",
];

function ClientsPage() {
  const { data: clientsRes, isLoading } = useGetClientsQuery(undefined);
  const clients: Client[] = clientsRes?.clients || [];

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQ =
        !q ||
        [c.name, c.clientNumber, c.fileNo, c.email, c.mobile].some((v) =>
          v?.toLowerCase().includes(q.toLowerCase()),
        );
      const matchesType = typeFilter === "all" || c.entityType === typeFilter;
      return matchesQ && matchesType;
    });
  }, [clients, q, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${clients.length} total · ${filtered.length} shown`}
          </p>
        </div>

        <Can do="client:create">
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" /> New Client
            </Link>
          </Button>
        </Can>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, client number, email, mobile…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entity types</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client Number</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c._id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            c.photoUrl
                              ? `http://localhost:5000${c.photoUrl}`
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {c.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/clients/${c._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {c.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.clientNumber || c.fileNo || "-"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{c.entityType || "-"}</span>
                  </TableCell>
                  <TableCell className="text-sm">{c.mobile || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.isActive
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border bg-muted text-muted-foreground"
                      }
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-medium">No clients found</h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Try adjusting your search or filters, or add a new client to get
        started.
      </p>
    </div>
  );
}

export default withPermission(ClientsPage, "client:view");
