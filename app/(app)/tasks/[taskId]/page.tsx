"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useGetTaskByIdQuery,
  useGetTaskHistoryQuery,
  useGetTaskDocumentsQuery,
  useAddTaskHistoryNoteMutation,
  useUploadTaskDocumentMutation,
  useDeleteTaskDocumentMutation
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
  User,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TaskDashboard() {
  const { taskId } = useParams();
  const router = useRouter();

  const { data: task, isLoading: isTaskLoading } = useGetTaskByIdQuery(taskId as string);
  const { data: history = [], isLoading: isHistoryLoading } = useGetTaskHistoryQuery(taskId as string);
  const { data: allDocs = [], isLoading: isDocsLoading } = useGetTaskDocumentsQuery({ taskId: taskId as string });
  
  const [addNote] = useAddTaskHistoryNoteMutation();
  const [noteContent, setNoteContent] = useState("");

  const documents = allDocs.filter((d: any) => d.category === 'document');
  const supportingFiles = allDocs.filter((d: any) => d.category === 'supporting_file');
  const notesOnly = history.filter((h: any) => h.action === 'Note Added');

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

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      await addNote({ taskId: taskId as string, content: noteContent }).unwrap();
      setNoteContent("");
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Consistent Breadcrumb */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Tasks
        </Link>
        <Button variant="destructive" size="sm" className="h-8 text-xs">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Task
        </Button>
      </div>

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
                {task.clientId?.customFields?.pan || "N/A PAN"}
              </span>
              <Badge variant="secondary" className="font-medium">
                {task.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm">
            Verify
          </Button>
        </div>
      </div>

      {/* Standard Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="todo">To-Do</TabsTrigger>
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
                    {task.period?.label || "2023-24"}
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
                    ₹{task.billableAmount || "0.00"}
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
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Checklist Card */}
            <Card className="shadow-sm border-border h-[260px] flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Checklist
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  + Add
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground gap-3">
                <CheckCircle className="h-10 w-10 opacity-20" />
                <span className="text-sm">There is no Checklist</span>
              </CardContent>
            </Card>

            {/* Subtasks Card */}
            <Card className="shadow-sm border-border flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Subtasks
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  + Add
                </Button>
              </CardHeader>
              <CardContent className="p-6 text-muted-foreground">
                {task.subtasks && task.subtasks.length > 0 ? (
                  <div className="space-y-3">
                    {task.subtasks.map((st: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg border border-border"
                      >
                        <div className="h-4 w-4 rounded-sm border bg-background" />
                        <span className="text-sm font-medium text-foreground">
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <span className="text-sm">No subtasks available</span>
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
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  + Add Note
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a note..." 
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                  />
                  <Button size="sm" onClick={handleAddNote}>
                    Add Note
                  </Button>
                </div>

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
                              {note.createdBy?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{note.createdBy?.name || 'Unknown'}</span>
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
          <Card className="shadow-sm border-border">
            <CardContent className="p-12 text-center text-muted-foreground">
              To-Do content
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Documents</CardTitle>
              <Button size="sm">Upload Document</Button>
            </CardHeader>
            <CardContent className="p-6">
              {documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">Uploaded by {doc.uploadedBy?.name} on {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>View</Button>
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
              <CardTitle className="text-sm font-semibold">Supporting Files</CardTitle>
              <Button size="sm">Upload File</Button>
            </CardHeader>
            <CardContent className="p-6">
              {supportingFiles && supportingFiles.length > 0 ? (
                <div className="space-y-3">
                  {supportingFiles.map((doc: any) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">Uploaded by {doc.uploadedBy?.name} on {formatDate(doc.createdAt)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => window.open(doc.fileUrl, '_blank')}>View</Button>
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
              <CardTitle className="text-sm font-semibold">Task History & Audit Log</CardTitle>
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
                          <span className="text-xs text-muted-foreground">• {formatDate(log.createdAt)}</span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded-md">
                            {log.details}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">by {log.createdBy?.name}</p>
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
