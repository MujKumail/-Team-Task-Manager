export const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
