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
import {
  useCreatePackageMutation,
  useGetServicesQuery,
} from "@/lib/services/api";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  frequency: z.enum([
    "monthly",
    "quarterly",
    "half_yearly",
    "yearly",
    "one_time",
  ]),
  defaultBillingAmount: z.coerce.number().min(0),
  sacCode: z.string().optional(),
  gstPercentage: z.coerce.number().min(0),
  serviceIds: z
    .array(z.string())
    .min(1, "At least one service must be selected"),
});

export function CreatePackageDialog({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [createPackage, { isLoading }] = useCreatePackageMutation();
  const { data: response, isLoading: isLoadingServices } =
    useGetServicesQuery(undefined);
  const services = Array.isArray(response) ? response : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      frequency: "monthly",
      defaultBillingAmount: 0,
      sacCode: "",
      gstPercentage: 0,
      serviceIds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createPackage(values).unwrap();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create package:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>+ New Package</Button>}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Package</DialogTitle>
          <DialogDescription>
            Bundle multiple services into a commercial wrapper.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 flex-1 overflow-hidden flex flex-col"
          >
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-4 pr-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Complete Compliance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="half_yearly">
                              Half Yearly
                            </SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                            <SelectItem value="one_time">One Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultBillingAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sacCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SAC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 998231" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST %</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="serviceIds"
                  render={() => (
                    <FormItem>
                      <div className="mb-4 mt-6">
                        <FormLabel className="text-base">
                          Included Services
                        </FormLabel>
                        <DialogDescription>
                          Select the services that will be auto-generated when a
                          client subscribes to this package.
                        </DialogDescription>
                      </div>
                      <div className="grid grid-cols-1 gap-2 border rounded-md p-4 bg-muted/20">
                        {isLoadingServices ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : services.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-2">
                            No services found. Create a service first.
                          </div>
                        ) : (
                          services.map((service: any) => (
                            <FormField
                              key={service._id}
                              control={form.control}
                              name="serviceIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={service._id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(
                                          service._id,
                                        )}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...field.value,
                                                service._id,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) =>
                                                    value !== service._id,
                                                ),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                      {service.name}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <div className="flex justify-end pt-4 border-t mt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Package"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
