import axiosClient from "./axiosClient";

const unwrapResponse = (response) => response.data?.data ?? response.data;

export const getCurrentUserProfile = async () => {
  const response = await axiosClient.get("/users/me");
  return unwrapResponse(response);
};

export const updateCurrentUserProfile = async (profileData) => {
  const response = await axiosClient.put("/users/me", profileData);
  return unwrapResponse(response);
};
