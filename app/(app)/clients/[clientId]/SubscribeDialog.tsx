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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSubscribeClientToPackageMutation,
  useSubscribeClientToServiceMutation,
  useGetPackagesQuery,
  useGetServicesQuery,
} from "@/lib/services/api";

const formSchema = z.object({
  subscriptionId: z.string().min(1, "Selection is required"),
  customPrice: z.coerce.number().optional(),
});

export function SubscribeDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"package" | "service">("package");

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (tab === "package") {
        await subscribeToPackage({
          clientId,
          packageId: values.subscriptionId,
          customPrice: values.customPrice,
        }).unwrap();
      } else {
        await subscribeToService({
          clientId,
          serviceId: values.subscriptionId,
          customPrice: values.customPrice,
        }).unwrap();
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to subscribe:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Add Subscription</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
          <DialogDescription>
            Subscribe this client to a commercial package or an individual
            service.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="package">Package</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
          </TabsList>
        </Tabs>

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
                        ) : (
                          packages.map((pkg: any) => (
                            <SelectItem key={pkg._id} value={pkg._id}>
                              {pkg.name} (₹{pkg.defaultBillingAmount})
                            </SelectItem>
                          ))
                        )
                      ) : isLoadingServices ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        services.map((svc: any) => (
                          <SelectItem key={svc._id} value={svc._id}>
                            {svc.name} (₹{svc.defaultBillingRate})
                          </SelectItem>
                        ))
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
