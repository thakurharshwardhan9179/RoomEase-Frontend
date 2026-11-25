import api from "./axios";

export interface AccountAccess {
  modules: { code: string; name: string }[];
  permissions: string[];
}

export async function getAccountAccess(): Promise<AccountAccess> {
  const response = await api.get<AccountAccess>("/api/Me/access");
  return response.data;
}
