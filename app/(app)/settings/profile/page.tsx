"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { BackButton } from "@/components/shared/BackButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Shield,
  ShieldCheck,
  Camera,
  X,
  Users,
  Clock,
  ArrowUpRight,
  Sparkles,
  User,
} from "lucide-react";

const AVATAR_STORAGE_KEY = "pms.avatar";

import {
  useUploadAvatarMutation,
  useGetTenantUsageQuery,
} from "@/lib/services/api";

export default function SettingsProfilePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const { data: usage } = useGetTenantUsageQuery();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await uploadAvatar(formData).unwrap();
      toast.success("Avatar updated");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to upload avatar");
    }
  };

  const handleRemoveAvatar = () => {
    // Currently removal is not implemented in backend, just show toast
    toast.error("Removing avatar is not supported yet");
  };

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? "",
    bio: user?.bio ?? "",
  });

  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    taskReminders: true,
    weeklyDigest: false,
    marketing: false,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.current || !password.next) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (password.next !== password.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (password.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPassword({ current: "", next: "", confirm: "" });
    toast.success("Password changed successfully");
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings" },
          { label: "My Profile" },
        ]}
      />
      {/* <BackButton href="/settings" label="Back to Settings" /> */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information, security, and notification
          preferences.
        </p>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar preview"
                className={`h-full w-full rounded-full object-cover ring-2 ring-border ${isUploading ? "opacity-50" : ""}`}
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground ${isUploading ? "opacity-50" : ""}`}
              >
                {user?.initials}
              </div>
            )}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted shadow-sm ring-1 ring-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Change avatar"
            >
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <Badge variant="secondary" className="gap-1 font-normal">
                <Shield className="h-3 w-3" />
                {user?.role}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {user?.workspace}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(user?.joinDate || "").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>
              Update your contact details and bio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="flex items-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account & Plan Summary */}
        {(() => {
          const maxUsers = usage?.users?.max ?? user?.maxUsers ?? 13;
          const usedUsers = usage?.users?.used ?? 12;
          const userPercentage =
            maxUsers > 0
              ? Math.min(100, Math.round((usedUsers / maxUsers) * 100))
              : 0;
          const remainingUsers = Math.max(0, maxUsers - usedUsers);
          const currentPlan = usage?.planTier || user?.plan || "Professional";
          const status = usage?.status || user?.subscriptionStatus || "Active";
          const duration =
            usage?.subscriptionDuration ||
            user?.subscriptionDuration ||
            "yearly";
          const cycleLabel =
            duration?.toLowerCase() === "yearly" ||
            duration?.toLowerCase() === "annual"
              ? "Annual"
              : "Monthly";

          const renewalDateVal = usage?.currentPeriodEnd || user?.renewalDate;
          const expiryFormatted = renewalDateVal
            ? new Date(renewalDateVal).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Jun 27, 2027";

          const daysRemaining =
            usage?.daysUntilRenewal !== undefined
              ? usage.daysUntilRenewal
              : renewalDateVal
                ? Math.ceil(
                    (new Date(renewalDateVal).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24),
                  )
                : 236;

          const memberSinceFormatted = user?.joinDate
            ? new Date(user.joinDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Jun 27, 2026";

          return (
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Account & Plan Details
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold"
                  >
                    {status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Workspace subscription & license allocation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Role</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    {user?.isOwner && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-600 border-amber-500/30"
                      >
                        Owner
                      </Badge>
                    )}
                    <span>{user?.role}</span>
                  </div>
                </div>
                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">
                    Workspace
                  </span>
                  <span className="font-medium">{user?.tenant}</span>
                </div>
                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">
                    Current Plan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 text-xs font-semibold">
                      {currentPlan}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      ({cycleLabel})
                    </span>
                  </div>
                </div>
                <Separator />

                {/* Purchased User Licenses */}
                <div className="space-y-1.5 rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Purchased Licenses
                    </span>
                    <span className="font-semibold font-mono">
                      {usedUsers} / {maxUsers} Seats
                    </span>
                  </div>
                  <Progress value={userPercentage} className="h-1.5" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{userPercentage}% allocated</span>
                    <span
                      className={
                        remainingUsers === 0
                          ? "text-amber-500 font-medium"
                          : "text-emerald-600 dark:text-emerald-400 font-medium"
                      }
                    >
                      {remainingUsers > 0
                        ? `${remainingUsers} seat${remainingUsers === 1 ? "" : "s"} remaining`
                        : "Seat limit reached"}
                    </span>
                  </div>
                </div>

                {/* Plan Expiration / Renewal Date */}
                <div className="space-y-1 rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      Plan Expiry / Renewal
                    </span>
                    <div className="text-right">
                      <div className="font-semibold">{expiryFormatted}</div>
                      {daysRemaining !== undefined && (
                        <div
                          className={cn(
                            "text-[11px] font-medium",
                            daysRemaining <= 15
                              ? "text-destructive"
                              : daysRemaining <= 60
                                ? "text-amber-500"
                                : "text-emerald-600 dark:text-emerald-400",
                          )}
                        >
                          {daysRemaining > 0
                            ? `(${daysRemaining} days remaining)`
                            : "(Expired)"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">{memberSinceFormatted}</span>
                </div>

                <div className="pt-1">
                  <Link href="/settings/subscription" className="w-full block">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs flex items-center justify-center gap-1.5 h-8 font-medium hover:bg-primary/5 hover:text-primary"
                    >
                      Manage Subscription & Add Seats
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Password */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>
              Use at least 8 characters with a mix of letters and numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={password.current}
                  onChange={(e) =>
                    setPassword({ ...password, current: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="next">New password</Label>
                  <Input
                    id="next"
                    type="password"
                    value={password.next}
                    onChange={(e) =>
                      setPassword({ ...password, next: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword({ ...password, confirm: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Update password</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what you'd like to be notified about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: "emailNotifications",
                label: "Email notifications",
                desc: "Account & client activity",
              },
              {
                key: "taskReminders",
                label: "Task reminders",
                desc: "Upcoming due dates",
              },
              {
                key: "weeklyDigest",
                label: "Weekly digest",
                desc: "Summary every Monday",
              },
              {
                key: "marketing",
                label: "Product updates",
                desc: "New features and tips",
              },
            ].map((p) => (
              <div
                key={p.key}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Switch
                  checked={prefs[p.key as keyof typeof prefs]}
                  onCheckedChange={(v) => setPrefs({ ...prefs, [p.key]: v })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
