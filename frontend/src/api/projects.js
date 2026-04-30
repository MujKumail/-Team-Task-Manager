import api from "./axios";

export const getProjects = async () => {
  const { data } = await api.get("/projects");
  return data;
};

export const getProject = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const createProject = async (payload) => {
  const { data } = await api.post("/projects", payload);
  return data;
};

export const deleteProject = async (projectId) => {
  const { data } = await api.delete(`/projects/${projectId}`);
  return data;
};

export const getProjectMembers = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
};

export const addProjectMember = async (projectId, payload) => {
  const { data } = await api.post(`/projects/${projectId}/members`, payload);
  return data;
};

export const removeProjectMember = async (projectId, memberId) => {
  const { data } = await api.delete(`/projects/${projectId}/members/${memberId}`);
  return data;
};
