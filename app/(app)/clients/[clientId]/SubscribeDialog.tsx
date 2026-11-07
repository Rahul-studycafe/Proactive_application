"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePermissions } from "@/contexts/PermissionsContext";
import {
  useSubscribeClientToPackageMutation,
  useSubscribeClientToServiceMutation,
  useGetPackagesQuery,
  useGetServicesQuery,
  useGetClientByIdQuery,
} from "@/lib/services/api";

const formSchema = z.object({
  subscriptionId: z.string().min(1, "Selection is required"),
  customPrice: z.coerce.number().optional(),
});

interface SubscribeDialogProps {
  clientId: string;
  client?: any;
  defaultTab?: "package" | "service";
  triggerButton?: React.ReactNode;
}

export function SubscribeDialog({
  clientId,
  client: initialClient,
  defaultTab = "package",
  triggerButton,
}: SubscribeDialogProps) {
  const { can, isSuperAdmin } = usePermissions();
  const canManageServices =
    isSuperAdmin || can("client:services_manage") || can("client:edit");
  const canManagePackages =
    isSuperAdmin || can("client:packages_manage") || can("client:edit");

  const effectiveDefaultTab: "package" | "service" =
    defaultTab === "package"
      ? canManagePackages
        ? "package"
        : "service"
      : canManageServices
        ? "service"
        : "package";

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"package" | "service">(effectiveDefaultTab);

  // If client wasn't passed directly, fetch it
  const { data: fetchedClient } = useGetClientByIdQuery(clientId, {
    skip: !!initialClient,
  });
  const client = initialClient || fetchedClient;

  const [subscribeToPackage, { isLoading: isSubscribingPkg }] =
    useSubscribeClientToPackageMutation();
  const [subscribeToService, { isLoading: isSubscribingSvc }] =
    useSubscribeClientToServiceMutation();

  const { data: pkgResponse, isLoading: isLoadingPackages } =
    useGetPackagesQuery(undefined);
  const packages = Array.isArray(pkgResponse) ? pkgResponse : [];

  const { data: svcResponse, isLoading: isLoadingServices } =
    useGetServicesQuery(undefined);
  const services = Array.isArray(svcResponse) ? svcResponse : [];

  const isLoading = isSubscribingPkg || isSubscribingSvc;

  const isPackageSubscribed = (pkgId: string) => {
    return client?.subscribedPackages?.some(
      (p: any) =>
        ((p.packageId as any)?._id || p.packageId || p._id)?.toString() ===
        pkgId?.toString(),
    );
  };

  const isServiceSubscribed = (svcId: string) => {
    return client?.subscribedServices?.some(
      (s: any) =>
        ((s.serviceId as any)?._id || s.serviceId || s._id)?.toString() ===
        svcId?.toString(),
    );
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subscriptionId: "",
      customPrice: undefined,
    },
  });

  // Reset form when tab changes
  const handleTabChange = (val: string) => {
    setTab(val as "package" | "service");
    form.reset({ subscriptionId: "", customPrice: undefined });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTab(effectiveDefaultTab);
      form.reset({ subscriptionId: "", customPrice: undefined });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const parsedCustomPrice =
        values.customPrice !== undefined && !isNaN(values.customPrice)
          ? values.customPrice
          : undefined;

      if (tab === "package") {
        await subscribeToPackage({
          clientId,
          packageId: values.subscriptionId,
          customPrice: parsedCustomPrice,
        }).unwrap();
        toast.success("Successfully subscribed to package");
      } else {
        await subscribeToService({
          clientId,
          serviceId: values.subscriptionId,
          customPrice: parsedCustomPrice,
        }).unwrap();
        toast.success("Successfully subscribed to service");
      }
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to subscribe:", error);
      const errorMsg =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to subscribe";
      toast.error(errorMsg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton || <Button size="sm">+ Add Subscription</Button>}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
          <DialogDescription>
            Subscribe this client to a commercial package or an individual
            service.
          </DialogDescription>
        </DialogHeader>

        {canManagePackages && canManageServices && (
          <Tabs value={tab} onValueChange={handleTabChange} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="package">Package</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="subscriptionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tab === "package" ? "Package" : "Service"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            tab === "package"
                              ? "Select a package"
                              : "Select a service"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tab === "package" ? (
                        isLoadingPackages ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : packages.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No packages available
                          </div>
                        ) : (
                          packages.map((pkg: any) => {
                            const isSubscribed = isPackageSubscribed(pkg._id);
                            return (
                              <SelectItem
                                key={pkg._id}
                                value={pkg._id}
                                disabled={isSubscribed}
                                className={
                                  isSubscribed
                                    ? "opacity-60 cursor-not-allowed"
                                    : ""
                                }
                              >
                                <div className="flex items-center justify-between w-full gap-2">
                                  <span>
                                    {pkg.name} (₹
                                    {pkg.defaultBillingAmount?.toLocaleString(
                                      "en-IN",
                                    )}
                                    )
                                  </span>
                                  {isSubscribed && (
                                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0">
                                      Already Subscribed
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        )
                      ) : isLoadingServices ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : services.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          No services available
                        </div>
                      ) : (
                        services.map((svc: any) => {
                          const isSubscribed = isServiceSubscribed(svc._id);
                          return (
                            <SelectItem
                              key={svc._id}
                              value={svc._id}
                              disabled={isSubscribed}
                              className={
                                isSubscribed
                                  ? "opacity-60 cursor-not-allowed"
                                  : ""
                              }
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>
                                  {svc.name} (₹
                                  {svc.defaultBillingRate?.toLocaleString(
                                    "en-IN",
                                  )}
                                  )
                                </span>
                                {isSubscribed && (
                                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 shrink-0">
                                    Already Subscribed
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Price (₹) - Optional</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Leave blank to use default price"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
