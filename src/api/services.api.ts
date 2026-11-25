import api from "./axios";

export type ServiceDepartment =
  | "Housekeeping"
  | "Maintenance"
  | "IT"
  | "Other";

export interface Service {
  serviceId: string;
  propertyId: string;
  name: string;
  department: ServiceDepartment;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface AddServiceRequest {
  propertyId: string;
  name: string;
  department: ServiceDepartment;
  description?: string;
  sortOrder?: number;
}

export interface UpdateServiceRequest {
  name: string;
  department: ServiceDepartment;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceMutationResponse {
  message?: string;
  serviceId?: string;
}

export const getServicesByProperty = async (
  propertyId: string,
): Promise<Service[]> => {
  const response = await api.get(
    `/api/Services/property/${propertyId}`,
  );

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

export const addService = async (
  data: AddServiceRequest,
): Promise<ServiceMutationResponse> => {
  const response = await api.post(
    "/api/Services/add",
    data,
  );

  return response.data;
};

export const updateService = async (
  serviceId: string,
  data: UpdateServiceRequest,
): Promise<ServiceMutationResponse> => {
  const response = await api.put(
    `/api/Services/${serviceId}`,
    data,
  );

  return response.data;
};

export const deactivateService = async (
  serviceId: string,
): Promise<ServiceMutationResponse> => {
  const response = await api.post(
    `/api/Services/${serviceId}/deactivate`,
  );

  return response.data;
};

