import api from "./axios";

export interface MenuItem {
  menuItemId: string;
  propertyId: string;
  name: string;
  category?: string | null;
  price?: number | null;
  isActive: boolean;
}

export interface AddMenuItemRequest {
  propertyId: string;
  name: string;
  category?: string;
  price?: number;
}

export interface UpdateMenuItemRequest {
  name: string;
  category?: string;
  price?: number;
  isActive: boolean;
}

/* =========================
   MENU APIs
========================= */

export const addMenuItem = async (
  data: AddMenuItemRequest
) => {
  const response = await api.post(
    "/api/Menu/add",
    data
  );

  return response.data as {
    message: string;
    menuItemId?: string;
  };
};

export const getMenuByProperty = async (
  propertyId: string
) => {
  const response = await api.get(
    `/api/Menu/property/${propertyId}`
  );

  return response.data as MenuItem[];
};

export const updateMenuItem = async (
  menuItemId: string,
  data: UpdateMenuItemRequest
) => {
  const response = await api.put(
    `/api/Menu/${menuItemId}`,
    data
  );

  return response.data as {
    message: string;
  };
};