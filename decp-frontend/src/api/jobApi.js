import axiosClient from "./axiosClient";

const unwrapResponse = (response) => response.data?.data ?? response.data;

const compactParams = (params = {}) =>
  Object.entries(params).reduce((cleanParams, [key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return cleanParams;
    }

    return { ...cleanParams, [key]: value };
  }, {});

export const getJobs = async (params = {}) => {
  const response = await axiosClient.get("/jobs", {
    params: compactParams(params),
  });

  return unwrapResponse(response);
};

export const getJobById = async (id) => {
  const response = await axiosClient.get(`/jobs/${id}`);
  return unwrapResponse(response);
};

export const saveJob = async (id) => {
  const response = await axiosClient.post(`/jobs/${id}/save`);
  return unwrapResponse(response);
};

export const unsaveJob = async (id) => {
  const response = await axiosClient.delete(`/jobs/${id}/save`);
  return unwrapResponse(response);
};

export const getSavedJobs = async (params = {}) => {
  const response = await axiosClient.get("/jobs/saved", {
    params: compactParams(params),
  });

  return unwrapResponse(response);
};

export const applyToJob = async (id) => {
  const response = await axiosClient.post(`/jobs/${id}/apply`);
  return unwrapResponse(response);
};

export const getMyApplications = async () => {
  const response = await axiosClient.get("/jobs/applications/me");
  return unwrapResponse(response);
};
