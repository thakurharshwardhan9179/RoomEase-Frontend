import api from "./axios";

export interface ValidateGuestAccessRequest {
  bedToken: string;
  stayAccessCode: string;
}

export interface ValidateGuestAccessResponse {
  guestSessionToken: string;
  expiresInHours?: number;
}

export const validateGuestAccess = async (
  data: ValidateGuestAccessRequest,
): Promise<ValidateGuestAccessResponse> => {
  const response = await api.post(
    "/api/guest-access/validate",
    data,
  );

  return response.data;
};

