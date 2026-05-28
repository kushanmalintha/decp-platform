import axiosClient from "./axiosClient";

const unwrapResponse = (response) => response.data?.data ?? response.data;

const compactParams = (params = {}) =>
  Object.entries(params).reduce((cleanParams, [key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return cleanParams;
    }

    return { ...cleanParams, [key]: value };
  }, {});

export const getNotifications = async (params = {}) => {
  const response = await axiosClient.get("/notifications", {
    params: compactParams(params),
  });

  return unwrapResponse(response);
};

export const getUnreadNotifications = async () => {
  const response = await axiosClient.get("/notifications/unread");
  return unwrapResponse(response);
};

export const getUnreadNotificationCount = async () => {
  const response = await axiosClient.get("/notifications/unread/count");
  return unwrapResponse(response);
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosClient.patch(`/notifications/${id}/read`);
  return unwrapResponse(response);
};

export const markAllNotificationsAsRead = async () => {
  const response = await axiosClient.patch("/notifications/read-all");
  return unwrapResponse(response);
};
