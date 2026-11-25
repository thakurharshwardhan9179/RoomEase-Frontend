export interface LoginRequest {
  mobileNumber: string;
  password: string;
}

export interface LoginResponse {
  message?: string;
  token: string;
  hasProperty: boolean;
  documentsSubmitted: boolean;
  ownerId: string;
  fullName: string;
}

export interface SignupRequest {
  fullName: string;
  mobileNumber: string;
  password: string;
}