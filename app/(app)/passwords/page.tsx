"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetPasswordsQuery,
  useDeletePasswordMutation,
  useGetPortalsQuery,
  useGetClientsQuery,
} from "@/lib/services/api";
import { ClientPassword } from "@/lib/types/passwords";
import { AddPasswordModal } from "@/components/passwords/AddPasswordModal";
import { RevealPasswordDialog } from "@/components/passwords/RevealPasswordDialog";
import { PasswordAuditDrawer } from "@/components/passwords/PasswordAuditDrawer";
import { ImportPasswordsModal } from "@/components/passwords/ImportPasswordsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Upload,
  Search,
  Eye,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Pencil,
  Trash2,
  History,
  RefreshCw,
  Globe,
  Lock,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";

export default function PasswordsMasterPage() {
  const [search, setSearch] = useState("");
  const [portalFilter, setPortalFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<ClientPassword | null>(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [revealCredential, setRevealCredential] =
    useState<ClientPassword | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditPasswordId, setAuditPasswordId] = useState<string | undefined>(
    undefined,
  );
  const [auditPortalName, setAuditPortalName] = useState<string | undefined>(
    undefined,
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientPassword | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);

  // Queries
  const queryParams = useMemo(() => {
    const params: any = { limit: 100 };
    if (clientFilter && clientFilter !== "all") params.clientId = clientFilter;
    if (portalFilter && portalFilter !== "all")
      params.portalName = portalFilter;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [clientFilter, portalFilter, search]);

  const { data, isLoading, isFetching, refetch } =
    useGetPasswordsQuery(queryParams);
  const { data: portals = [] } = useGetPortalsQuery();
  const { data: clientsData } = useGetClientsQuery({ limit: 100 });
  const clients = clientsData?.clients || [];

  const [deletePassword, { isLoading: isDeleting }] =
    useDeletePasswordMutation();

  const passwords = data?.passwords || [];
  const totalCount = data?.total || 0;

  // Analytics Computation
  const distinctPortalsCount = useMemo(() => {
    const set = new Set<string>();
    passwords.forEach((p) => {
      if (p.portalName) set.add(p.portalName.trim());
    });
    return set.size;
  }, [passwords]);

  const distinctClientsCount = useMemo(() => {
    const set = new Set<string>();
    passwords.forEach((p) => {
      const cId = typeof p.clientId === "object" ? p.clientId?._id : p.clientId;
      if (cId) set.add(cId);
    });
    return set.size;
  }, [passwords]);

  const verifiedCount = useMemo(() => {
    return passwords.filter((p) => !!p.lastVerifiedDate).length;
  }, [passwords]);

  // Actions
  const handleCopyUsername = async (p: ClientPassword) => {
    try {
      await navigator.clipboard.writeText(p.username);
      setCopiedUsernameId(p._id);
      toast.success(`Username copied: ${p.username}`);
      setTimeout(() => setCopiedUsernameId(null), 2000);
    } catch {
      toast.error("Failed to copy username");
    }
  };

  const handleOpenAdd = () => {
    setEditingCredential(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: ClientPassword) => {
    setEditingCredential(p);
    setIsAddModalOpen(true);
  };

  const handleOpenReveal = (p: ClientPassword) => {
    setRevealCredential(p);
    setIsRevealOpen(true);
  };

  const handleOpenAudit = (passwordId?: string, portalName?: string) => {
    setAuditPasswordId(passwordId);
    setAuditPortalName(portalName);
    setIsAuditDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePassword(deleteTarget._id).unwrap();
      toast.success(`${deleteTarget.portalName} credential deleted`);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to delete credential",
      );
    }
  };

  // Helper for portal badge styling
  const getPortalBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("gst")) {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold">
          <Building2 className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (
      lower.includes("income tax") ||
      lower.includes("itax") ||
      lower.includes("pan")
    ) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (
      lower.includes("mca") ||
      lower.includes("roc") ||
      lower.includes("v3")
    ) {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 gap-1 font-semibold">
          <Globe className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (lower.includes("traces") || lower.includes("tds")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
          <Lock className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (
      lower.includes("epfo") ||
      lower.includes("pf") ||
      lower.includes("esic")
    ) {
      return (
        <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 gap-1 font-semibold">
          <Users className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 font-medium">
        <Globe className="h-3 w-3" /> {name}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-primary" />
            <span>Client Portal Password Vault</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized practice-wide portal credentials protected by AES-256
            cryptographic encryption and access audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAudit()}
            className="text-xs h-9 gap-1.5 border-border"
          >
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Practice Audit Logs</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs h-9 gap-1.5 border-border"
          >
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Import Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Credential</span>
          </Button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-foreground">
              {totalCount}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Stored Credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {distinctPortalsCount}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Portals Covered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-purple-600 dark:text-purple-400">
              {distinctClientsCount}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Clients Covered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {verifiedCount} / {totalCount}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Verified Logins
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-muted/20">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search portal, username, notes, client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            {/* Client Filter */}
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs bg-background">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Clients ({clients.length})
                </SelectItem>
                {clients.map((c: any) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name} {c.fileNo ? `(${c.fileNo})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Portal Filter */}
            <Select value={portalFilter} onValueChange={setPortalFilter}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs bg-background">
                <SelectValue placeholder="All Portals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portals</SelectItem>
                {portals.map((p) => (
                  <SelectItem key={p._id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {(search || portalFilter !== "all" || clientFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPortalFilter("all");
                  setClientFilter("all");
                }}
                className="text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 w-9 border-border"
              title="Refresh credentials"
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs font-semibold">
                  Client Entity
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Portal / Authority
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Username / Login ID
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Encrypted Secret
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Notes / Purpose
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Last Updated
                </TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell
                      colSpan={7}
                      className="h-14 animate-pulse bg-muted/10"
                    />
                  </TableRow>
                ))
              ) : passwords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2.5">
                      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                        <Lock className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No credentials found
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {search ||
                        portalFilter !== "all" ||
                        clientFilter !== "all"
                          ? "Try clearing your search filters to find what you're looking for."
                          : "Start adding client portal credentials or import your bulk spreadsheet."}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleOpenAdd}
                        className="text-xs mt-2 gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add First Credential
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                passwords.map((p) => {
                  const clientObj =
                    typeof p.clientId === "object" ? p.clientId : null;
                  const clientIdStr =
                    clientObj?._id ||
                    (typeof p.clientId === "string" ? p.clientId : "");
                  const isCopied = copiedUsernameId === p._id;

                  return (
                    <TableRow
                      key={p._id}
                      className="hover:bg-muted/30 transition-colors border-border/50"
                    >
                      {/* Client Entity */}
                      <TableCell className="align-middle">
                        {clientObj ? (
                          <Link
                            href={`/clients/${clientObj._id}?tab=passwords`}
                            className="group flex flex-col hover:underline text-foreground"
                          >
                            <span className="font-semibold text-xs group-hover:text-primary transition-colors">
                              {clientObj.name}
                            </span>
                            {clientObj.fileNo && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {clientObj.fileNo}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            {clientIdStr.slice(0, 8) || "Client"}
                          </span>
                        )}
                      </TableCell>

                      {/* Portal */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-1.5">
                          {getPortalBadge(p.portalName)}
                          {p.portalUrl && (
                            <a
                              href={p.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-blue-600 transition-colors"
                              title={`Visit ${p.portalName}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Username */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2 group">
                          <code className="text-xs font-mono font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50">
                            {p.username}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyUsername(p)}
                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy Username"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Masked Password & Reveal Trigger */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground tracking-widest select-none">
                            ••••••••
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReveal(p)}
                            className="h-7 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                            title="Decrypt & Reveal Password"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reveal</span>
                          </Button>
                        </div>
                      </TableCell>

                      {/* Notes */}
                      <TableCell className="align-middle">
                        <p
                          className="text-xs text-muted-foreground max-w-xs truncate"
                          title={p.notes || ""}
                        >
                          {p.notes || "—"}
                        </p>
                      </TableCell>

                      {/* Updated At */}
                      <TableCell className="align-middle">
                        <span className="text-xs text-muted-foreground">
                          {p.updatedAt
                            ? new Date(p.updatedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenAudit(p._id, p.portalName)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="View Access Audit Trail"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit Credential"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete Credential"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Credential Modal */}
      <AddPasswordModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        credentialToEdit={editingCredential}
      />

      {/* Reveal Decrypted Password Dialog */}
      <RevealPasswordDialog
        open={isRevealOpen}
        onOpenChange={setIsRevealOpen}
        credential={revealCredential}
        onAuditLogsClick={() => {
          if (revealCredential) {
            handleOpenAudit(revealCredential._id, revealCredential.portalName);
          }
        }}
      />

      {/* Access Audit Drawer */}
      <PasswordAuditDrawer
        open={isAuditDrawerOpen}
        onOpenChange={setIsAuditDrawerOpen}
        passwordId={auditPasswordId}
        portalName={auditPortalName}
      />

      {/* Bulk Excel Import Modal */}
      <ImportPasswordsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portal Credential?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the credentials for{" "}
              <strong>{deleteTarget?.portalName}</strong> (
              {deleteTarget?.username})? This action is permanent and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
