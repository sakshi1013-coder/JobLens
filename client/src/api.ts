import type { Application, ParseResponse, Status } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const tokenKey = "job_tracker_token";

export const authStore = {
  get: () => localStorage.getItem(tokenKey),
  set: (token: string) => localStorage.setItem(tokenKey, token),
  clear: () => localStorage.removeItem(tokenKey),
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStore.get();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Request failed");
  }
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  listApplications: () => request<Application[]>("/api/applications"),
  createApplication: (payload: Partial<Application> & { company: string; role: string; status: Status; dateApplied: string }) =>
    request<Application>("/api/applications", { method: "POST", body: JSON.stringify(payload) }),
  updateApplication: (id: string, payload: Partial<Application>) =>
    request<Application>(`/api/applications/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteApplication: (id: string) => request<{ ok: true }>(`/api/applications/${id}`, { method: "DELETE" }),
  parseJobDescription: (jobDescription: string) =>
    request<ParseResponse>("/api/ai/parse", { method: "POST", body: JSON.stringify({ jobDescription }) }),
};
