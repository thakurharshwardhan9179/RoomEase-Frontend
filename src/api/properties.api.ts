import api from "./axios";

/* =========================
   PROPERTY TYPES
========================= */

export interface Property {
  propertyId: string;
  propertyName: string;
  propertyType: "PG" | "Hostel" | "Apartment";
  city: string;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
}

export interface PropertiesResponse {
  items: Property[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* =========================
   BED / TENANT TYPES
========================= */

export interface BedTenant {
  tenantId: string;
  fullName: string;
  mobileNumber: string;
  agreedRentThisBed: number;
  totalRentAllBeds: number;
  balanceDue: number;
  advanceBalance?: number;
  depositAmount?: number;
  status:
    | "Paid"
    | "Upcoming"
    | "DueSoon"
    | "Overdue";
}


 


export interface Bed {
  bedId: string;
  bedNumber: string;
  monthlyRent: number;

  status:
    | "Occupied"
    | "Vacant"
    | "NeedsCleaning";

  // Permanent QR token for this bed
  guestAccessToken?: string | null;

  tenant: BedTenant | null;
}







export interface Room {
  roomId: string;
  roomNumber: string;
  roomType: "Single" | "Sharing";
  beds: Bed[];
}

export interface PropertyDetail {
  propertyId: string;
  propertyName: string;
  propertyType: "PG" | "Hostel" | "Apartment";
  address: string;
  city: string;
  rooms: Room[];
}

/* =========================
   FINANCE
========================= */

export interface FinanceSummary {
  occupiedBeds: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  totalOutstanding: number;
}

/* =========================
   ADD PROPERTY
========================= */

export const addProperty = async (data: {
  propertyName: string;
  propertyType: "PG" | "Hostel" | "Apartment";
  address: string;
  city: string;
}) => {
  const response = await api.post(
    "/api/Properties/add",
    data
  );

  return response.data;
};

/* =========================
   GET PROPERTIES
========================= */

export const getProperties = async (
  params?: {
    search?: string;
    propertyType?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<PropertiesResponse> => {
  const response = await api.get(
    "/api/Properties/my-properties",
    {
      params,
    }
  );

  return response.data;
};

/* =========================
   GET PROPERTY DETAIL
========================= */

export const getProperty = async (
  propertyId: string
): Promise<PropertyDetail> => {
  const response = await api.get(
    `/api/Properties/${propertyId}`
  );

  return response.data;
};

/* =========================
   PROPERTY FINANCE
========================= */

export const getPropertyFinance = async (
  propertyId: string
): Promise<FinanceSummary> => {
  const response = await api.get(
    `/api/Properties/${propertyId}/finance-summary`
  );

  return response.data;
};

/* =========================
   ADD ROOM
========================= */

export const addRoom = async (data: {
  propertyId: string;
  roomNumber: string;
  roomType: "Single" | "Sharing";
  bedCount: number;
  monthlyRent: number;
}) => {
  const response = await api.post(
    "/api/Rooms/add",
    data
  );

  return response.data;
};
/* =========================
   ROOM / BED MUTATIONS
========================= */

export type RoomType = "Single" | "Sharing";

export const updateProperty = async (propertyId: string, data: {
  propertyName: string;
  propertyType: "PG" | "Hostel" | "Apartment";
  address: string;
  city: string;
}) => {
  const response = await api.put(`/api/Properties/${propertyId}`, data);
  return response.data;
};

export const deleteProperty = async (propertyId: string) => {
  const response = await api.delete(`/api/Properties/${propertyId}`);
  return response.data;
};

export const updateRoom = async (roomId: string, data: {
  roomNumber: string;
  roomType: RoomType;
}) => {
  const response = await api.put(`/api/Rooms/${roomId}`, data);
  return response.data;
};

export const deleteRoom = async (roomId: string) => {
  const response = await api.delete(`/api/Rooms/${roomId}`);
  return response.data;
};

export const updateBed = async (bedId: string, data: {
  bedNumber: string;
  monthlyRent: number;
}) => {
  const response = await api.put(`/api/Rooms/beds/${bedId}`, data);
  return response.data;
};

export const deleteBed = async (bedId: string) => {
  const response = await api.delete(`/api/Rooms/beds/${bedId}`);
  return response.data;
};
