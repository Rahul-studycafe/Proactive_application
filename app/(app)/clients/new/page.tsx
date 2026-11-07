"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  X,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Tag,
  Users as UsersIcon,
  Loader2,
  Check,
  Layers,
  Search,
  ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUploadClientPhotoMutation,
  useGetUsersQuery,
  useGetServicesQuery,
} from "@/lib/services/api";
import { type Client } from "@/lib/types";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlanLimitModal } from "@/components/shared/PlanLimitModal";
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
const groups = [
  "Sharma Family",
  "Patil Consultancy",
  "Mehta Group",
  "Joshi Holdings",
];
const tagOptions = [
  "VIP",
  "GST",
  "Income Tax",
  "ROC",
  "Audit",
  "Payroll",
  "Retainer",
];
const states = [
  "Maharashtra",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Delhi",
  "Rajasthan",
  "West Bengal",
  "Telangana",
  "Uttar Pradesh",
];

function NewClientPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  // API Hooks
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [uploadPhotoMutation, { isLoading: isUploadingPhoto }] =
    useUploadClientPhotoMutation();

  const { data: usersRes } = useGetUsersQuery(undefined);
  const users = usersRes?.users || [];

  const { data: clientsRes } = useGetClientsQuery(undefined);
  const clients = clientsRes?.clients || [];

  const { data: svcResponse, isLoading: isLoadingServices } =
    useGetServicesQuery(undefined);
  const services: any[] = Array.isArray(svcResponse)
    ? svcResponse
    : svcResponse?.data || [];

  // Services subscription
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  // Quota enforcement
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Basic
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Client info
  const [name, setName] = useState("");
  const [clientNumber, setClientNumber] = useState("");
  const [clientType, setClientType] = useState("");
  const [group, setGroup] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");

  // Billing
  const [billTo, setBillTo] = useState("self");

  // Contact person
  const [contactName, setContactName] = useState("");
  const [dob, setDob] = useState("");

  // Users & classification
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Contact details
  const [mobile, setMobile] = useState("");
  const [mobile2, setMobile2] = useState("");
  const [email, setEmail] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [stateVal, setStateVal] = useState("");

  // Financial
  const [openingBalance, setOpeningBalance] = useState("");

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (val.length > 10) val = val.slice(0, 10);

    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (i < 5) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else if (i < 9) {
        if (/[0-9]/.test(char)) formatted += char;
        else break;
      } else if (i === 9) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      }
    }
    setPan(formatted);
    // Clear error immediately if it becomes valid while typing
    if (formatted.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formatted)) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e.pan;
        return e;
      });
    }
  };

  const handlePanBlur = () => {
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      setErrors((prev) => ({
        ...prev,
        pan: "Incomplete or invalid PAN format",
      }));
    }
  };

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (val.length > 15) val = val.slice(0, 15);

    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      const char = val[i];
      if (i < 2) {
        if (/[0-9]/.test(char)) formatted += char;
        else break;
      } else if (i < 7) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else if (i < 11) {
        if (/[0-9]/.test(char)) formatted += char;
        else break;
      } else if (i === 11) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else if (i === 12) {
        if (/[A-Z0-9]/.test(char)) formatted += char;
        else break;
      } else if (i === 13) {
        if (/[A-Z]/.test(char)) formatted += char;
        else break;
      } else if (i === 14) {
        if (/[A-Z0-9]/.test(char)) formatted += char;
        else break;
      }
    }
    setGstin(formatted);
    // Clear error immediately if it becomes valid while typing
    if (
      formatted.length === 15 &&
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][A-Z][A-Z0-9]$/.test(formatted)
    ) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e.gstin;
        return e;
      });
    }
  };

  const handleGstinBlur = () => {
    if (
      gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][A-Z][A-Z0-9]$/.test(gstin)
    ) {
      setErrors((prev) => ({
        ...prev,
        gstin: "Incomplete or invalid GSTIN format",
      }));
    }
  };

  const handleMobileChange =
    (setter: React.Dispatch<React.SetStateAction<string>>, fieldName: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, "");
      if (val.length > 10) val = val.slice(0, 10);
      setter(val);

      if (val.length === 10) {
        setErrors((prev) => {
          const err = { ...prev };
          delete err[fieldName];
          return err;
        });
      }
    };

  const handleMobileBlur = (val: string, fieldName: string) => () => {
    if (val && val.length !== 10) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "Must be exactly 10 digits",
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setErrors((prev) => {
        const err = { ...prev };
        delete err.email;
        return err;
      });
    }
  };

  const handleEmailBlur = () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 6) val = val.slice(0, 6);
    setPincode(val);

    if (val.length === 6) {
      setErrors((prev) => {
        const err = { ...prev };
        delete err.pincode;
        return err;
      });
    }
  };

  const handlePincodeBlur = () => {
    if (pincode && pincode.length !== 6) {
      setErrors((prev) => ({
        ...prev,
        pincode: "Pincode must be exactly 6 digits",
      }));
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Max image size is 5MB");
      return;
    }

    // Preview locally
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);

    // Upload to server
    try {
      const formData = new FormData();
      formData.append("photo", f);
      const res = await uploadPhotoMutation(formData).unwrap();
      if (res.photoUrl) {
        setPhotoUrl(res.photoUrl);
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Failed to upload photo");
    }
  };

  const toggleUser = (id: string) => {
    setAssignedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleTag = (t: string) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllServices = () => {
    setSelectedServices(services.map((s: any) => s._id));
  };

  const clearAllServices = () => {
    setSelectedServices([]);
  };

  const filteredServices = services.filter((s: any) =>
    s.name?.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const checkIsValid = () => {
    if (!name.trim()) return false;
    if (!clientType) return false;
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return false;
    if (
      gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][A-Z][A-Z0-9]$/.test(gstin)
    )
      return false;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (mobile && mobile.length !== 10) return false;
    if (mobile2 && mobile2.length !== 10) return false;
    if (pincode && !/^[0-9]{6}$/.test(pincode)) return false;
    return true;
  };

  const isValid = checkIsValid();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Client name is required";
    if (!clientType) e.clientType = "Client type is required";
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan))
      e.pan = "Invalid PAN format";
    if (
      gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][A-Z][A-Z0-9]$/.test(gstin)
    )
      e.gstin = "Invalid GSTIN format";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Invalid email";
    if (mobile && mobile.length !== 10) e.mobile = "Must be 10 digits";
    if (mobile2 && mobile2.length !== 10)
      e.secondaryMobile = "Must be 10 digits";
    if (pincode && !/^[0-9]{6}$/.test(pincode))
      e.pincode = "Pincode must be 6 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      // scroll to top of main content to see errors if needed
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      await createClient({
        name: name.trim(),
        isActive,
        clientNumber: clientNumber || undefined,
        fileNo: clientNumber || undefined,
        entityType: clientType,
        pan: pan || undefined,
        gstin: gstin || undefined,
        billingProfileId: billTo && billTo !== "self" ? billTo : undefined,
        contactPersonName: contactName || undefined,
        dateOfBirth: dob ? new Date(dob).toISOString() : undefined,
        assignedUsers: assignedUsers.length > 0 ? assignedUsers : undefined,
        tags: tags.length > 0 ? tags : undefined,
        mobile: mobile || undefined,
        secondaryMobile: mobile2 || undefined,
        email: email || undefined,
        address: address || undefined,
        city: city || undefined,
        state: stateVal || undefined,
        pincode: pincode || undefined,
        openingBalance: openingBalance ? Number(openingBalance) : 0,
        photoUrl: photoUrl || undefined,
        subscribedServices:
          selectedServices.length > 0
            ? selectedServices.map((id) => ({ serviceId: id }))
            : undefined,
      }).unwrap();

      toast.success(`Client "${name}" created successfully`);
      router.push("/clients");
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "";
      if (
        error?.status === 403 &&
        (msg.toLowerCase().includes("limit reached") ||
          msg.toLowerCase().includes("quota"))
      ) {
        setShowQuotaModal(true);
      } else {
        toast.error(msg || "Failed to create client");
      }
    }
  };

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C";

  return (
    <div className="w-full pb-10">
      <form onSubmit={onSubmit} className="space-y-6 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Clients", href: "/clients" },
            { label: "Add Client" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add Client</h1>
            <p className="text-sm text-muted-foreground">
              Create a new client profile and configure their settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/clients">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isCreating || isUploadingPhoto}
              className="gap-2"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Client
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
          {/* LEFT COLUMN: Main Form */}
          <div className="xl:col-span-3 space-y-8">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Client
                  Information
                </CardTitle>
                <CardDescription>
                  Primary details and identification.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Client Name" required error={errors.name}>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Industries Pvt Ltd"
                  />
                </Field>
                <Field label="Client Number">
                  <Input
                    value={clientNumber}
                    onChange={(e) => setClientNumber(e.target.value)}
                    placeholder="e.g. C1234"
                  />
                </Field>
                <Field label="Client Type" required error={errors.clientType}>
                  <Select value={clientType} onValueChange={setClientType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Group">
                  <Select value={group} onValueChange={setGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="PAN Number" error={errors.pan}>
                  <Input
                    value={pan}
                    onChange={handlePanChange}
                    onBlur={handlePanBlur}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className={
                      errors.pan
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                </Field>
                <Field label="GSTIN" error={errors.gstin}>
                  <Input
                    value={gstin}
                    onChange={handleGstinChange}
                    onBlur={handleGstinBlur}
                    maxLength={15}
                    placeholder="22ABCDE1234F1Z5"
                    className={
                      errors.gstin
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" /> Contact Details
                </CardTitle>
                <CardDescription>How to reach this client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Mobile Number" error={errors.mobile}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        +91
                      </span>
                      <Input
                        value={mobile}
                        onChange={handleMobileChange(setMobile, "mobile")}
                        onBlur={handleMobileBlur(mobile, "mobile")}
                        maxLength={10}
                        placeholder="9876543210"
                        className={`pl-10 ${errors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>
                  <Field
                    label="Secondary Mobile"
                    error={errors.secondaryMobile}
                  >
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                        +91
                      </span>
                      <Input
                        value={mobile2}
                        onChange={handleMobileChange(
                          setMobile2,
                          "secondaryMobile",
                        )}
                        onBlur={handleMobileBlur(mobile2, "secondaryMobile")}
                        maxLength={10}
                        placeholder="Optional"
                        className={`pl-10 ${errors.secondaryMobile ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                  </Field>
                </div>
                <Separator />
                <Field label="Email Address" error={errors.email}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      placeholder="client@example.com"
                      className={`pl-9 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                  </div>
                </Field>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Address
                  Information
                </CardTitle>
                <CardDescription>Primary registered address.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Field label="Address">
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, building, area"
                      rows={3}
                      className="resize-none"
                    />
                  </Field>
                </div>
                <Field label="City">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                  />
                </Field>
                <Field label="Pincode" error={errors.pincode}>
                  <Input
                    value={pincode}
                    onChange={handlePincodeChange}
                    onBlur={handlePincodeBlur}
                    maxLength={6}
                    placeholder="6-digit pincode"
                    className={
                      errors.pincode
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="State">
                    <Select value={stateVal} onValueChange={setStateVal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Financial
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Field
                  label="Opening Balance (₹)"
                  hint="Positive: client owes you. Negative: you owe client."
                >
                  <div className="relative max-w-sm">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </Field>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Sidebar */}
          <div className="space-y-8 xl:col-span-2">
            {/* Status & Photo */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    {photo ? (
                      <img
                        src={photo}
                        alt="profile"
                        className="h-28 w-28 rounded-full object-cover ring-4 ring-muted"
                      />
                    ) : (
                      <div className="grid h-28 w-28 place-content-center rounded-full bg-primary/10 text-primary text-3xl font-semibold ring-4 ring-muted">
                        {initials}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-0 right-0 grid h-9 w-9 place-content-center rounded-full border bg-background text-foreground shadow-md hover:bg-accent disabled:opacity-50 transition-colors"
                      aria-label="Upload photo"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>

                    {photo && !isUploadingPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoUrl("");
                        }}
                        className="absolute top-0 right-0 grid h-7 w-7 place-content-center rounded-full border bg-background text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhoto}
                    />
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-medium text-lg">
                      {name || "New Client"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Upload profile picture
                    </p>
                  </div>

                  <Separator className="w-full" />

                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        Active Status
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Mark client as active.
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Subscription */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> Services
                  </CardTitle>
                  {selectedServices.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {selectedServices.length} selected
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Directly subscribe client to practice services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Popover open={isServicesOpen} onOpenChange={setIsServicesOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted/40 transition-colors cursor-pointer text-left"
                    >
                      <span className="truncate">
                        {selectedServices.length === 0
                          ? "Select services to subscribe..."
                          : `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 p-0 shadow-lg border-border"
                    align="start"
                  >
                    <div className="flex items-center border-b px-3 py-2">
                      <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services..."
                        className="flex h-7 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                      {serviceSearch && (
                        <button
                          type="button"
                          onClick={() => setServiceSearch("")}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {services.length > 0 && (
                      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground">
                        <span>{services.length} services available</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={selectAllServices}
                            className="text-primary hover:underline font-medium text-xs cursor-pointer"
                          >
                            Select all
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={clearAllServices}
                            className="hover:underline text-xs cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="max-h-60 overflow-y-auto p-1 divide-y divide-border/40">
                      {isLoadingServices ? (
                        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                          Loading services...
                        </div>
                      ) : filteredServices.length === 0 ? (
                        <div className="py-6 text-center text-xs text-muted-foreground">
                          {services.length === 0
                            ? "No services configured yet."
                            : "No matching services found."}
                        </div>
                      ) : (
                        filteredServices.map((svc: any) => {
                          const isChecked = selectedServices.includes(svc._id);
                          return (
                            <div
                              key={svc._id}
                              onClick={() => toggleService(svc._id)}
                              className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                                isChecked ? "bg-accent/60" : "hover:bg-muted/50"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleService(svc._id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium leading-none truncate">
                                  {svc.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                                  <span>
                                    {svc.isRecurring ? "Recurring" : "One-off"}
                                  </span>
                                  {svc.defaultBillingRate ? (
                                    <>
                                      <span>•</span>
                                      <span>
                                        ₹
                                        {svc.defaultBillingRate.toLocaleString()}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {selectedServices.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Subscribed upon creation:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedServices.map((id) => {
                        const svc = services.find((s: any) => s._id === id);
                        if (!svc) return null;
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="flex items-center gap-1 text-xs py-1 px-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                          >
                            <span className="truncate max-w-[180px]">
                              {svc.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleService(id);
                              }}
                              className="rounded-full hover:bg-primary/20 p-0.5 ml-0.5 transition-colors"
                              aria-label={`Remove ${svc.name}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users & Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-primary" /> Assignment &
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Assigned Users</Label>
                  <div className="flex flex-wrap gap-2">
                    {users.map((u: any) => {
                      const active = assignedUsers.includes(u._id);
                      return (
                        <Badge
                          key={u._id}
                          variant={active ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${!active && "hover:bg-muted"}`}
                          onClick={() => toggleUser(u._id)}
                        >
                          {u.name}
                        </Badge>
                      );
                    })}
                  </div>
                  {assignedUsers.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      No users assigned.
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.map((t) => {
                      const active = tags.includes(t);
                      return (
                        <Badge
                          key={t}
                          variant={active ? "secondary" : "outline"}
                          className={`cursor-pointer transition-colors ${!active && "hover:bg-muted"}`}
                          onClick={() => toggleTag(t)}
                        >
                          {t}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" /> Billing Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Field label="Bill To" hint="Who should receive invoices?">
                  <Select value={billTo} onValueChange={setBillTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self (Default)</SelectItem>
                      {clients.map((c: Client) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </CardContent>
            </Card>

            {/* Contact Person */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Contact Person
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Full Name">
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Name"
                  />
                </Field>
                <Field label="Date of Birth">
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </Field>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <PlanLimitModal
        open={showQuotaModal}
        onOpenChange={setShowQuotaModal}
        limitType="clients"
      />
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default withPermission(NewClientPage, "client:create", {
  title: "Client Creation Restricted",
  description:
    "You do not have permission to create new clients. Please contact your Practice Administrator to request 'client:create' permission.",
  backHref: "/clients",
  backLabel: "Return to Clients",
});
