"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  useCreatePhysicalDocMutation,
  useUpdatePhysicalDocMutation,
  useGetClientsQuery,
  useGetAvailablePhysicalDocsForMovementQuery,
  useGetStorageLocationsQuery,
} from "@/lib/services/api";
import {
  PhysicalDocument,
  PhysicalDocCategory,
  PhysicalDocType,
} from "@/lib/types/physical-document";
import { DynamicConfigSelect } from "@/components/ui/dynamic-config-select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FolderPlus,
  MapPin,
  Calendar,
  User,
  Phone,
  Check,
  ChevronsUpDown,
  PlusCircle,
  History,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InOutEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docToEdit?: PhysicalDocument | null;
  defaultClientId?: string;
  defaultCategory?: PhysicalDocCategory;
}

const DOCUMENT_TYPES: PhysicalDocType[] = [
  "Passbook",
  "Cheque Book",
  "Original Deeds",
  "PAN Card",
  "Registration Certificate",
  "Company Seal",
  "Other",
];

export function InOutEntryModal({
  open,
  onOpenChange,
  docToEdit,
  defaultClientId,
  defaultCategory = "Received",
}: InOutEntryModalProps) {
  const isEditing = !!docToEdit;

  const { data: clientsRes } = useGetClientsQuery(undefined);
  const clients = clientsRes?.clients || [];

  const [createDoc, { isLoading: isCreating }] = useCreatePhysicalDocMutation();
  const [updateDoc, { isLoading: isUpdating }] = useUpdatePhysicalDocMutation();
  const isSubmitting = isCreating || isUpdating;

  const [clientId, setClientId] = useState("");
  const [category, setCategory] =
    useState<PhysicalDocCategory>(defaultCategory);
  const [date, setDate] = useState("");
  const [documentType, setDocumentType] =
    useState<PhysicalDocType>("Original Deeds");
  const [documentName, setDocumentName] = useState("");
  const [isReturnable, setIsReturnable] = useState(true);
  const [returnDate, setReturnDate] = useState("");
  const [location, setLocation] = useState("");
  const [receivedByPersonName, setReceivedByPersonName] = useState("");
  const [receivedByPhone, setReceivedByPhone] = useState("");
  const [notes, setNotes] = useState("");

  // States for searchable dropdown & document identity linking
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isNewDocMode, setIsNewDocMode] = useState<boolean>(false);
  const [openDocPopover, setOpenDocPopover] = useState<boolean>(false);
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Fetch documents available for movement based on client and transaction category
  const { data: availableDocs = [], isLoading: isLoadingAvailable } =
    useGetAvailablePhysicalDocsForMovementQuery(
      { clientId, category },
      { skip: !clientId || !open || isEditing },
    );

  // Fetch office storage units for quick location selection
  const { data: storageUnits = [] } = useGetStorageLocationsQuery(undefined, {
    skip: !open,
  });

  useEffect(() => {
    if (!open) return;
    if (docToEdit) {
      const cId =
        typeof docToEdit.clientId === "object"
          ? docToEdit.clientId._id
          : docToEdit.clientId;
      setClientId(cId || defaultClientId || "");
      setCategory(docToEdit.category || "Received");
      setDate(
        docToEdit.date
          ? new Date(docToEdit.date).toISOString().split("T")[0]
          : todayStr,
      );
      setDocumentType(docToEdit.documentType || "Original Deeds");
      setDocumentName(docToEdit.documentName || "");
      setIsReturnable(!!docToEdit.isReturnable);
      setReturnDate(
        docToEdit.returnDate
          ? new Date(docToEdit.returnDate).toISOString().split("T")[0]
          : "",
      );
      setLocation(docToEdit.location || "");
      setReceivedByPersonName(docToEdit.receivedByPersonName || "");
      setReceivedByPhone(docToEdit.receivedByPhone || "");
      setNotes(docToEdit.notes || "");
      setSelectedDocId(docToEdit._id);
      setIsNewDocMode(false);
    } else {
      setClientId(defaultClientId || (clients[0]?._id ?? ""));
      setCategory(defaultCategory);
      setDate(todayStr);
      setDocumentType("Original Deeds");
      setDocumentName("");
      setSelectedDocId(null);
      setIsNewDocMode(false);
      setIsReturnable(true);
      // default return date in 14 days
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setReturnDate(d.toISOString().split("T")[0]);
      setLocation("");
      setReceivedByPersonName("");
      setReceivedByPhone("");
      setNotes("");
      setDocSearchQuery("");
    }
  }, [open, docToEdit, defaultClientId, defaultCategory]);

  useEffect(() => {
    if (!clientId && clients.length > 0 && !defaultClientId) {
      setClientId(clients[0]._id);
    }
  }, [clients, clientId, defaultClientId]);

  // When category changes, reset selected document to prevent mismatched movement
  const handleCategoryChange = (newCategory: PhysicalDocCategory) => {
    if (category === newCategory) return;
    setCategory(newCategory);
    if (!isEditing) {
      setSelectedDocId(null);
      setDocumentName("");
      setIsNewDocMode(false);
      setDocSearchQuery("");
    }
  };

  // When client changes, reset selected document
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    if (!isEditing) {
      setSelectedDocId(null);
      setDocumentName("");
      setIsNewDocMode(false);
      setDocSearchQuery("");
    }
  };

  // Check if current typed documentName matches any existing document (duplicate check)
  const duplicateMatch = useMemo(() => {
    if (isEditing || selectedDocId || !documentName.trim()) return null;
    const normalized = documentName.trim().toLowerCase();
    return availableDocs.find(
      (d) => d.documentName.trim().toLowerCase() === normalized,
    );
  }, [isEditing, selectedDocId, documentName, availableDocs]);

  // Select an existing document from the dropdown
  const handleSelectExistingDoc = (doc: PhysicalDocument) => {
    setSelectedDocId(doc._id);
    setDocumentName(doc.documentName);
    setDocumentType(doc.documentType);
    setIsReturnable(Boolean(doc.isReturnable));
    if (doc.returnDate) {
      setReturnDate(new Date(doc.returnDate).toISOString().split("T")[0]);
    }
    if (doc.location) {
      setLocation(doc.location);
    }
    setIsNewDocMode(false);
    setOpenDocPopover(false);
  };

  const handleStartNewDoc = (customName?: string) => {
    setSelectedDocId(null);
    if (customName) {
      setDocumentName(customName.trim());
    }
    setIsNewDocMode(true);
    setOpenDocPopover(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (!documentName.trim() || documentName.trim().length < 2) {
      toast.error("Document name must be at least 2 characters.");
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      toast.error("Please specify the office storage location.");
      return;
    }
    if (isReturnable && !returnDate) {
      toast.error("Please provide expected return date for returnable assets.");
      return;
    }

    // Check duplicate name if in new doc mode
    if (!isEditing && !selectedDocId && duplicateMatch) {
      toast.error(
        `A document named "${duplicateMatch.documentName}" already exists for this client. Please select it from the dropdown.`,
      );
      return;
    }

    try {
      if (isEditing && docToEdit) {
        await updateDoc({
          id: docToEdit._id,
          data: {
            clientId,
            category,
            date: date ? new Date(date).toISOString() : undefined,
            documentType,
            documentName: documentName.trim(),
            isReturnable,
            returnDate:
              isReturnable && returnDate
                ? new Date(returnDate).toISOString()
                : null,
            location: location.trim(),
            receivedByPersonName: receivedByPersonName.trim() || undefined,
            receivedByPhone: receivedByPhone.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        }).unwrap();
        toast.success("Document custody record updated successfully.");
      } else {
        await createDoc({
          documentId: selectedDocId || undefined,
          clientId,
          category,
          date: date ? new Date(date).toISOString() : undefined,
          documentType,
          documentName: documentName.trim(),
          isReturnable,
          returnDate:
            isReturnable && returnDate
              ? new Date(returnDate).toISOString()
              : null,
          location: location.trim(),
          receivedByPersonName: receivedByPersonName.trim() || undefined,
          receivedByPhone: receivedByPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }).unwrap();

        if (selectedDocId) {
          toast.success(
            category === "Received"
              ? "Document received back into office custody and movement recorded."
              : "Document handover recorded successfully and movement history updated.",
          );
        } else {
          toast.success(
            category === "Received"
              ? "New document received into custody and logged."
              : "New document handover recorded successfully.",
          );
        }
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || "Failed to save document record";
      toast.error(msg);
    }
  };

  const selectedDoc = availableDocs.find((d) => d._id === selectedDocId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Edit Custody Document" : "Log Document In / Out"}
              </DialogTitle>
              <DialogDescription>
                Track physical documents, deeds, certificates, and seals moving
                in or out of the office.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Category Toggle */}
          <div className="space-y-1.5">
            <Label>
              Transaction Category <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-category-received"
                onClick={() => handleCategoryChange("Received")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  category === "Received"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                <span>Received from Client</span>
              </button>
              <button
                type="button"
                id="btn-category-given"
                onClick={() => handleCategoryChange("Given")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                  category === "Given"
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
                <span>Given to Client / Third Party</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              {category === "Given"
                ? "Handing over a document currently held in office custody to the client or external party."
                : "Receiving a document back from client or registering a new original document into office custody."}
            </p>
          </div>

          {/* Client & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-client">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={clientId}
                onValueChange={handleClientChange}
                disabled={isEditing || !!defaultClientId}
              >
                <SelectTrigger id="doc-client">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {clients.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} {c.fileNo ? `(${c.fileNo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-date">
                Transaction Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="doc-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Type & Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label htmlFor="doc-type">
                Document Type <span className="text-destructive">*</span>
              </Label>
              <DynamicConfigSelect
                categoryKey="document_types"
                value={documentType}
                onValueChange={(val) => setDocumentType(val as PhysicalDocType)}
                placeholder="Select document type..."
              />
            </div>

            {/* Document Description / Name: Searchable Dropdown or Input */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="doc-name">
                  Document Description / Name{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isNewDocMode) {
                        setIsNewDocMode(false);
                      } else {
                        handleStartNewDoc();
                      }
                    }}
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {isNewDocMode ? (
                      availableDocs.length > 0 ? (
                        "← Choose existing document"
                      ) : (
                        ""
                      )
                    ) : (
                      <>
                        <PlusCircle className="h-3 w-3" />
                        Add New Document
                      </>
                    )}
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Editing existing document directly */
                <Input
                  id="doc-name"
                  placeholder="e.g. Original Sale Deed - Bandra West Commercial Plot"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  required
                />
              ) : isNewDocMode ? (
                /* Mode: Enter a new document name */
                <div className="space-y-2">
                  <Input
                    id="doc-name"
                    placeholder="e.g. Original Sale Deed - Bandra West Commercial Plot"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    autoFocus
                    required
                  />
                  {duplicateMatch ? (
                    <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-2.5 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>
                          A document named{" "}
                          <strong>
                            &quot;{duplicateMatch.documentName}&quot;
                          </strong>{" "}
                          already exists for this client (
                          {duplicateMatch.category === "Received"
                            ? "In Office Custody"
                            : "With Client"}
                          ).
                        </span>
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectExistingDoc(duplicateMatch)
                            }
                            className="font-semibold text-primary underline hover:text-primary/80"
                          >
                            Link to this existing document instead
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Creating a new document record. It will be tracked across
                      future In/Out handovers.
                    </p>
                  )}
                </div>
              ) : (
                /* Mode: Searchable Dropdown displaying previously recorded documents based on current status */
                <div className="space-y-2">
                  <Popover
                    open={openDocPopover}
                    onOpenChange={setOpenDocPopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="doc-name-combobox-btn"
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDocPopover}
                        className={cn(
                          "w-full justify-between font-normal text-left h-auto min-h-10 py-2 px-3",
                          !documentName && "text-muted-foreground",
                        )}
                      >
                        {selectedDocId && documentName ? (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-medium text-foreground truncate">
                              {documentName}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] shrink-0 font-normal"
                            >
                              {documentType}
                            </Badge>
                          </div>
                        ) : documentName ? (
                          <span className="truncate">{documentName}</span>
                        ) : (
                          <span className="text-muted-foreground">
                            {isLoadingAvailable
                              ? "Loading available documents..."
                              : category === "Given"
                                ? "Select document in office custody to hand over..."
                                : "Select document previously sent to receive back..."}
                          </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder={
                            category === "Given"
                              ? "Search documents in office custody..."
                              : "Search documents with client..."
                          }
                          value={docSearchQuery}
                          onValueChange={setDocSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 px-3 text-center text-xs">
                            <p className="text-muted-foreground mb-2">
                              No matching document found in{" "}
                              {category === "Given"
                                ? "office custody"
                                : "client possession"}
                              .
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => handleStartNewDoc(docSearchQuery)}
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              Add &quot;
                              {docSearchQuery.trim() || "New Document"}&quot;
                            </Button>
                          </CommandEmpty>

                          {availableDocs.length > 0 && (
                            <CommandGroup
                              heading={
                                category === "Given"
                                  ? "Available in Office Custody (Held by Office)"
                                  : "Available with Client (Previously Handed Out)"
                              }
                            >
                              {availableDocs.map((doc) => {
                                const isSelected = selectedDocId === doc._id;
                                return (
                                  <CommandItem
                                    key={doc._id}
                                    value={`${doc.documentName} ${doc.documentType} ${doc.location}`}
                                    onSelect={() =>
                                      handleSelectExistingDoc(doc)
                                    }
                                    className="flex items-center justify-between cursor-pointer py-2 px-2.5"
                                  >
                                    <div className="flex flex-col gap-0.5 truncate pr-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground truncate">
                                          {doc.documentName}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 px-1 font-normal shrink-0"
                                        >
                                          {doc.documentType}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        {doc.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {doc.location}
                                          </span>
                                        )}
                                        {doc.isReturnable && (
                                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                                            • Returnable
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Check
                                      className={cn(
                                        "h-4 w-4 shrink-0 text-primary",
                                        isSelected
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}

                          <CommandSeparator />
                          <CommandGroup heading="Actions">
                            <CommandItem
                              onSelect={() => handleStartNewDoc(docSearchQuery)}
                              className="text-primary cursor-pointer font-medium py-2"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              {docSearchQuery.trim()
                                ? `+ Add New Document: "${docSearchQuery.trim()}"`
                                : "+ Add New Document"}
                            </CommandItem>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* Document Selection Banner */}
                  {selectedDocId && selectedDoc && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 animate-in fade-in">
                      <div className="flex items-center gap-2 truncate">
                        <History className="h-4 w-4 text-sky-600 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold">
                            Linked to existing asset:
                          </span>{" "}
                          <span className="font-medium">
                            {selectedDoc.documentName}
                          </span>
                          <span className="text-muted-foreground ml-1.5 hidden sm:inline">
                            (Will update status to &quot;
                            {category === "Given"
                              ? "Sent / Returned"
                              : "Received / In Custody"}
                            &quot; without creating duplicates)
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 text-sky-700 hover:text-sky-900 shrink-0"
                        onClick={() => {
                          setSelectedDocId(null);
                          setDocumentName("");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )}

                  {!selectedDocId &&
                    availableDocs.length === 0 &&
                    !isLoadingAvailable && (
                      <div className="rounded-lg border border-dashed p-3 text-center bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {category === "Given"
                            ? "No documents are currently held in office custody for this client."
                            : "No previous documents handed out to this client."}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7"
                          onClick={() => handleStartNewDoc()}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add New Document Record
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Storage Location */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="doc-location"
                className="flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Office Storage Location{" "}
                <span className="text-destructive">*</span>
              </Label>
              {storageUnits.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Pick from office units below or type custom
                </span>
              )}
            </div>
            <DynamicConfigSelect
              categoryKey="office_storage_locations"
              value={location}
              onValueChange={setLocation}
              placeholder="e.g. Cabinet A, Shelf 1 or Safe Box 2"
            />
            {storageUnits.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  Units:
                </span>
                {storageUnits.map((u) => (
                  <button
                    key={u.location}
                    type="button"
                    onClick={() => setLocation(u.location)}
                    className={cn(
                      "text-[11px] px-2 py-0.5 rounded-md border transition-all",
                      location === u.location
                        ? "bg-primary text-primary-foreground border-primary font-medium shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border",
                    )}
                  >
                    {u.location}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Filing cabinet, drawer, locker, or shelf slot where this physical
              asset is preserved.
            </p>
          </div>

          {/* Returnable Switch & Expected Return Date */}
          <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="doc-returnable"
                  className="font-medium cursor-pointer"
                >
                  Is this asset returnable?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Check if client expects this original hardcopy back after
                  filing or audit.
                </p>
              </div>
              <Switch
                id="doc-returnable"
                checked={isReturnable}
                onCheckedChange={setIsReturnable}
              />
            </div>

            {isReturnable && (
              <div className="pt-2 border-t">
                <Label
                  htmlFor="doc-return-date"
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Expected Return Date{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-return-date"
                  type="date"
                  className="mt-1"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required={isReturnable}
                />
              </div>
            )}
          </div>

          {/* Person / Bearer Contact details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="doc-person" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {category === "Received"
                  ? "Handed In By (Person Name)"
                  : "Handed Out To (Person Name)"}
              </Label>
              <Input
                id="doc-person"
                placeholder="e.g. Rajesh Sharma (Director's Assistant)"
                value={receivedByPersonName}
                onChange={(e) => setReceivedByPersonName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Phone Number
              </Label>
              <Input
                id="doc-phone"
                placeholder="e.g. +91 98200 12345"
                value={receivedByPhone}
                onChange={(e) => setReceivedByPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Audit Notes / Condition Remarks</Label>
            <Textarea
              id="doc-notes"
              rows={2}
              placeholder="e.g. 1 original hardcopy booklet, verified intact stamp paper."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sticky bottom-0 bg-background/95 backdrop-blur border-t mt-4 pb-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="submit-in-out-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : category === "Received"
                    ? "Record Receipt"
                    : "Record Handover"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
