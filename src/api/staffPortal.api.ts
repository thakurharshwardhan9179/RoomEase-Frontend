import api from "./axios";

export interface StaffPortalLinkResponse {
  staffId: string;
  fullName: string;
  staffAccessToken: string;
}

export interface StaffPortalTask {
  taskId: string;
  title: string;
  description?: string | null;
  department?: string | null;
  status: string;
  priority?: string | null;
  createdAt?: string;
  dueAt?: string | null;
  guestTrackingToken?: string | null;
  actionToken?: string | null;
  assignedStaffName?: string | null;

  // Backend can return this after
  // task completion.
  proofPhotoUrl?: string | null;
}

export interface StaffPortalResponse {
  staffName: string;
  tasks: StaffPortalTask[];
}

export interface RegisterStaffDeviceResponse {
  message?: string;
  deviceTokenId?: string;
}

// ----------------------------------------
// OWNER: GET STAFF PORTAL LINK
// ----------------------------------------

export const getStaffPortalLink = async (
  staffId: string
): Promise<StaffPortalLinkResponse> => {
  const response = await api.get(
    `/api/Staff/${encodeURIComponent(
      staffId
    )}/portal-link`
  );

  return (
    response.data?.data ??
    response.data
  ) as StaffPortalLinkResponse;
};

export const buildStaffPortalUrl = (
  staffAccessToken: string
) => {
  return `${window.location.origin}/staff/portal/${encodeURIComponent(
    staffAccessToken
  )}`;
};

// ----------------------------------------
// PUBLIC STAFF PORTAL
// ----------------------------------------

export const getStaffPortalTasks = async (
  staffAccessToken: string
): Promise<StaffPortalResponse> => {
  const response = await api.get(
    `/api/staff-portal/${encodeURIComponent(
      staffAccessToken
    )}`
  );

  return (
    response.data?.data ??
    response.data
  ) as StaffPortalResponse;
};

// ----------------------------------------
// REGISTER STAFF DEVICE
// ----------------------------------------

export const registerStaffDevice = async (
  staffAccessToken: string,
  fcmToken: string
): Promise<RegisterStaffDeviceResponse> => {
  const response = await api.post(
    `/api/staff-portal/${encodeURIComponent(
      staffAccessToken
    )}/register-device`,
    {
      fcmToken,
    }
  );

  return (
    response.data?.data ??
    response.data
  ) as RegisterStaffDeviceResponse;
};

// ----------------------------------------
// PUBLIC TASK BY ACTION TOKEN
// ----------------------------------------

export interface PublicTaskResponse {
  taskId: string;
  propertyName?: string | null;
  roomNumber?: string | null;
  bedNumber?: string | null;
  department?: string | null;
  title?: string | null;
  description?: string | null;
  status: string;
  assignedStaffName?: string | null;
  proofPhotoUrl?: string | null;
}

// ----------------------------------------
// GET PUBLIC TASK
// ----------------------------------------

export const getPublicTaskByActionToken =
  async (
    actionToken: string
  ): Promise<PublicTaskResponse> => {
    const response = await api.get(
      `/api/public/tasks/${encodeURIComponent(
        actionToken
      )}`
    );

    return (
      response.data?.data ??
      response.data
    ) as PublicTaskResponse;
  };

// ----------------------------------------
// ACCEPT PUBLIC TASK
// ----------------------------------------

export const acceptPublicTaskByActionToken =
  async (
    actionToken: string
  ) => {
    const response = await api.post(
      `/api/public/tasks/${encodeURIComponent(
        actionToken
      )}/accept`
    );

    return (
      response.data?.data ??
      response.data
    );
  };

// ----------------------------------------
// COMPLETE PUBLIC TASK
// ----------------------------------------
// Backend:
// POST /api/public/tasks/{actionToken}/complete
//
// Content-Type:
// multipart/form-data
//
// Form field:
// proofPhoto
//
// Proof photo is mandatory.
// ----------------------------------------

export const completePublicTaskByActionToken =
  async (
    actionToken: string,
    proofPhoto: File
  ) => {
    if (!proofPhoto) {
      throw new Error(
        "A proof photo is required to complete this task."
      );
    }

    const formData =
      new FormData();

    formData.append(
      "proofPhoto",
      proofPhoto
    );

    const response = await api.post(
      `/api/public/tasks/${encodeURIComponent(
        actionToken
      )}/complete`,
      formData
    );

    return (
      response.data?.data ??
      response.data
    );
  };

// ----------------------------------------
// STAFF: UNREGISTER DEVICE
// ----------------------------------------

export const unregisterStaffDevice = async (
  staffAccessToken: string,
  fcmToken: string
) => {
  const response = await api.post(
    `/api/staff-portal/${encodeURIComponent(
      staffAccessToken
    )}/unregister-device`,
    {
      fcmToken,
    }
  );

  return (
    response.data?.data ??
    response.data
  );
};

// ----------------------------------------
// STAFF: CHECK NOTIFICATION STATUS
// ----------------------------------------

export interface StaffNotificationStatusResponse {
  isRegistered: boolean;
}

export const getStaffNotificationStatus =
  async (
    staffAccessToken: string,
    fcmToken: string
  ): Promise<StaffNotificationStatusResponse> => {
    const response = await api.get(
      `/api/staff-portal/${encodeURIComponent(
        staffAccessToken
      )}/notification-status`,
      {
        params: {
          fcmToken,
        },
      }
    );

    return (
      response.data?.data ??
      response.data
    ) as StaffNotificationStatusResponse;
  };