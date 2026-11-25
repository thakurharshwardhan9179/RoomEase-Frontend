import api from "./axios";

// Backend documentation currently uses these values.
export type DocumentType = "AadharCard" | "PropertyProof";

export interface OwnerDocument {
  ownerDocumentId: string;
  documentType: DocumentType;
  fileUrl: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  uploadedAt: string;
}

export const uploadDocument = async (documentType: DocumentType, file: File) => {
  const formData = new FormData();
  formData.append("documentType", documentType);
  formData.append("file", file);
  const response = await api.post("/api/OwnerDocuments/upload", formData);
  return response.data;
};

export const getMyDocuments = async (): Promise<OwnerDocument[]> => {
  const response = await api.get("/api/OwnerDocuments/my-documents");
  return response.data;
};

export const deleteOwnerDocument = async (
  documentId: string,
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/api/OwnerDocuments/${documentId}`,
  );

  return response.data;
};
