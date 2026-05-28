import axiosClient from "./axiosClient";

const unwrapResponse = (response) => response.data?.data ?? response.data;

const compactParams = (params = {}) =>
  Object.entries(params).reduce((cleanParams, [key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return cleanParams;
    }

    return { ...cleanParams, [key]: value };
  }, {});

export const getPosts = async (params = {}) => {
  const response = await axiosClient.get("/feed/posts", {
    params: compactParams(params),
  });

  return unwrapResponse(response);
};

export const getPostById = async (id) => {
  const response = await axiosClient.get(`/feed/posts/${id}`);
  return unwrapResponse(response);
};

export const createPost = async (data) => {
  const response = await axiosClient.post("/feed/posts", data);
  return unwrapResponse(response);
};

export const updatePost = async (id, data) => {
  const response = await axiosClient.put(`/feed/posts/${id}`, data);
  return unwrapResponse(response);
};

export const deletePost = async (id) => {
  const response = await axiosClient.delete(`/feed/posts/${id}`);
  return unwrapResponse(response);
};

export const likePost = async (id) => {
  const response = await axiosClient.post(`/feed/posts/${id}/like`);
  return unwrapResponse(response);
};

export const getComments = async (postId) => {
  const response = await axiosClient.get(`/feed/posts/${postId}/comments`);
  return unwrapResponse(response);
};

export const createComment = async (postId, data) => {
  const response = await axiosClient.post(`/feed/posts/${postId}/comments`, data);
  return unwrapResponse(response);
};
