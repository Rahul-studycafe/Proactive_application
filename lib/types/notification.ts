export type NotificationCategory =
  | 'tasks'
  | 'billing'
  | 'documents'
  | 'dsc_vault'
  | 'attendance'
  | 'security'
  | 'subscription';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface InAppNotificationItem {
  _id: string;
  tenantId: string;
  recipientId: string;
  eventKey: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  actorId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InAppNotificationsResponse {
  notifications: InAppNotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreferenceItem {
  eventKey: string;
  category: NotificationCategory;
  name: string;
  description: string;
  isEnabled: boolean;
  isMandatory: boolean;
  inApp: boolean;
  email: boolean;
  whatsapp?: boolean;
  sms?: boolean;
}

export interface NotificationPolicyItem {
  eventKey: string;
  category: NotificationCategory;
  name: string;
  description: string;
  isMandatory: boolean;
  isEnabled: boolean;
  defaultInApp: boolean;
  defaultEmail: boolean;
  defaultWhatsapp?: boolean;
  defaultSms?: boolean;
}

