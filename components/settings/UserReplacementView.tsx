"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Building2,
  Briefcase,
  UserX,
  UserCheck,
  RotateCcw,
  Info,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  useGetUsersQuery,
  useGetUserReplacementPreviewQuery,
  useReplaceUserMutation,
} from "@/lib/services/api";
import { toast } from "sonner";

export function UserReplacementView() {
  const [departingUserId, setDepartingUserId] = useState<string>("");
  const [replacementUserId, setReplacementUserId] = useState<string>("");

  const [reassignTasks, setReassignTasks] = useState<boolean>(true);
  const [reassignClients, setReassignClients] = useState<boolean>(true);
  const [reassignServices, setReassignServices] = useState<boolean>(true);
  const [deactivateUser, setDeactivateUser] = useState<boolean>(true);

  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [handoverResult, setHandoverResult] = useState<{
    departingName: string;
    replacementName: string;
    tasksReassignedCount: number;
    clientsReassignedCount: number;
    servicesReassignedCount: number;
    userDeactivated: boolean;
  } | null>(null);

  // Fetch all organization users
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({
    limit: 200,
  });

  const users: any[] = useMemo(() => usersData?.users || [], [usersData]);

  // Preview query for departing user
  const {
    data: preview,
    isLoading: isLoadingPreview,
    isFetching: isFetchingPreview,
  } = useGetUserReplacementPreviewQuery(departingUserId, {
    skip: !departingUserId,
  });

  const [replaceUserMutation, { isLoading: isExecuting }] = useReplaceUserMutation();

  const departingUser = useMemo(
    () => users.find((u) => u._id === departingUserId),
    [users, departingUserId]
  );

  const replacementUser = useMemo(
    () => users.find((u) => u._id === replacementUserId),
    [users, replacementUserId]
  );

  const isDepartingOwner = Boolean(departingUser?.isOwner);

  // Available options for replacement
  const replacementOptions = useMemo(() => {
    return users.filter((u) => u._id !== departingUserId && u.isActive !== false);
  }, [users, departingUserId]);

  const canExecute = useMemo(() => {
    if (!departingUserId || !replacementUserId) return false;
    if (departingUserId === replacementUserId) return false;
    if (isDepartingOwner) return false;
    if (!reassignTasks && !reassignClients && !reassignServices && !deactivateUser)
      return false;
    return true;
  }, [
    departingUserId,
    replacementUserId,
    isDepartingOwner,
    reassignTasks,
    reassignClients,
    reassignServices,
    deactivateUser,
  ]);

  const handleExecuteHandover = async () => {
    if (!canExecute || !departingUser || !replacementUser) return;

    try {
      const res = await replaceUserMutation({
        departingUserId,
        replacementUserId,
        reassignTasks,
        reassignClients,
        reassignServices,
        deactivateUser,
      }).unwrap();

      setHandoverResult({
        departingName: departingUser.name,
        replacementName: replacementUser.name,
        tasksReassignedCount: res.tasksReassignedCount ?? 0,
        clientsReassignedCount: res.clientsReassignedCount ?? 0,
        servicesReassignedCount: res.servicesReassignedCount ?? 0,
        userDeactivated: res.userDeactivated ?? false,
      });

      toast.success("Staff handover completed successfully!");
      setIsConfirmOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to execute staff handover"
      );
    }
  };

  const handleReset = () => {
    setDepartingUserId("");
    setReplacementUserId("");
    setReassignTasks(true);
    setReassignClients(true);
    setReassignServices(true);
    setDeactivateUser(true);
    setHandoverResult(null);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  User Replacement & Staff Handover
                </h1>
                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                  Staff Transition
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seamlessly transfer active tasks, client portfolios, and subscribed service responsibilities from a departing team member to a replacement colleague.
              </p>
            </div>
          </div>
        </div>

        {handoverResult && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs self-start sm:self-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Handover Another Staff</span>
          </Button>
        )}
      </div>

      {/* Success Summary Banner */}
      {handoverResult && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-emerald-500/20 p-2.5 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-emerald-950 dark:text-emerald-200">
                Staff Handover Completed Successfully
              </h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                All designated responsibilities from{" "}
                <span className="font-semibold underline decoration-emerald-500/50">
                  {handoverResult.departingName}
                </span>{" "}
                have been atomically reassigned to{" "}
                <span className="font-semibold underline decoration-emerald-500/50">
                  {handoverResult.replacementName}
                </span>
                . An audit log entry has been inserted into the task history and a notification has been dispatched.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-lg border border-emerald-500/20 bg-background/80 p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Tasks Reassigned</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {handoverResult.tasksReassignedCount}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-background/80 p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Clients Reassigned</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {handoverResult.clientsReassignedCount}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-background/80 p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Services Reassigned</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {handoverResult.servicesReassignedCount}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-background/80 p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Account Status</p>
              <div className="text-xs font-semibold mt-2">
                {handoverResult.userDeactivated ? (
                  <Badge variant="destructive" className="text-[11px] font-normal">
                    Deactivated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-normal">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Perform Another Handover
            </Button>
          </div>
        </div>
      )}

      {/* Main Handover Form (Hidden if currently showing success banner until reset) */}
      {!handoverResult && (
        <div className="space-y-6">
          {/* Info Notice */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-900 dark:text-blue-200">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950 dark:text-blue-100">
                Staff Offboarding & Workload Migration Rules
              </p>
              <p className="text-muted-foreground leading-relaxed">
                • Only non-completed and active tasks are reassigned. Completed and cancelled tasks are strictly preserved to maintain statutory compliance trails.
                <br />
                • The Organization Owner account is protected and cannot be departed or replaced.
                <br />
                • If deactivation is selected, the departing user’s JWT sessions are invalidated immediately across all browsers.
              </p>
            </div>
          </div>

          {/* Dual User Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {/* Center Flow Indicator on Desktop */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground">
              <ArrowRight className="h-5 w-5" />
            </div>

            {/* Left Card: Departing Staff */}
            <div className="rounded-xl border border-destructive/30 bg-card p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-destructive/10 text-destructive">
                    <UserX className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Departing Staff Member
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Outgoing employee leaving or changing role
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5 font-semibold">
                  Source
                </Badge>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Select Outgoing Staff <span className="text-destructive">*</span>
                </label>
                <Select
                  value={departingUserId}
                  onValueChange={(val) => {
                    setDepartingUserId(val);
                    if (val === replacementUserId) {
                      setReplacementUserId("");
                    }
                  }}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className="w-full h-11 bg-background text-sm">
                    <SelectValue placeholder={isLoadingUsers ? "Loading staff members..." : "Choose departing staff..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {users.map((u) => {
                      const roleName = (u.roleId as any)?.name || (u.isOwner ? "Owner" : "Staff");
                      return (
                        <SelectItem key={u._id} value={u._id} className="cursor-pointer py-2">
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={u.photoUrl} />
                                <AvatarFallback className="text-[10px] bg-muted">
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="text-xs font-semibold leading-none">{u.name}</p>
                                <p className="text-[11px] text-muted-foreground">{u.email || u.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {u.isOwner && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600">
                                  Owner
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                {roleName}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner Warning Guard */}
              {isDepartingOwner && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="font-semibold">Protected Practice Owner:</strong> The primary practice owner account cannot be transferred or departed via user replacement. Please select an employee or manager.
                  </p>
                </div>
              )}

              {/* Selected User Details & Responsibility Preview */}
              {departingUser && !isDepartingOwner && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={departingUser.photoUrl} />
                      <AvatarFallback className="bg-destructive/10 text-destructive font-semibold">
                        {getInitials(departingUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {departingUser.name}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {(departingUser.roleId as any)?.name || "Staff"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {departingUser.email || departingUser.username}
                      </p>
                    </div>
                  </div>

                  {/* Impact Statistics */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Current Workload Scope</span>
                      {(isLoadingPreview || isFetchingPreview) && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          Calculating...
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg border border-border/60 bg-background text-center">
                        <div className="flex items-center justify-center text-muted-foreground mb-1">
                          <CheckSquare className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Active Tasks</p>
                        <p className="text-lg font-bold text-foreground">
                          {isLoadingPreview ? "..." : (preview?.activeTasksCount ?? 0)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-border/60 bg-background text-center">
                        <div className="flex items-center justify-center text-muted-foreground mb-1">
                          <Building2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Clients</p>
                        <p className="text-lg font-bold text-foreground">
                          {isLoadingPreview ? "..." : (preview?.clientsCount ?? 0)}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-border/60 bg-background text-center">
                        <div className="flex items-center justify-center text-muted-foreground mb-1">
                          <Briefcase className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">Services</p>
                        <p className="text-lg font-bold text-foreground">
                          {isLoadingPreview ? "..." : (preview?.servicesCount ?? 0)}
                        </p>
                      </div>
                    </div>

                    {preview && preview.activeTasksCount === 0 && preview.clientsCount === 0 && preview.servicesCount === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center italic pt-1">
                        This staff member currently has 0 active responsibilities.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Card: Replacement Staff */}
            <div className="rounded-xl border border-emerald-500/30 bg-card p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Replacement Staff Member
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Colleague taking over workloads & clients
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold">
                  Destination
                </Badge>
              </div>

              {/* Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Select Incoming Staff <span className="text-destructive">*</span>
                </label>
                <Select
                  value={replacementUserId}
                  onValueChange={setReplacementUserId}
                  disabled={isLoadingUsers || !departingUserId || isDepartingOwner}
                >
                  <SelectTrigger className="w-full h-11 bg-background text-sm">
                    <SelectValue
                      placeholder={
                        !departingUserId
                          ? "Select departing staff first..."
                          : isLoadingUsers
                          ? "Loading staff members..."
                          : "Choose replacement colleague..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {replacementOptions.map((u) => {
                      const roleName = (u.roleId as any)?.name || (u.isOwner ? "Owner" : "Staff");
                      return (
                        <SelectItem key={u._id} value={u._id} className="cursor-pointer py-2">
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={u.photoUrl} />
                                <AvatarFallback className="text-[10px] bg-muted">
                                  {getInitials(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-left">
                                <p className="text-xs font-semibold leading-none">{u.name}</p>
                                <p className="text-[11px] text-muted-foreground">{u.email || u.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {u.isOwner && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600">
                                  Owner
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                {roleName}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected User Details */}
              {replacementUser && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={replacementUser.photoUrl} />
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {getInitials(replacementUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate text-foreground">
                          {replacementUser.name}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {(replacementUser.roleId as any)?.name || "Staff"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {replacementUser.email || replacementUser.username}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      Ready to Receive Workload
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      The replacement staff will be notified automatically with details of newly assigned tasks and clients.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Handover Scope & Actions */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Handover Configuration & Transfer Scope
              </h2>
              <p className="text-xs text-muted-foreground">
                Select which assets and duties to reassign, and specify account offboarding behavior.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Tasks */}
              <div
                onClick={() => setReassignTasks(!reassignTasks)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  reassignTasks
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:border-border"
                }`}
              >
                <Checkbox
                  checked={reassignTasks}
                  onCheckedChange={(c) => setReassignTasks(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      Reassign Active Tasks
                    </p>
                    {preview && preview.activeTasksCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {preview.activeTasksCount} tasks
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Transfers all pending and in-progress tasks as well as subtasks. Maintains immutable audit history.
                  </p>
                </div>
              </div>

              {/* Option 2: Clients */}
              <div
                onClick={() => setReassignClients(!reassignClients)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  reassignClients
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:border-border"
                }`}
              >
                <Checkbox
                  checked={reassignClients}
                  onCheckedChange={(c) => setReassignClients(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      Reassign Client Portfolios
                    </p>
                    {preview && preview.clientsCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {preview.clientsCount} clients
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Transfers client assignment so the replacement colleague can access client documents and vaults.
                  </p>
                </div>
              </div>

              {/* Option 3: Services */}
              <div
                onClick={() => setReassignServices(!reassignServices)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  reassignServices
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:border-border"
                }`}
              >
                <Checkbox
                  checked={reassignServices}
                  onCheckedChange={(c) => setReassignServices(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      Reassign Subscribed Services
                    </p>
                    {preview && preview.servicesCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {preview.servicesCount} services
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Transfers recurring service responsibilities (e.g. GST returns, TDS filings, book closings).
                  </p>
                </div>
              </div>

              {/* Option 4: Deactivate User */}
              <div
                onClick={() => setDeactivateUser(!deactivateUser)}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all cursor-pointer ${
                  deactivateUser
                    ? "border-destructive/40 bg-destructive/5 shadow-sm"
                    : "border-border/60 bg-muted/20 hover:border-border"
                }`}
              >
                <Checkbox
                  checked={deactivateUser}
                  onCheckedChange={(c) => setDeactivateUser(Boolean(c))}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-destructive">
                    Deactivate Departing User Account
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sets account to Inactive, terminates active JWT sessions immediately, and prevents login.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={!departingUserId && !replacementUserId}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Selections
              </Button>

              <Button
                onClick={() => setIsConfirmOpen(true)}
                disabled={!canExecute || isExecuting}
                className="gap-2 font-medium"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing Reassignment...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4" />
                    Execute Staff Handover
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center text-lg">
              Confirm Staff Workload Handover
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs leading-relaxed text-muted-foreground">
              Are you sure you want to transfer responsibilities from{" "}
              <strong className="text-foreground">{departingUser?.name}</strong> to{" "}
              <strong className="text-foreground">{replacementUser?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between font-medium">
                <span className="text-muted-foreground">Active Tasks Reassignment:</span>
                <span className="font-semibold text-foreground">
                  {reassignTasks ? `${preview?.activeTasksCount ?? 0} Tasks` : "Skipped"}
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-muted-foreground">Client Portfolios Reassignment:</span>
                <span className="font-semibold text-foreground">
                  {reassignClients ? `${preview?.clientsCount ?? 0} Clients` : "Skipped"}
                </span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-muted-foreground">Recurring Services Reassignment:</span>
                <span className="font-semibold text-foreground">
                  {reassignServices ? `${preview?.servicesCount ?? 0} Services` : "Skipped"}
                </span>
              </div>
              <div className="flex items-center justify-between font-medium pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Account Deactivation:</span>
                <span className={deactivateUser ? "font-semibold text-destructive" : "text-muted-foreground"}>
                  {deactivateUser ? "Immediate Deactivation & Session Revocation" : "Keep Account Active"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              ⚠️ This operation will take effect immediately. Task history entries will be recorded for audit and compliance.
            </p>
          </div>

          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExecuteHandover();
              }}
              disabled={isExecuting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Executing...
                </>
              ) : (
                "Yes, Transfer Responsibilities"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
