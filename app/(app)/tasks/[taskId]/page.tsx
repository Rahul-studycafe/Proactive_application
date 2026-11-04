"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  useGetTaskByIdQuery,
  useGetTaskHistoryQuery,
  useGetTaskDocumentsQuery,
  useAddTaskHistoryNoteMutation,
  useUploadTaskDocumentMutation,
  useDeleteTaskDocumentMutation,
  useUpdateTaskStatusMutation,
} from "@/lib/services/api";
import {
  Loader2,
  ArrowLeft,
  Edit2,
  Phone,
  CheckCircle,
  Clock,
  Check,
  Circle,
  Trash2,
  ChevronDown,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
  User,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskCustomFieldsCard } from "./TaskCustomFieldsCard";
import { TaskChecklist } from "./TaskChecklist";
import { TaskSubtasks } from "./TaskSubtasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getFileIcon = (fileName: string) => {
  if (!fileName) return <File className="h-5 w-5 text-muted-foreground" />;
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return <FileText className="h-5 w-5 text-blue-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "webp":
      return <FileImage className="h-5 w-5 text-purple-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-success/15 text-success hover:bg-success/25 border-success/30";
    case "In Progress":
      return "bg-primary/15 text-primary hover:bg-primary/25 border-primary/30";
    case "Under Review":
      return "bg-warning/15 text-warning-foreground hover:bg-warning/25 border-warning/30";
    case "On Hold":
      return "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/30";
    case "Cancelled":
      return "bg-muted text-muted-foreground hover:bg-muted/80 border-border";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"; // Pending
  }
};

export default function TaskDashboard() {
  const { taskId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "details";

  const { data: task, isLoading: isTaskLoading } = useGetTaskByIdQuery(
    taskId as string,
  );
  const { data: history = [], isLoading: isHistoryLoading } =
    useGetTaskHistoryQuery(taskId as string);
  const { data: allDocs = [], isLoading: isDocsLoading } =
    useGetTaskDocumentsQuery({ taskId: taskId as string });

  const [addNote] = useAddTaskHistoryNoteMutation();
  const [updateTaskStatus, { isLoading: isUpdatingStatus }] =
    useUpdateTaskStatusMutation();
  const [noteContent, setNoteContent] = useState("");

  const [uploadDoc, { isLoading: isUploading }] =
    useUploadTaskDocumentMutation();
  const [deleteDoc] = useDeleteTaskDocumentMutation();

  const documentInputRef = useRef<HTMLInputElement>(null);
  const supportingFileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await deleteDoc({ taskId: taskId as string, id: docId }).unwrap();
      toast.success("File deleted successfully");
    } catch (err) {
      toast.error("Failed to delete file");
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: "document" | "supporting_file",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("category", category);
      formData.append("clientId", task?.clientId?._id || "unknown");
      formData.append("file", file);

      try {
        await uploadDoc({
          taskId: taskId as string,
          data: formData,
        }).unwrap();
        toast.success("File uploaded successfully");
      } catch (err) {
        toast.error("Failed to upload file");
      }

      // Reset input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const documents = allDocs.filter((d: any) => d.category === "document");
  const supportingFiles = allDocs.filter(
    (d: any) => d.category === "supporting_file",
  );
  const notesOnly = history.filter((h: any) => h.action === "Note Added");

  if (isTaskLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Task not found.
      </div>
    );
  }

  const isReadOnly = task.status === "Completed" || task.status === "Cancelled";

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await addNote({
        taskId: taskId as string,
        content: noteContent,
      }).unwrap();
      setNoteContent("");
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 2+ Level Breadcrumb Hierarchy */}
      <Breadcrumbs
        items={[
          { label: "Tasks", href: "/tasks" },
          {
            label:
              (task as any).title || task.serviceId?.name || "Task Details",
          },
        ]}
      />

      {/* Task Header - Consistent with Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {(task as any).title || task.serviceId?.name || "Unnamed Task"}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{task.clientId?.name || "Unknown Client"}</span>
              <span>•</span>
              <span className="font-mono">
                {task.clientId?.pan || "N/A PAN"}
              </span>
              <Select
                value={task.status}
                onValueChange={async (value) => {
                  try {
                    await updateTaskStatus({
                      id: taskId as string,
                      status: value,
                    }).unwrap();
                    toast.success("Task status updated");
                  } catch (err: any) {
                    const message =
                      err?.data?.error?.message ||
                      err?.data?.message ||
                      err?.data?.error ||
                      err?.message ||
                      "Failed to update status";
                    toast.error(message);
                  }
                }}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger
                  className={cn(
                    "h-6 text-xs px-2 py-0 border-none w-auto focus:ring-0 focus:ring-offset-0 inline-flex items-center gap-1 font-medium rounded-full shadow-none transition-colors",
                    getStatusColor(task.status),
                  )}
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(v) => router.replace(`?tab=${v}`, { scroll: false })}
        className="space-y-6"
      >
        {isReadOnly && (
          <div className="flex items-center gap-2.5 p-3 bg-muted/60 border rounded-lg text-xs text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>
              This task is <strong>{task.status}</strong>. To-dos, subtasks,
              notes, and file uploads are locked. To make further changes,
              change the status dropdown to <em>In Progress</em> or{" "}
              <em>Under Review</em>.
            </span>
          </div>
        )}

        <TabsList className="bg-muted/50 rounded-lg p-1 h-auto flex flex-wrap max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="todo">To-Do</TabsTrigger>
          <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="supporting_files">Supporting Files</TabsTrigger>
          <TabsTrigger value="task_history">Task History</TabsTrigger>
        </TabsList>

        <TabsContent
          value="details"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2"
        >
          {/* Left Column */}
          <div className="space-y-6">
            {/* General Info Card */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Period</span>
                  <span className="text-sm font-medium">
                    {task.period?.label ||
                      (task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "Ad-hoc")}
                  </span>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Description
                  </span>
                  <div className="flex items-center gap-2 group">
                    <span className="text-sm font-medium">
                      {task.description || "No description provided"}
                    </span>
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Due Date
                  </span>
                  <div className="flex items-center gap-2 group">
                    <span className="text-sm font-medium">
                      {task.dueDate ? formatDate(task.dueDate) : "N/A"}
                    </span>
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Target Date
                  </span>
                  <div className="flex items-center gap-2 group">
                    <span className="text-sm font-medium">
                      {task.targetDate ? formatDate(task.targetDate) : "N/A"}
                    </span>
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" />
                  </div>
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Created by
                  </span>
                  <span className="text-sm font-medium">PRATIBHA</span>
                </div>
              </CardContent>
            </Card>

            {/* Billing Information Card */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Invoice</span>
                  <Button
                    variant="link"
                    className="p-0 h-auto justify-start text-sm"
                  >
                    Create Invoice
                  </Button>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">
                    Billable?
                  </span>
                  <span className="text-sm font-medium">
                    {task.isBillable ? "Yes" : "No"}
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">
                    ₹
                    {(task.billableAmount !== undefined &&
                    task.billableAmount !== null
                      ? task.billableAmount
                      : task.billingAmount || 0
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Card */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-semibold">
                  Assignment & Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-sm text-muted-foreground mt-1">
                    Assignees
                  </span>
                  {task.assigneeIds && task.assigneeIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.assigneeIds.map((assignee: any) => (
                        <div
                          key={assignee._id}
                          className="flex items-center gap-2 bg-accent px-2 py-1 rounded-md border"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={assignee.photoUrl} />
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {assignee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {assignee.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground mt-1">
                      No users assigned
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                  <span className="text-sm text-muted-foreground">Tags</span>
                  {task.tags && task.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No tags added
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <TaskCustomFieldsCard
              taskId={taskId as string}
              customFieldsDef={task.serviceId?.customFieldsDef || []}
              customFieldValues={task.customFieldValues || {}}
              isReadOnly={isReadOnly}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Checklist Card */}
            <Card className="shadow-sm border-border h-[260px] flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Checklist
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  {task.checklist?.filter((c: any) => c.isCompleted).length ||
                    0}{" "}
                  / {task.checklist?.length || 0}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {task.checklist && task.checklist.length > 0 ? (
                  <div className="space-y-3">
                    {task.checklist.map((step: any, i: number) => (
                      <div
                        key={step._id || i}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                      >
                        {step.isCompleted ? (
                          <div className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-3.5 w-3.5 text-primary" />
                          </div>
                        ) : (
                          <div className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span
                          className={cn(
                            "text-sm pt-0.5 font-medium",
                            step.isCompleted
                              ? "line-through text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {step.stepName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                    <CheckCircle className="h-10 w-10 opacity-20" />
                    <span className="text-sm">There is no Checklist</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subtasks Card */}
            <Card className="shadow-sm border-border flex flex-col min-h-[260px] max-h-[400px]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Subtasks
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  {task.subtasks?.filter((s: any) => s.status === "Completed")
                    .length || 0}{" "}
                  / {task.subtasks?.length || 0}
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto text-muted-foreground flex-1">
                {task.subtasks && task.subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {task.subtasks.map((st: any, i: number) => (
                      <div
                        key={st._id || i}
                        className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-border/60 shadow-sm hover:shadow hover:border-primary/20 transition-all group"
                      >
                        <div className="flex items-center gap-3.5">
                          {st.status === "Completed" ? (
                            <div className="shrink-0 h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                              <CheckSquare className="h-4 w-4 text-primary" />
                            </div>
                          ) : (
                            <div className="shrink-0 h-7 w-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                              <div className="h-3.5 w-3.5 rounded-sm border-2 border-muted-foreground/40 bg-background" />
                            </div>
                          )}
                          <span
                            className={cn(
                              "text-sm font-medium",
                              st.status === "Completed"
                                ? "line-through text-muted-foreground"
                                : "text-foreground",
                            )}
                          >
                            {st.title}
                          </span>
                        </div>
                        <Badge
                          variant={
                            st.status === "Completed" ? "outline" : "secondary"
                          }
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 ml-2 shrink-0",
                            st.status === "Completed" && "opacity-60",
                          )}
                        >
                          {st.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground gap-3">
                    <CheckSquare className="h-10 w-10 opacity-20" />
                    <span className="text-sm">No subtasks created yet</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Additional Notes
                </CardTitle>
                {/* <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  + Add Note
                </Button> */}
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!isReadOnly ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a note..."
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddNote();
                      }}
                    />
                    <Button size="sm" onClick={handleAddNote}>
                      Add Note
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Notes are locked while the task is{" "}
                    {task.status.toLowerCase()}.
                  </p>
                )}

                {notesOnly && notesOnly.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {notesOnly.map((note: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 bg-accent/50 rounded-lg border text-sm text-foreground flex flex-col gap-1"
                      >
                        <p>{note.details}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={note.createdBy?.photoUrl} />
                            <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                              {note.createdBy?.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{note.createdBy?.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{formatDate(note.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes added yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="todo">
          <Card className="shadow-sm border-border h-full">
            <CardContent className="p-6 h-full">
              <TaskChecklist
                taskId={taskId as string}
                checklist={task.checklist || []}
                isReadOnly={isReadOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subtasks">
          <Card className="shadow-sm border-border h-full">
            <CardContent className="p-6 h-full">
              <TaskSubtasks
                taskId={taskId as string}
                subtasks={task.subtasks || []}
                isReadOnly={isReadOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Documents</CardTitle>
              <input
                type="file"
                className="hidden"
                ref={documentInputRef}
                onChange={(e) => handleFileUpload(e, "document")}
              />
              <Button
                size="sm"
                onClick={() => documentInputRef.current?.click()}
                disabled={isUploading || isReadOnly}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Upload Document
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileName)}
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded by {doc.uploadedBy?.name} on{" "}
                            {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          View
                        </Button>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDocument(doc._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 mb-2 opacity-20" />
                  <p>No documents uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="supporting_files">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Supporting Files
              </CardTitle>
              <input
                type="file"
                className="hidden"
                ref={supportingFileInputRef}
                onChange={(e) => handleFileUpload(e, "supporting_file")}
              />
              <Button
                size="sm"
                onClick={() => supportingFileInputRef.current?.click()}
                disabled={isUploading || isReadOnly}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Upload File
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {supportingFiles && supportingFiles.length > 0 ? (
                <div className="space-y-3">
                  {supportingFiles.map((doc: any) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.fileName)}
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded by {doc.uploadedBy?.name} on{" "}
                            {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          View
                        </Button>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDocument(doc._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <FileText className="h-8 w-8 mb-2 opacity-20" />
                  <p>No supporting files uploaded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="task_history">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold">
                Task History & Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {history && history.length > 0 ? (
                <div className="space-y-6">
                  {history.map((log: any) => (
                    <div key={log._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        <div className="w-px h-full bg-border my-1" />
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{log.action}</p>
                          <span className="text-xs text-muted-foreground">
                            • {formatDate(log.createdAt)}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded-md">
                            {log.details}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {log.createdBy?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Clock className="h-8 w-8 mb-2 opacity-20" />
                  <p>No history recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
