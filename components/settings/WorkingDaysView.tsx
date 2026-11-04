"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Check,
  Clock,
  CalendarDays,
  ShieldCheck,
  Wifi,
  MapPin,
  Plus,
  Trash2,
  Crosshair,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetWorkingDaysQuery,
  useUpdateWorkingDaysMutation,
  useGetMyIpQuery,
} from "@/lib/services/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackButton } from "@/components/shared/BackButton";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const ALL_WEEKS = [
  { num: 1, label: "1st Week" },
  { num: 2, label: "2nd Week" },
  { num: 3, label: "3rd Week" },
  { num: 4, label: "4th Week" },
  { num: 5, label: "5th Week" },
];

export interface WorkingDaysViewProps {
  onBack?: () => void;
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
}

export function WorkingDaysView({
  onBack,
  backHref,
  backLabel = "Back to Settings",
  showBack,
}: WorkingDaysViewProps = {}) {
  const { data: config, isLoading } = useGetWorkingDaysQuery();
  const [updateWorkingDays, { isLoading: isSaving }] =
    useUpdateWorkingDaysMutation();
  const { refetch: refetchMyIp } = useGetMyIpQuery();

  const [weekends, setWeekends] = useState<string[]>(["Sunday"]);
  const [standardHours, setStandardHours] = useState<number>(8);
  const [enableAlternate, setEnableAlternate] = useState<boolean>(false);
  const [alternateDay, setAlternateDay] = useState<string>("Saturday");
  const [alternateWeeks, setAlternateWeeks] = useState<number[]>([2, 4]);

  // Office Perimeter & Wi-Fi IP Whitelist state
  const [enableIpWhitelist, setEnableIpWhitelist] = useState<boolean>(false);
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIpInput, setNewIpInput] = useState<string>("");
  const [enforceGeofence, setEnforceGeofence] = useState<boolean>(false);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [geofenceRadius, setGeofenceRadius] = useState<number>(150);
  const [isDetectingIp, setIsDetectingIp] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      if (Array.isArray(config.weekends)) {
        setWeekends(config.weekends);
      }
      if (typeof config.standardWorkHoursPerDay === "number") {
        setStandardHours(config.standardWorkHoursPerDay);
      }
      if (
        config.alternateWeekendRules &&
        config.alternateWeekendRules.weeks?.length > 0
      ) {
        setEnableAlternate(true);
        setAlternateDay(config.alternateWeekendRules.day || "Saturday");
        setAlternateWeeks(config.alternateWeekendRules.weeks || [2, 4]);
      } else {
        setEnableAlternate(false);
      }

      if (config.officePerimeter) {
        setEnableIpWhitelist(Boolean(config.officePerimeter.enableIpWhitelist));
        setIpWhitelist(
          Array.isArray(config.officePerimeter.ipWhitelist)
            ? config.officePerimeter.ipWhitelist
            : [],
        );
        setEnforceGeofence(Boolean(config.officePerimeter.enforceGeofence));
        setLatitude(
          config.officePerimeter.latitude !== undefined &&
            config.officePerimeter.latitude !== null
            ? String(config.officePerimeter.latitude)
            : "",
        );
        setLongitude(
          config.officePerimeter.longitude !== undefined &&
            config.officePerimeter.longitude !== null
            ? String(config.officePerimeter.longitude)
            : "",
        );
        setGeofenceRadius(config.officePerimeter.geofenceRadiusMeters || 150);
      }
    }
  }, [config]);

  const toggleWeekendDay = (day: string) => {
    if (weekends.includes(day)) {
      if (weekends.length === 1) {
        toast.error("At least one weekend/rest day must be configured");
        return;
      }
      setWeekends(weekends.filter((d) => d !== day));
    } else {
      setWeekends([...weekends, day]);
    }
  };

  const toggleAlternateWeek = (weekNum: number) => {
    if (alternateWeeks.includes(weekNum)) {
      setAlternateWeeks(alternateWeeks.filter((w) => w !== weekNum));
    } else {
      setAlternateWeeks([...alternateWeeks, weekNum].sort((a, b) => a - b));
    }
  };

  const handleAddIp = (ipToAdd?: string) => {
    const target = (ipToAdd || newIpInput).trim();
    if (!target) return;
    if (ipWhitelist.includes(target)) {
      toast.error("This IP address or CIDR range is already whitelisted");
      return;
    }
    setIpWhitelist([...ipWhitelist, target]);
    if (!ipToAdd) setNewIpInput("");
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setIpWhitelist(ipWhitelist.filter((ip) => ip !== ipToRemove));
  };

  const handleDetectMyIp = async () => {
    setIsDetectingIp(true);
    try {
      const res = await refetchMyIp();
      const detected = res.data?.normalizedIp || res.data?.ip;
      if (detected) {
        handleAddIp(detected);
        toast.success(`Detected public IP: ${detected} added to whitelist`);
      } else {
        toast.error("Could not detect public IP address");
      }
    } catch {
      toast.error("Failed to detect IP address");
    } finally {
      setIsDetectingIp(false);
    }
  };

  const handleDetectGps = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        toast.success(
          "Office GPS coordinates captured from current device location",
        );
        setIsDetectingGps(false);
      },
      (err) => {
        toast.error(err.message || "Failed to retrieve GPS location");
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = async () => {
    if (standardHours <= 0 || standardHours > 24) {
      toast.error("Standard work hours per day must be between 1 and 24 hours");
      return;
    }

    if (enforceGeofence) {
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      if (
        isNaN(latNum) ||
        isNaN(lngNum) ||
        latitude.trim() === "" ||
        longitude.trim() === ""
      ) {
        toast.error(
          "Please provide valid office latitude and longitude or use GPS auto-detect",
        );
        return;
      }
    }

    const payload: any = {
      weekends,
      standardWorkHoursPerDay: Number(standardHours),
      officePerimeter: {
        enableIpWhitelist,
        ipWhitelist,
        enforceGeofence,
        latitude: latitude.trim() !== "" ? parseFloat(latitude) : null,
        longitude: longitude.trim() !== "" ? parseFloat(longitude) : null,
        geofenceRadiusMeters: Number(geofenceRadius) || 150,
      },
    };

    if (enableAlternate && alternateWeeks.length > 0) {
      payload.alternateWeekendRules = {
        day: alternateDay,
        weeks: alternateWeeks,
      };
    } else {
      payload.alternateWeekendRules = {
        day: alternateDay,
        weeks: [],
      };
    }

    try {
      await updateWorkingDays(payload).unwrap();
      toast.success(
        "Working days & office perimeter configuration updated successfully",
      );
    } catch (err: any) {
      toast.error(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to update configuration",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading working days settings...
      </div>
    );
  }

  const shouldShowBack = showBack === true;

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {shouldShowBack && (
        <BackButton href={backHref} onClick={onBack} label={backLabel} />
      )}

      {/* Header with Title and Quick Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">
              Working Days & Office Perimeter
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-primary/5 text-primary border-primary/20"
            >
              Attendance Rules
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure standard shift hours, weekly rest days, alternate weekend
            rosters, and dual-mode perimeter security.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 shrink-0 shadow-sm"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span>Save Configuration</span>
        </Button>
      </div>

      {/* BENTO GRID CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── BENTO ITEM 1: Standard Daily Work Hours (4 Cols) ─── */}
        <Card className="lg:col-span-4 flex flex-col justify-between border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Shift Duration</CardTitle>
                  <CardDescription className="text-xs">
                    Target full-day hours
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {standardHours}h / day
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Quick Presets
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[7.5, 8.0, 8.5, 9.0].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setStandardHours(hrs)}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium border transition-colors ${
                      standardHours === hrs
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div className="space-y-1.5">
              <Label htmlFor="standard-hours" className="text-xs">
                Custom Duration (Hours)
              </Label>
              <div className="relative">
                <Input
                  id="standard-hours"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={standardHours}
                  onChange={(e) =>
                    setStandardHours(parseFloat(e.target.value) || 0)
                  }
                  className="pr-16 text-sm font-semibold"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  hours / day
                </span>
              </div>
            </div>

            {/* Threshold Breakdown Card */}
            <div className="rounded-lg bg-muted/40 p-3 border space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Half-Day Mark:</span>
                <span className="font-mono font-medium text-foreground">
                  &lt; {(standardHours / 2).toFixed(1)}h
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Overtime Eligible:</span>
                <span className="font-mono font-medium text-foreground">
                  &gt; {standardHours}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── BENTO ITEM 2: Weekly Rest Days / Weekends (8 Cols) ─── */}
        <Card className="lg:col-span-8 flex flex-col justify-between border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    Weekly Rest Days (Weekends)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Firm-wide non-working days automatically excluded from
                    targets
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {weekends.length} {weekends.length === 1 ? "day" : "days"} /
                week
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground text-xs">Shortcuts:</span>
              <button
                type="button"
                onClick={() => setWeekends(["Sunday"])}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                  weekends.length === 1 && weekends.includes("Sunday")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                }`}
              >
                Sunday Only (6-Day)
              </button>
              <button
                type="button"
                onClick={() => setWeekends(["Saturday", "Sunday"])}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                  weekends.length === 2 &&
                  weekends.includes("Saturday") &&
                  weekends.includes("Sunday")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                }`}
              >
                Saturday & Sunday (5-Day)
              </button>
              <button
                type="button"
                onClick={() => setWeekends(["Friday", "Saturday"])}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                  weekends.length === 2 &&
                  weekends.includes("Friday") &&
                  weekends.includes("Saturday")
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 hover:bg-muted text-foreground border-border/60"
                }`}
              >
                Friday & Saturday
              </button>
            </div>

            {/* Day Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = weekends.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekendDay(day)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold ring-1 ring-primary"
                        : "border-border bg-card text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-xs">{day.slice(0, 3)}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">
                      {isSelected ? "Off" : "Work"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Days Summary Pill */}
            <div className="rounded-lg bg-muted/40 p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                Designated weekly off-days:{" "}
                <strong className="text-foreground">
                  {weekends.join(", ")}
                </strong>
              </span>
              <span className="text-primary font-medium">
                {7 - weekends.length} scheduled working days/week
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ─── BENTO ITEM 3: Rotational / Alternate Weekend Rules (12 Cols) ─── */}
        <Card
          className={`lg:col-span-12 border shadow-sm transition-all ${enableAlternate ? "border-primary/40 bg-card" : "bg-card/60"}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Rotational / Alternate Weekend Rules</span>
                    {enableAlternate ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground border-border/60"
                      >
                        Disabled
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roster specific weeks of the month as off-days (e.g. Bank /
                    Corporate 2nd & 4th Saturday off).
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={enableAlternate}
                onCheckedChange={setEnableAlternate}
                aria-label="Toggle alternate weekend rules"
              />
            </div>
          </CardHeader>

          {enableAlternate && (
            <CardContent className="space-y-4 pt-2 border-t">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Rotational Day Selector */}
                <div className="md:col-span-4 space-y-1.5">
                  <Label
                    htmlFor="alternate-day"
                    className="text-xs font-medium"
                  >
                    Rotational Day of Week
                  </Label>
                  <Select value={alternateDay} onValueChange={setAlternateDay}>
                    <SelectTrigger id="alternate-day" className="h-9 text-xs">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Usually set to Saturday for alternate work-weeks.
                  </p>
                </div>

                {/* Designated Off-Weeks */}
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">
                      Designated Off-Weeks in Month
                    </Label>
                    <button
                      type="button"
                      onClick={() => setAlternateWeeks([2, 4])}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Quick: Standard 2nd & 4th
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ALL_WEEKS.map(({ num, label }) => {
                      const isSelected = alternateWeeks.includes(num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => toggleAlternateWeek(num)}
                          className={`p-2 rounded-md border text-xs font-medium transition-all text-center ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border bg-card hover:bg-muted text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live Preview Ribbon */}
              <div className="text-xs bg-muted/40 p-3 rounded-lg border flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  <strong>Effective Rule:</strong> Every month,{" "}
                  <span className="font-semibold text-foreground">
                    {alternateDay}
                  </span>{" "}
                  on{" "}
                  <span className="font-semibold text-foreground">
                    {alternateWeeks.length > 0
                      ? alternateWeeks
                          .map(
                            (w) =>
                              `${w}${w === 1 ? "st" : w === 2 ? "nd" : w === 3 ? "rd" : "th"}`,
                          )
                          .join(" & ") + " week"
                      : "no weeks selected"}
                  </span>{" "}
                  is treated as an official non-working weekend.
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                  Applied in Payroll Matrix
                </span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ─── BENTO ITEM 4: Dual-Mode Office Perimeter (12 Cols) ─── */}
        <Card
          className={`lg:col-span-12 border shadow-sm transition-all ${enableIpWhitelist || enforceGeofence ? "border-primary/40 bg-card" : "bg-card/60"}`}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Wifi className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>Dual-Mode Office Perimeter</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                    >
                      Security & Geofence
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Allow staff on office Wi-Fi to punch instantly without GPS
                    prompts, while enforcing GPS geofence for remote/cellular
                    connections.
                  </CardDescription>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    enableIpWhitelist
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : "text-muted-foreground border-border/60"
                  }`}
                >
                  Wi-Fi IP: {enableIpWhitelist ? "Active" : "Off"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    enforceGeofence
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      : "text-muted-foreground border-border/60"
                  }`}
                >
                  GPS: {enforceGeofence ? "Active" : "Off"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-2 border-t">
            {/* INNER TWO-PANEL BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* SUB-PANEL A: Wi-Fi / IP Whitelist */}
              <div
                className={`rounded-xl border p-4 space-y-3.5 transition-all ${enableIpWhitelist ? "bg-card border-border shadow-xs" : "bg-muted/20 border-dashed"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold">
                        Office Wi-Fi / Static IP Whitelist
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Punches from matching IPs bypass browser GPS prompts.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enableIpWhitelist}
                    onCheckedChange={setEnableIpWhitelist}
                    aria-label="Toggle office IP whitelist"
                  />
                </div>

                {enableIpWhitelist && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="e.g. 203.0.113.10 or 198.51.100.0/24"
                        value={newIpInput}
                        onChange={(e) => setNewIpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddIp();
                          }
                        }}
                        className="text-xs h-9 flex-1 font-mono"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddIp()}
                          disabled={!newIpInput.trim()}
                          className="h-9 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add IP
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDetectMyIp}
                          disabled={isDetectingIp}
                          className="h-9 text-xs"
                        >
                          {isDetectingIp ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Crosshair className="h-3.5 w-3.5 mr-1 text-primary" />
                          )}
                          Detect IP
                        </Button>
                      </div>
                    </div>

                    {/* Whitelisted IPs */}
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground">
                        Whitelisted IP / CIDR Ranges ({ipWhitelist.length})
                      </Label>
                      {ipWhitelist.length === 0 ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50">
                          No IPs added yet. Click &quot;Detect IP&quot; to
                          auto-whitelist your current office public address.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                          {ipWhitelist.map((ip) => (
                            <Badge
                              key={ip}
                              variant="secondary"
                              className="flex items-center gap-1.5 py-1 px-2 font-mono text-[11px]"
                            >
                              <span>{ip}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIp(ip)}
                                className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                aria-label={`Remove IP ${ip}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SUB-PANEL B: GPS Geofence Fallback */}
              <div
                className={`rounded-xl border p-4 space-y-3.5 transition-all ${enforceGeofence ? "bg-card border-border shadow-xs" : "bg-muted/20 border-dashed"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold">
                        Office GPS Geofence Boundary
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Fallback coordinate radius check for cellular/remote
                        staff.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enforceGeofence}
                    onCheckedChange={setEnforceGeofence}
                    aria-label="Toggle office GPS geofence"
                  />
                </div>

                {enforceGeofence && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="office-lat" className="text-[11px]">
                          Latitude
                        </Label>
                        <Input
                          id="office-lat"
                          type="number"
                          step="any"
                          placeholder="e.g. 12.9716"
                          value={latitude}
                          onChange={(e) => setLatitude(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="office-lng" className="text-[11px]">
                          Longitude
                        </Label>
                        <Input
                          id="office-lng"
                          type="number"
                          step="any"
                          placeholder="e.g. 77.5946"
                          value={longitude}
                          onChange={(e) => setLongitude(e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="office-radius" className="text-[11px]">
                          Radius (m)
                        </Label>
                        <Input
                          id="office-radius"
                          type="number"
                          min="10"
                          max="5000"
                          step="10"
                          value={geofenceRadius}
                          onChange={(e) =>
                            setGeofenceRadius(
                              parseInt(e.target.value, 10) || 150,
                            )
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDetectGps}
                        disabled={isDetectingGps}
                        className="text-xs h-8"
                      >
                        {isDetectingGps ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Crosshair className="h-3 w-3 mr-1.5 text-primary" />
                        )}
                        Use Current GPS
                      </Button>
                      <span className="text-[11px] text-muted-foreground">
                        Permitted boundary: <strong>{geofenceRadius}m</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PRECEDENCE RIBBON */}
            <div className="rounded-lg bg-muted/40 p-3.5 border flex items-start gap-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Dual-Mode Verification Precedence:
                </span>
                <p>
                  1. If staff is on the whitelisted office Wi-Fi/IP, punches
                  succeed immediately without GPS coordinate prompts.
                  <br />
                  2. If staff is on mobile data or working remotely, the system
                  checks their browser GPS location against the office geofence.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FOOTER SAVE BAR */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        <div className="text-xs text-muted-foreground hidden sm:block">
          Changes will apply immediately to next attendance punches and monthly
          matrix calculations.
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="default"
            className="gap-2 px-6 shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>Save Working Days Configuration</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
