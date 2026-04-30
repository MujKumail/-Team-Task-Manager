import api from "./axios";

export const getTasks = async (projectId, params = {}) => {
  const { data } = await api.get(`/projects/${projectId}/tasks`, { params });
  return data;
};

export const getTask = async (projectId, taskId) => {
  const { data } = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return data;
};

export const createTask = async (projectId, payload) => {
  const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
  return data;
};

export const updateTask = async (projectId, taskId, payload) => {
  const { data } = await api.patch(
    `/projects/${projectId}/tasks/${taskId}`,
    payload
  );
  return data;
};

export const deleteTask = async (projectId, taskId) => {
  const { data } = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return data;
};
