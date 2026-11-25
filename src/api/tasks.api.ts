import api from "./axios";

export type TaskStatus =
  | "Open"
  | "InProgress"
  | "Completed";

export type TaskDepartment =
  | "Housekeeping"
  | "Maintenance"
  | "IT"
  | "FnB"
  | "Other";

export interface TaskListItem {
  taskId: string;
  propertyId: string;
  department: string;
  roomId?: string | null;
  bedId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus | string;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  triggerType?: string | null;
  createdAt?: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  actionToken?: string;
}

export interface TaskListResponse {
  items: TaskListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTaskRequest {
  propertyId: string;
  department: TaskDepartment;
  roomId?: string;
  bedId?: string;
  title: string;
  description?: string;
  assignedStaffId?: string;
}

export interface AssignTaskRequest {
  staffId: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface PublicTask {
  taskId: string;
  propertyName: string;
  roomNumber: string | null;
  bedNumber: string | null;
  department: string;
  title: string;
  description: string;
  status: TaskStatus | string;
  assignedStaffName: string | null;
}

/* =========================
   OWNER TASK APIs
========================= */

export const createTask = async (
  data: CreateTaskRequest
) => {
  const response = await api.post(
    "/api/Tasks/add",
    data
  );

  return response.data as {
    message: string;
    taskId: string;
  };
};

export const getMyTasks = async (params?: {
  propertyId?: string;
  department?: string;
  status?: TaskStatus;
  page?: number;
  pageSize?: number;
}) => {
  const response = await api.get(
    "/api/Tasks/my-tasks",
    {
      params,
    }
  );

  return response.data as TaskListResponse;
};

export const assignTask = async (
  taskId: string,
  staffId: string
) => {
  const response = await api.post(
    `/api/Tasks/${taskId}/assign`,
    {
      staffId,
    } satisfies AssignTaskRequest
  );

  return response.data as {
    message: string;
  };
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
) => {
  const response = await api.post(
    `/api/Tasks/${taskId}/status`,
    {
      status,
    } satisfies UpdateTaskStatusRequest
  );

  return response.data as {
    message: string;
  };
};

export const triggerEscalationCheck = async () => {
  const response = await api.post(
    "/api/Tasks/trigger-escalation-check"
  );

  return response.data as {
    message: string;
  };
};

/* =========================
   PUBLIC MAGIC-LINK APIs
   NO LOGIN
========================= */

export const getTaskByActionToken = async (
  actionToken: string
) => {
  const response = await api.get(
    `/api/public/tasks/${actionToken}`
  );

  return response.data as PublicTask;
};

export const acceptTaskViaToken = async (
  actionToken: string
) => {
  const response = await api.post(
    `/api/public/tasks/${actionToken}/accept`
  );

  return response.data as {
    message: string;
  };
};

export const completeTaskViaToken = async (
  actionToken: string,
  proofPhoto: File,
) => {
  const formData = new FormData();
  formData.append("proofPhoto", proofPhoto);

  const response = await api.post(
    `/api/public/tasks/${actionToken}/complete`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data as {
    message: string;
  };
};
