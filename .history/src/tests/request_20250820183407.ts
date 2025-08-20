// tests/utils/request.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export function authHeaders() {
  const token = process.env.API_TOKEN; // 測試用 Bearer；沒有就不帶
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function postJson<T = unknown>(path: string, data: unknown): Promise<{ res: Response; json: T }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return { res, json };
}
