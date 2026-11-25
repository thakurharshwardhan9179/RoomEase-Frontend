import api from "./axios";

export type VerificationStatus = "Pending" | "Verified" | "Rejected" | string;

export interface TenantDocument {
  tenantDocumentId: string;
  documentType: string;
  fileUrl: string;
  verificationStatus: VerificationStatus;
  uploadedAt: string;
}

export interface UploadTenantDocumentResponse {
  message: string;
  documentId: string;
}

export const getTenantDocuments = async (
  tenantId: string,
): Promise<TenantDocument[]> => {
  const response = await api.get(`/api/TenantDocuments/${tenantId}`);

  return Array.isArray(response.data)
    ? (response.data as TenantDocument[])
    : [];
};

export const uploadTenantDocument = async (
  tenantId: string,
  documentType: string,
  file: File,
): Promise<UploadTenantDocumentResponse> => {
  const formData = new FormData();

  formData.append("TenantId", tenantId);
  formData.append("DocumentType", documentType);
  formData.append("File", file);

  const response = await api.post<UploadTenantDocumentResponse>(
    "/api/TenantDocuments/upload",
    formData,
  );

  return response.data;
};

export const deleteTenantDocument = async (
  documentId: string,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/api/TenantDocuments/${documentId}`,
  );

  return response.data;
};
