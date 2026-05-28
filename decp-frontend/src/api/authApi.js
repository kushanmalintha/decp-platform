import axiosClient from "./axiosClient";

export const login = (data) => axiosClient.post("/auth/login", data);

export const register = (data) => axiosClient.post("/auth/register", data);

export const refreshToken = (refreshTokenValue) =>
  axiosClient.post("/auth/refresh", { refreshToken: refreshTokenValue });

export const logout = (refreshTokenValue) =>
  axiosClient.post("/auth/logout", { refreshToken: refreshTokenValue });

export const changePassword = (data) => axiosClient.put("/auth/me/password", data);

export const assignUserRole = (data) => axiosClient.put("/auth/admin/role", data);
