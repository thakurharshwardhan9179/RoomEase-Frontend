
import api from "./axios";

export interface AccountRole {
  accountRoleId: string;
  name: string;
  isSystemRole: boolean;
  createdAt: string;
  permissions: string[];
  userCount: number;
}

export interface TeamPermission {
  code: string;
  displayName: string;
  description: string | null;
  moduleCode: string | null;
}

export interface AccountTeamUser {
  accountUserId: string;
  fullName: string;
  mobileNumber: string;
  accountRoleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateAccountRoleRequest {
  name: string;
  permissions: string[];
}

export interface CreateAccountUserRequest {
  fullName: string;
  mobileNumber: string;
  password: string;
  accountRoleId: string;
}

export interface UpdateAccountUserStatusRequest {
  isActive: boolean;
}

export interface TeamLoginResponse {
  token: string;
  userId: string;
  ownerId: string;
  fullName: string;
  mobileNumber: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export const teamApi = {
  async login(mobileNumber: string, password: string): Promise<TeamLoginResponse> {
    const response = await api.post<TeamLoginResponse>(
      "/api/AccountTeam/login",
      { mobileNumber, password },
    );
    return response.data;
  },

  async getAssignablePermissions(): Promise<TeamPermission[]> {
    const response = await api.get<TeamPermission[]>(
      "/api/AccountTeam/permissions",
    );
    return response.data;
  },

  async getRoles(): Promise<AccountRole[]> {
    const response = await api.get<AccountRole[]>(
      "/api/AccountTeam/roles",
    );

    return response.data;
  },

  async createRole(
    request: CreateAccountRoleRequest,
  ) {
    const response = await api.post(
      "/api/AccountTeam/roles",
      request,
    );

    return response.data;
  },

  async updateRole(
    roleId: string,
    request: CreateAccountRoleRequest,
  ) {
    const response = await api.put(
      `/api/AccountTeam/roles/${roleId}`,
      request,
    );

    return response.data;
  },

  async getUsers(): Promise<AccountTeamUser[]> {
    const response = await api.get<AccountTeamUser[]>(
      "/api/AccountTeam/users",
    );

    return response.data;
  },

  async getMe() {
    const response = await api.get("/api/AccountTeam/me");
    return response.data;
  },

  async createUser(
    request: CreateAccountUserRequest,
  ) {
    const response = await api.post(
      "/api/AccountTeam/users",
      request,
    );

    return response.data;
  },

  async updateUserStatus(
    userId: string,
    request: UpdateAccountUserStatusRequest,
  ) {
    const response = await api.patch(
      `/api/AccountTeam/users/${userId}/status`,
      request,
    );

    return response.data;
  },
};
