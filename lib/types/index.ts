export type TaskStatus =
  | "Pending"
  | "In Progress"
  | "Under Review"
  | "On Hold"
  | "Completed"
  | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export interface User {
  _id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface Client {
  _id: string;
  name: string;
  clientNumber?: string;
  fileNo?: string;
  entityType?: string;
  email?: string;
  mobile?: string;
  secondaryMobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstin?: string;
  photoUrl?: string;
  groupId?: { _id: string; name: string };
  tags?: string[];
  assignedUsers?: User[];
  billingProfileId?: string;
  contactPersonName?: string;
  dateOfBirth?: string;
  openingBalance?: number;
  isActive: boolean;
  tasks?: Task[];
  subscribedServices?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  name: string;
  clientNumber?: string;
  fileNo?: string;
  entityType?: string;
  email?: string;
  mobile?: string;
  secondaryMobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstin?: string;
  groupId?: string;
  tags?: string[];
  assignedUsers?: string[];
  billingProfileId?: string;
  contactPersonName?: string;
  dateOfBirth?: string | Date;
  openingBalance?: number;
  isActive?: boolean;
  photoUrl?: string;
}

export interface Service {
  _id: string;
  name: string;
}

export interface TaskPeriod {
  month?: number;
  year?: number;
  label?: string;
}

export interface Task {
  _id: string;
  clientId: Client;
  serviceId: Service;
  assigneeIds: User[];
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  period?: TaskPeriod;
  dueDate?: string;
  targetDate?: string;
  completedAt?: string;
  isBillable?: boolean;
  billableAmount?: number;
  tags?: string[];
  docCollectionRequest?: boolean;
  docCollectionMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  clientId: string;
  serviceId: string;
  assigneeIds: string[];
  description?: string;
  priority?: TaskPriority;
  period?: TaskPeriod;
  dueDate?: string;
  targetDate?: string;
  isBillable?: boolean;
  billableAmount?: number;
  tags?: string[];
  docCollectionRequest?: boolean;
  docCollectionMessage?: string;
}
