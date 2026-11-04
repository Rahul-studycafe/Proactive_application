"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useGetPasswordsQuery,
  useDeletePasswordMutation,
  useGetPortalsQuery,
} from "@/lib/services/api";
import { ClientPassword } from "@/lib/types/passwords";
import { AddPasswordModal } from "./AddPasswordModal";
import { RevealPasswordDialog } from "./RevealPasswordDialog";
import { PasswordAuditDrawer } from "./PasswordAuditDrawer";
import { ImportPasswordsModal } from "./ImportPasswordsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Pencil,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  History,
  Lock,
  Globe,
  Building2,
  FileCheck2,
  Sparkles,
  Shield,
  Layers,
  Calendar,
} from "lucide-react";

interface ClientPasswordsTabProps {
  clientId: string;
  clientName?: string;
  clientFileNo?: string;
}

export function ClientPasswordsTab({
  clientId,
  clientName,
  clientFileNo,
}: ClientPasswordsTabProps) {
  const [search, setSearch] = useState("");
  const [portalFilter, setPortalFilter] = useState("all");

  // Modal & Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<ClientPassword | null>(null);

  const [revealCredential, setRevealCredential] =
    useState<ClientPassword | null>(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);

  const [auditPasswordId, setAuditPasswordId] = useState<string | undefined>(
    undefined,
  );
  const [auditPortalName, setAuditPortalName] = useState<string | undefined>(
    undefined,
  );
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClientPassword | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);

  // Queries & Mutations
  const queryParams = useMemo(() => {
    return {
      clientId,
      search: search.trim() || undefined,
      portalName: portalFilter !== "all" ? portalFilter : undefined,
      limit: 100,
    };
  }, [clientId, search, portalFilter]);

  const { data, isLoading, isFetching, refetch } = useGetPasswordsQuery(
    queryParams,
    {
      skip: !clientId,
    },
  );

  const { data: portals = [] } = useGetPortalsQuery();
  const [deletePassword, { isLoading: isDeleting }] =
    useDeletePasswordMutation();

  const passwords: ClientPassword[] = data?.passwords || [];
  const totalCount = data?.total || 0;

  // Compute distinct portals covered
  const distinctPortals = useMemo(() => {
    const set = new Set<string>();
    passwords.forEach((p) => {
      if (p.portalName) set.add(p.portalName.trim());
    });
    return set.size;
  }, [passwords]);

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
          <FileCheck2 className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (
      lower.includes("mca") ||
      lower.includes("roc") ||
      lower.includes("v2") ||
      lower.includes("v3")
    ) {
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 gap-1 font-semibold">
          <Layers className="h-3 w-3" /> {name}
        </Badge>
      );
    }
    if (lower.includes("traces") || lower.includes("tds")) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-semibold">
          <Shield className="h-3 w-3" /> {name}
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
    <div className="space-y-4">
      {/* Minimalist Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <KeyRound className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight">
                {totalCount}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                Credentials
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight">
                {distinctPortals}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                Portals
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
              AES-256-CBC
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Encrypted At Rest
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/70 bg-card/60 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <History className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate">
                Audit Trail
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Access Logged
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenAudit()}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground shrink-0 font-medium"
          >
            Logs
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-xl border border-border/70 bg-card shadow-sm overflow-hidden">
        {/* Toolbar Bar */}
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-muted/20">
          {/* Search & Portal Filter */}
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search portal, username, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-background"
              />
            </div>

            <Select value={portalFilter} onValueChange={setPortalFilter}>
              <SelectTrigger className="w-full sm:w-[190px] h-9 text-xs bg-background">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs h-9 gap-1.5 border-border"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Credential</span>
            </Button>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[200px] text-xs font-semibold">
                  Portal / Authority
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Username / Login ID
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Password
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Security Notes / Remarks
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Last Verified
                </TableHead>
                <TableHead className="text-right text-xs font-semibold w-[160px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-sm text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading client credentials...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : passwords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          No Credentials Saved
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Keep all tax portal logins (GST, IT, MCA, TRACES)
                          securely encrypted in one place.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleOpenAdd}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add First Credential</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsImportModalOpen(true)}
                          className="text-xs h-8 gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Bulk Import</span>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                passwords.map((p) => {
                  return (
                    <TableRow
                      key={p._id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* Portal Column */}
                      <TableCell className="align-middle">
                        <div className="space-y-1">
                          <div>{getPortalBadge(p.portalName)}</div>
                          {p.portalUrl && (
                            <a
                              href={p.portalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-muted-foreground hover:text-blue-600 inline-flex items-center gap-1 font-mono transition-colors"
                              title={p.portalUrl}
                            >
                              <span className="truncate max-w-[140px]">
                                {p.portalUrl.replace(/^https?:\/\//, "")}
                              </span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Username Column */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground bg-muted/60 px-2 py-1 rounded border border-border/50 select-all">
                            {p.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUsername(p)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title="Copy username"
                          >
                            {copiedUsernameId === p._id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      {/* Masked Password Column */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm tracking-widest text-muted-foreground font-bold select-none">
                            ••••••••
                          </span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenReveal(p)}
                            className="h-7 px-2 text-[11px] font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Reveal</span>
                          </Button>
                        </div>
                      </TableCell>

                      {/* Notes Column */}
                      <TableCell className="align-middle max-w-[200px]">
                        {p.notes ? (
                          <p
                            className="text-xs text-muted-foreground line-clamp-2"
                            title={p.notes}
                          >
                            {p.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Last Verified */}
                      <TableCell className="align-middle">
                        {p.lastVerifiedDate ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/80" />
                            {new Date(p.lastVerifiedDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            Not set
                          </span>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenAudit(p._id, p.portalName)}
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                            title="View security audit logs"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Edit credential"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete credential"
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

      {/* Add / Edit Modal */}
      <AddPasswordModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        clientId={clientId}
        credentialToEdit={editingCredential}
      />

      {/* Reveal Password Dialog */}
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

      {/* Audit Log Slide-over Drawer */}
      <PasswordAuditDrawer
        open={isAuditDrawerOpen}
        onOpenChange={setIsAuditDrawerOpen}
        clientId={clientId}
        passwordId={auditPasswordId}
        portalName={auditPortalName}
      />

      {/* Bulk Excel Import Modal */}
      <ImportPasswordsModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        defaultClientName={clientName}
        defaultClientFileNo={clientFileNo}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Portal Credential?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to permanently delete the encrypted
              credentials for{" "}
              <strong className="text-foreground">
                {deleteTarget?.portalName}
              </strong>{" "}
              (<span className="font-mono">{deleteTarget?.username}</span>)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? "Deleting..." : "Delete Credential"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
