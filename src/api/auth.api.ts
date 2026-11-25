import api from "./axios";
import type { LoginRequest, LoginResponse, SignupRequest } from "../types/auth";

export const signup = async (data: SignupRequest) => {
  const response = await api.post("/api/Auth/signup", data);
  return response.data;
};

export const verifyOtp = async (mobileNumber: string, otp: string) => {
  const response = await api.post("/api/Auth/verify-otp", { mobileNumber, otp });
  return response.data;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/api/Auth/login", data);
  return response.data;
};

export const requestForgotPasswordOtp = async (mobileNumber: string) => {
  const response = await api.post("/api/Auth/forgot-password/request-otp", { mobileNumber });
  return response.data;
};

export const resetPassword = async (data: {
  mobileNumber: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/api/Auth/forgot-password/reset", data);
  return response.data;
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await api.post("/api/Auth/change-password", data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/api/Auth/logout");
  return response.data;
};
