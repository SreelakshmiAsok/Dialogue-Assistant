export const setToken = (token: string, role: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_role", role);
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

export const getRole = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("user_role");
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
  }
};

export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
