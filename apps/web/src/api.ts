const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ApiHealth = { status: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function getHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}
