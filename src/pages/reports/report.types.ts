import type { ReactNode } from "react";

import type { Property } from "../../api/properties.api";
import type { Tenant } from "../../api/tenants.api";
import type { ReminderLog } from "../../api/reminder.api";
import type { Staff } from "../../api/staff.api";
import type { TaskListItem } from "../../api/tasks.api";

// =========================================================
// REPORT KEY
// =========================================================

export type ReportKey =
  | "tenants"
  | "availability"
  | "payments"
  | "expenses"
  | "operations"
  | "reminders"
  | "staff"
  | "properties";

// =========================================================
// PROPERTY
// =========================================================

// Property ke fields already API type me defined hain.
// Dobara totalRooms / totalBeds / occupiedBeds declare nahi karna.
export type PropertyWithStats = Property;

// =========================================================
// AVAILABILITY
// =========================================================

export interface AvailabilityItem
  extends PropertyWithStats {
  vacantBeds: number;
  occupancy: number;
}

export interface AvailabilityTotals {
  rooms: number;
  beds: number;
  occupied: number;
  vacant: number;
}

// =========================================================
// TASK STATS
// =========================================================

export interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
}

// =========================================================
// STAFF STATS
// =========================================================

export interface StaffStats {
  total: number;
  free: number;
  busy: number;
}

// =========================================================
// REMINDER STATS
// =========================================================

export interface ReminderStats {
  overdue: number;
  dueSoon: number;
}

// =========================================================
// REPORT CARD
// =========================================================

export interface ReportCardDefinition {
  key: ReportKey;
  title: string;
  description: string;
  icon: ReactNode;
  tone: string;
  dataLabel: string;
}

// =========================================================
// EXPORT RUNNER
// =========================================================

export interface ReportExportRunner {
  (
    key: string,
    action: () => Promise<void>,
    message: string
  ): Promise<void>;
}

// =========================================================
// REPORT DATA
// =========================================================

export interface ReportsData {
  properties: Property[];
  tenants: Tenant[];
  staff: Staff[];
  tasks: TaskListItem[];
  reminders: ReminderLog[];

  availability: AvailabilityItem[];

  availabilityTotals: AvailabilityTotals;

  taskStats: TaskStats;

  staffStats: StaffStats;

  reminderStats: ReminderStats;
}