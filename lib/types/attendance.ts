export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Leave"
  | "Paid Leave"
  | "Holiday"
  | "Unmarked"
  | "N/A";

export interface IAttendance {
  _id: string;
  tenantId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string; // ISO string
  checkOut?: string; // ISO string
  totalMinutes?: number;
  overtimeMinutes?: number;
  markedBy?: string;
  verifiedVia?: "office_ip" | "gps" | "manual" | "unrestricted";
  ipAddress?: string;
  isPreJoining?: boolean;
  notes?: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyRosterSummary {
  totalStaff: number;
  present: number;
  halfDay: number;
  leave: number;
  absent: number;
  holiday: number;
  unmarked: number;
}

export interface DailyRosterMember {
  _id: string;
  name: string;
  username: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  departmentId?: string;
  departmentName?: string;
  attendance: IAttendance | null;
}

export interface DailyRosterResult {
  date: string;
  summary: DailyRosterSummary;
  roster: DailyRosterMember[];
}

export interface MarkAttendancePayload {
  userId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
}

export interface BulkMarkAttendancePayload {
  userIds: string[];
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface CheckInPayload {
  date?: string;
  timestamp?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  clientIp?: string;
}

export interface CheckOutPayload {
  date?: string;
  timestamp?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface MonthlyMatrixDay {
  day: number;
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holiday: { name: string; type: string } | null;
}

export interface MonthlyMatrixHoliday {
  _id: string;
  name: string;
  date: string;
  type: string;
  description?: string;
}

export interface MonthlyMatrixStaffMember {
  _id: string;
  name: string;
  username: string;
  email?: string;
  roleId?: string;
  roleName?: string;
  departmentId?: string;
  departmentName?: string;
  joiningDate?: string;
  records: Record<string | number, IAttendance | null>;
}

export interface MonthlyMatrixResult {
  month: string;
  year: string;
  daysInMonth: number;
  weekends: string[];
  holidays: MonthlyMatrixHoliday[];
  days: MonthlyMatrixDay[];
  staff: MonthlyMatrixStaffMember[];
  matrix: Record<string, Record<string | number, IAttendance | null>>;
}

export interface StaffAttendanceSummary {
  userId: string;
  userName: string;
  month: string;
  year: string;
  totalDays: number;
  effectiveTotalDays: number;
  isProrated: boolean;
  preJoiningDays: number;
  joiningDate: string | null;
  presentDays: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  absentDays: number;
  holidays: number;
  weekendsCount: number;
  officialHolidaysCount: number;
  payableDays: number;
  attendancePercentage: number;
  totalWorkingMinutes: number;
  totalOvertimeMinutes: number;
}

export interface OfficePerimeterConfig {
  enableIpWhitelist: boolean;
  ipWhitelist: string[];
  enforceGeofence: boolean;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusMeters: number;
}

export interface WorkingDaysConfig {
  weekends: string[];
  standardWorkHoursPerDay: number;
  alternateWeekendRules?: {
    day: string;
    weeks: number[];
  };
  officePerimeter?: OfficePerimeterConfig;
}
