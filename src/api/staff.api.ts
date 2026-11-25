import api from "./axios";

export type StaffDepartment =
  | "Housekeeping"
  | "Maintenance"
  | "IT"
  | "FnB"
  | "Other";

export type StaffStatus = "Free" | "Busy";

export interface Staff {
  staffId: string;
  propertyId: string;
  fullName: string;
  mobileNumber: string;
  department: StaffDepartment | string;
  role?: string | null;
  currentStatus: StaffStatus | string;
  isActive: boolean;
  staffAccessToken?: string | null;
}

export interface StaffListResponse {
  items: Staff[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AddStaffRequest {
  propertyId: string;
  fullName: string;
  mobileNumber: string;
  department: StaffDepartment;
  role?: string;
}

export interface UpdateStaffRequest {
  fullName: string;
  mobileNumber: string;
  department: StaffDepartment;
  role?: string;
}

export const addStaff = async (
  data: AddStaffRequest
) => {
  const response = await api.post(
    "/api/Staff/add",
    data
  );

  return response.data as {
    message: string;
    staffId: string;
    staffAccessToken?: string;
  };
};

export const getMyStaff = async (params?: {
  propertyId?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  const response = await api.get(
    "/api/Staff/my-staff",
    {
      params,
    }
  );

  return response.data as StaffListResponse;
};

export const updateStaff = async (
  staffId: string,
  data: UpdateStaffRequest
) => {
  const response = await api.put(
    `/api/Staff/${staffId}`,
    data
  );

  return response.data as {
    message: string;
  };
};

export const deactivateStaff = async (
  staffId: string
) => {
  const response = await api.post(
    `/api/Staff/${staffId}/deactivate`
  );

  return response.data as {
    message: string;
  };
};
export interface StaffPortalLinkResponse {
  staffId: string;
  fullName: string;
  staffAccessToken: string;
}

export const getStaffPortalLink = async (
  staffId: string,
): Promise<StaffPortalLinkResponse> => {
  const response = await api.get(`/api/Staff/${staffId}/portal-link`);

  return response.data?.data ?? response.data;
};