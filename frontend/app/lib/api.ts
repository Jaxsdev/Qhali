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
  validation_count: number;
  created_at: string;
}

export interface NearbyIncidentItem {
  id: number;
  public_alias: string;
  category: string;
  description: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: string;
  validation_count: number;
  created_at: string;
  distance_meters: number;
}

export interface ValidateResponse {
  validation_id: number;
  incident_id: number;
  validation_count: number;
  status: string;
  message: string;
}

export interface AdminIncident {
  id: number;
  public_alias: string;
  category: string;
  description: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  validation_count: number;
  created_at: string;
}

export interface AdminMetrics {
  total_reportes: number;
  reportes_pendientes: number;
  reportes_confirmados: number;
  reportes_en_revision: number;
  reportes_resueltos: number;
  categoria_mas_frecuente: string | null;
}

export interface DuplicateItem {
  id: number;
  description: string;
  status: string;
  distance_meters: number;
}

export interface DuplicateCheckResponse {
  has_duplicates: boolean;
  duplicates: DuplicateItem[];
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

  getIncident(id: number | string) {
    return request<IncidentResponse>(`/incidents/${id}`);
  },

  deleteIncident(id: number | string) {
    return request<{ message: string }>(`/incidents/${id}`, {
      method: "DELETE",
    });
  },

  getPublicIncidents(category?: string) {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<IncidentResponse[]>(`/incidents/public${qs}`);
  },

  getNearbyIncidents(lat: number, lng: number, radius = 300) {
    return request<NearbyIncidentItem[]>(
      `/incidents/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
  },

  validateIncident(incidentId: number, latitude: number, longitude: number) {
    return request<ValidateResponse>(`/incidents/${incidentId}/validate`, {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
  },

  deleteIncident(incidentId: number) {
    return request<{ message: string }>(`/incidents/${incidentId}`, {
      method: "DELETE",
    });
  },

  checkDuplicate(lat: number, lng: number, category: string) {
    return request<DuplicateCheckResponse>(
      `/incidents/check-duplicate?lat=${lat}&lng=${lng}&category=${encodeURIComponent(category)}`
    );
  },

  getAdminIncidents(statusFilter?: string, category?: string) {
    const params = new URLSearchParams();
    if (statusFilter) params.append("status_filter", statusFilter);
    if (category) params.append("category", category);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<AdminIncident[]>(`/admin/incidents${qs}`);
  },

  updateIncidentStatus(incidentId: number, newStatus: string) {
    return request<AdminIncident>(`/admin/incidents/${incidentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
  },

  getAdminMetrics() {
    return request<AdminMetrics>("/admin/metrics");
  },
};
