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
  useSubscribeClientToPackageMutation,
  useGetPackagesQuery,
} from "@/lib/services/api";

const formSchema = z.object({
  packageId: z.string().min(1, "Package is required"),
  customPrice: z.coerce.number().optional(),
});

export function SubscribePackageDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [subscribeToPackage, { isLoading }] =
    useSubscribeClientToPackageMutation();
  const { data: response, isLoading: isLoadingPackages } =
    useGetPackagesQuery(undefined);
  const packages = Array.isArray(response) ? response : [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      packageId: "",
      customPrice: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await subscribeToPackage({ clientId, ...values }).unwrap();
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to subscribe to package:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ Subscribe Package</Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Subscribe to Package</DialogTitle>
          <DialogDescription>
            Assign a commercial package to this client. This will auto-subscribe
            them to the underlying services.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPackages ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        packages.map((pkg: any) => (
                          <SelectItem key={pkg._id} value={pkg._id}>
                            {pkg.name} (₹{pkg.defaultBillingAmount})
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
                      placeholder="Leave blank to use default package price"
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
