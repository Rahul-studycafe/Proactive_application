// Mock data for the Proactive MVP

export type EntityType =
  | "Individual"
  | "Sole Proprietor"
  | "Partnership"
  | "Private Limited"
  | "Trust"
  | "LLP";
export type ClientStatus = "Active" | "Inactive";

export interface Client {
  id: string;
  name: string;
  fileNo: string;
  entityType: EntityType;
  email: string;
  phone: string;
  pan?: string;
  gstin?: string;
  status: ClientStatus;
  group?: string;
}

export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Under Review"
  | "Completed";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface Task {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
  checklist: { id: string; label: string; done: boolean }[];
  timeLoggedMinutes: number;
}

export type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

export interface InvoiceLineItem {
  id: string;
  particulars: string;
  quantity: number;
  rate: number;
  taxPercent: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
  items?: InvoiceLineItem[];
}

export type UserRole = "Admin" | "Accountant" | "Staff" | "Team Leader";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive";
  avatarColor: string;
}

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "ACP & SK Ltd",
    fileNo: "12/7",
    entityType: "Trust",
    email: "acpsk@example.com",
    phone: "9024570899",
    pan: "AABCT1234C",
    gstin: "08ABCDE1234A1ZJ",
    status: "Active",
  },
  {
    id: "c2",
    name: "Anil Sharma",
    fileNo: "A1344",
    entityType: "Sole Proprietor",
    email: "anil@example.com",
    phone: "9024570810",
    pan: "ABCPS1234D",
    status: "Active",
    group: "Sharma Family",
  },
  {
    id: "c3",
    name: "Aone Traders",
    fileNo: "A2",
    entityType: "Sole Proprietor",
    email: "aone@example.com",
    phone: "9024570811",
    status: "Active",
  },
  {
    id: "c4",
    name: "Ashok",
    fileNo: "A1",
    entityType: "Partnership",
    email: "ashok@example.com",
    phone: "9024570812",
    status: "Active",
  },
  {
    id: "c5",
    name: "Auto Prime",
    fileNo: "001",
    entityType: "Private Limited",
    email: "samplecompany@gmail.com",
    phone: "9024570899",
    pan: "ABCDE1234A",
    gstin: "08ABCDE1234A1ZJ",
    status: "Active",
    group: "Patil Consultancy",
  },
  {
    id: "c6",
    name: "Madhav Dave",
    fileNo: "A987",
    entityType: "Individual",
    email: "madhav@example.com",
    phone: "9024570813",
    status: "Active",
  },
  {
    id: "c7",
    name: "Mohan Singh",
    fileNo: "A456",
    entityType: "Individual",
    email: "mohan@example.com",
    phone: "9024570814",
    status: "Inactive",
  },
  {
    id: "c8",
    name: "Karan Industries",
    fileNo: "CYM-434",
    entityType: "LLP",
    email: "karan@example.com",
    phone: "9024570815",
    status: "Active",
  },
];

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "GSTR-3B Filing — June",
    clientId: "c1",
    clientName: "ACP & SK Ltd",
    priority: "High",
    status: "Pending",
    dueDate: "2026-07-20",
    assignee: "Mohan",
    checklist: [
      { id: "ck1", label: "Collect invoices", done: true },
      { id: "ck2", label: "Reconcile GSTR-2B", done: false },
    ],
    timeLoggedMinutes: 45,
  },
  {
    id: "t2",
    title: "TDS Return Q1",
    clientId: "c2",
    clientName: "Anil Sharma",
    priority: "Medium",
    status: "Pending",
    dueDate: "2026-07-31",
    assignee: "Neha",
    checklist: [],
    timeLoggedMinutes: 0,
  },
  {
    id: "t3",
    title: "Audit Planning",
    clientId: "c5",
    clientName: "Auto Prime",
    priority: "Urgent",
    status: "In Progress",
    dueDate: "2026-07-15",
    assignee: "Kunal",
    checklist: [{ id: "ck3", label: "Engagement letter", done: true }],
    timeLoggedMinutes: 180,
  },
  {
    id: "t4",
    title: "Income Tax Return",
    clientId: "c6",
    clientName: "Madhav Dave",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-07-25",
    assignee: "Mohan",
    checklist: [],
    timeLoggedMinutes: 90,
  },
  {
    id: "t5",
    title: "ROC Compliance",
    clientId: "c8",
    clientName: "Karan Industries",
    priority: "Medium",
    status: "Under Review",
    dueDate: "2026-07-12",
    assignee: "Janhvi",
    checklist: [],
    timeLoggedMinutes: 120,
  },
  {
    id: "t6",
    title: "Bookkeeping — May",
    clientId: "c3",
    clientName: "Aone Traders",
    priority: "Low",
    status: "Completed",
    dueDate: "2026-06-30",
    assignee: "Neha",
    checklist: [],
    timeLoggedMinutes: 240,
  },
  {
    id: "t7",
    title: "GST Annual Return",
    clientId: "c4",
    clientName: "Ashok",
    priority: "High",
    status: "Completed",
    dueDate: "2026-06-15",
    assignee: "Kunal",
    checklist: [],
    timeLoggedMinutes: 300,
  },
  {
    id: "t8",
    title: "Bank Reconciliation",
    clientId: "c2",
    clientName: "Anil Sharma",
    priority: "Low",
    status: "Pending",
    dueDate: "2026-07-22",
    assignee: "Mohan",
    checklist: [],
    timeLoggedMinutes: 0,
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: "i1",
    number: "INV-2026-001",
    clientId: "c1",
    clientName: "ACP & SK Ltd",
    date: "2026-06-01",
    dueDate: "2026-06-15",
    status: "Paid",
    amount: 29760,
  },
  {
    id: "i2",
    number: "INV-2026-002",
    clientId: "c2",
    clientName: "Anil Sharma",
    date: "2026-06-05",
    dueDate: "2026-06-20",
    status: "Pending",
    amount: 12400,
  },
  {
    id: "i3",
    number: "INV-2026-003",
    clientId: "c5",
    clientName: "Auto Prime",
    date: "2026-05-10",
    dueDate: "2026-05-25",
    status: "Overdue",
    amount: 58000,
  },
  {
    id: "i4",
    number: "INV-2026-004",
    clientId: "c6",
    clientName: "Madhav Dave",
    date: "2026-06-18",
    dueDate: "2026-07-02",
    status: "Pending",
    amount: 8500,
  },
  {
    id: "i5",
    number: "INV-2026-005",
    clientId: "c8",
    clientName: "Karan Industries",
    date: "2026-06-20",
    dueDate: "2026-07-05",
    status: "Draft",
    amount: 45000,
  },
  {
    id: "i6",
    number: "INV-2026-006",
    clientId: "c4",
    clientName: "Ashok",
    date: "2026-06-15",
    dueDate: "2026-06-30",
    status: "Paid",
    amount: 15500,
  },
];

export const mockUsers: AppUser[] = [
  {
    id: "u-david",
    name: "David",
    email: "david@rahulandco.com",
    role: "Admin",
    status: "Active",
    avatarColor: "#6366f1",
  },
  {
    id: "u1",
    name: "Janhvi Mathur",
    email: "janhvi@mative.in",
    role: "Accountant",
    status: "Active",
    avatarColor: "#f59e0b",
  },
  {
    id: "u2",
    name: "Jugal Suthar",
    email: "jugal@mative.in",
    role: "Admin",
    status: "Active",
    avatarColor: "#10b981",
  },
  {
    id: "u3",
    name: "Kunal Patel",
    email: "kunal@mative.in",
    role: "Accountant",
    status: "Active",
    avatarColor: "#3b82f6",
  },
  {
    id: "u4",
    name: "Mohan Singh",
    email: "mohan@mative.in",
    role: "Accountant",
    status: "Active",
    avatarColor: "#8b5cf6",
  },
  {
    id: "u5",
    name: "Mukesh Suthar",
    email: "mukesh@mative.in",
    role: "Admin",
    status: "Active",
    avatarColor: "#ec4899",
  },
  {
    id: "u6",
    name: "Neha Sharma",
    email: "neha@mative.in",
    role: "Team Leader",
    status: "Active",
    avatarColor: "#06b6d4",
  },
  {
    id: "u7",
    name: "Praveen Vansh",
    email: "praveen@mative.in",
    role: "Admin",
    status: "Active",
    avatarColor: "#ef4444",
  },
  {
    id: "u8",
    name: "Rakesh Kumar",
    email: "rakesh@mative.in",
    role: "Staff",
    status: "Inactive",
    avatarColor: "#64748b",
  },
];

export const recentActivity = [
  {
    id: "a1",
    who: "Mohan",
    action: "completed task",
    target: "GST Annual Return",
    time: "2h ago",
  },
  {
    id: "a2",
    who: "Neha",
    action: "added invoice",
    target: "INV-2026-006",
    time: "4h ago",
  },
  {
    id: "a3",
    who: "Kunal",
    action: "created client",
    target: "Karan Industries",
    time: "yesterday",
  },
  {
    id: "a4",
    who: "Janhvi",
    action: "updated task",
    target: "ROC Compliance",
    time: "yesterday",
  },
  {
    id: "a5",
    who: "Praveen",
    action: "marked invoice paid",
    target: "INV-2026-001",
    time: "2 days ago",
  },
];
