import api from "./axios";

export interface PropertyImage {
  propertyImageId: string;
  imageUrl: string;
  caption?: string | null;
  uploadedAt: string;
}

export interface UploadPropertyImageInput {
  propertyId: string;
  roomId?: string;
  bedId?: string;
  caption?: string;
  file: File;
}

/* ---------------------------------------
   Upload image
--------------------------------------- */

export async function uploadPropertyImage(
  input: UploadPropertyImageInput,
): Promise<string> {
  const formData = new FormData();

  formData.append("PropertyId", input.propertyId);

  if (input.roomId) {
    formData.append("RoomId", input.roomId);
  }

  if (input.bedId) {
    formData.append("BedId", input.bedId);
  }

  if (input.caption?.trim()) {
    formData.append("Caption", input.caption.trim());
  }

  formData.append("File", input.file);

  const response = await api.post(
    "/api/PropertyImages/upload",
    formData,
  );

  return (
    response.data?.imageId ??
    response.data?.data?.imageId
  );
}

/* ---------------------------------------
   Property-level gallery
--------------------------------------- */

export async function getPropertyImages(
  propertyId: string,
): Promise<PropertyImage[]> {
  const response = await api.get(
    `/api/PropertyImages/property/${encodeURIComponent(propertyId)}`,
  );

  const data = response.data?.data ?? response.data;

  return Array.isArray(data) ? (data as PropertyImage[]) : [];
}

/* ---------------------------------------
   Room gallery
--------------------------------------- */

export async function getRoomImages(
  roomId: string,
): Promise<PropertyImage[]> {
  const response = await api.get(
    `/api/PropertyImages/room/${encodeURIComponent(roomId)}`,
  );

  const data = response.data?.data ?? response.data;

  return Array.isArray(data) ? (data as PropertyImage[]) : [];
}

/* ---------------------------------------
   Bed gallery
--------------------------------------- */

export async function getBedImages(
  bedId: string,
): Promise<PropertyImage[]> {
  const response = await api.get(
    `/api/PropertyImages/bed/${encodeURIComponent(bedId)}`,
  );

  const data = response.data?.data ?? response.data;

  return Array.isArray(data) ? (data as PropertyImage[]) : [];
}

/* ---------------------------------------
   Delete image
--------------------------------------- */

export async function deletePropertyImage(
  imageId: string,
): Promise<void> {
  await api.delete(
    `/api/PropertyImages/${encodeURIComponent(imageId)}`,
  );
}