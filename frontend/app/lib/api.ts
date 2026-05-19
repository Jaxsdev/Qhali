const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("qhali_token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error de red" }));
    throw new Error(err.detail ?? "Error desconocido");
  }
  return res.json() as Promise<T>;
}

export interface UserPublic {
  id: number;
  alias_anonimo: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export interface IncidentResponse {
  id: number;
  public_alias: string;
  category: string;
  description: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return request<UserPublic>("/auth/me");
  },

  logout() {
    return request<{ message: string }>("/auth/logout", { method: "POST" });
  },

  createIncident(formData: FormData) {
    const token = getToken();
    return fetch(`${API_BASE}/incidents/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error de red" }));
        throw new Error(err.detail ?? "Error al crear reporte");
      }
      return res.json() as Promise<IncidentResponse>;
    });
  },

  getMyIncidents() {
    return request<IncidentResponse[]>("/incidents/my");
  },

  getPublicIncidents(category?: string) {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<IncidentResponse[]>(`/incidents/public${qs}`);
  },
};
