export const API_URL = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:3001";

export function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}