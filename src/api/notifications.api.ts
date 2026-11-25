import api from "./axios";

export interface RegisterOwnerDeviceResponse {
  message?: string;
  deviceTokenId?: string;
}

export interface OwnerNotificationStatusResponse {
  isRegistered: boolean;
}

// ----------------------------------------
// OWNER: REGISTER DEVICE
// ----------------------------------------

export const registerOwnerDevice = async (
  fcmToken: string
): Promise<RegisterOwnerDeviceResponse> => {
  const response = await api.post(
    "/api/Notifications/register-device",
    {
      fcmToken,
    }
  );

  return (
    response.data?.data ??
    response.data
  ) as RegisterOwnerDeviceResponse;
};

// ----------------------------------------
// OWNER: UNREGISTER DEVICE
// ----------------------------------------

export const unregisterOwnerDevice = async (
  fcmToken: string
) => {
  const response = await api.post(
    "/api/Notifications/unregister-device",
    {
      fcmToken,
    }
  );

  return response.data;
};

// ----------------------------------------
// OWNER: CHECK DEVICE STATUS
// ----------------------------------------

export const getOwnerNotificationStatus =
  async (
    fcmToken: string
  ): Promise<OwnerNotificationStatusResponse> => {
    const response = await api.get(
      "/api/Notifications/status",
      {
        params: {
          fcmToken,
        },
      }
    );

    return response.data as OwnerNotificationStatusResponse;
  };