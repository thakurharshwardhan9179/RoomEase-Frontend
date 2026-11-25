import api from "./axios";

export const getUnseenClientAnnouncements = async () => {
  const response = await api.get("/api/client-announcements/unseen");
  return response.data;
};

export const markClientAnnouncementSeen = async (id: string) => {
  const response = await api.post(`/api/client-announcements/${id}/seen`);
  return response.data;
};
