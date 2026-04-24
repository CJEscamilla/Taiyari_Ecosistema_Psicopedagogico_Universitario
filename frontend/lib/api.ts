/**
 * ============================================
 * Cliente de API — Backend Express
 * ============================================
 *
 * Archivo único que centraliza TODAS las llamadas desde el frontend hacia
 * el backend Express y la lógica de autenticación basada en JWT.
 *
 * Incluye:
 *   - `buildApiUrl(path)`   Une el `NEXT_PUBLIC_API_URL` con la ruta.
 *   - Helpers de auth       `loginExpress`, `registerExpress`, `logout`, etc.
 *   - `useAuth()`           Hook React que reemplaza a NextAuth `useSession()`.
 *   - `useRequireAuth()`    Guard para proteger páginas (opcional adminOnly).
 *   - `adminFetch(path,...)` Wrapper de `fetch` que inyecta el JWT automáticamente.
 *   - `getExperiencias()` / `getExperienciaById()` — lectura de catálogo.
 *
 * El token se guarda en `localStorage` bajo la clave `token`. Esto es sencillo
 * para un proyecto académico pero tiene limitaciones (XSS). En producción
 * considerar `httpOnly cookie` + CSRF token.
 */
import { useState, useEffect, useCallback } from "react";

/** Base URL del backend. Sin slash final para que `buildApiUrl` concatene limpio. */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3001";

/**
 * Une la URL base del backend con una ruta, manejando correctamente la barra
 * inicial esté o no presente.
 *
 * @example
 *   buildApiUrl('/api/own/cart')      // http://localhost:3001/api/own/cart
 *   buildApiUrl('api/own/cart')       // http://localhost:3001/api/own/cart
 */
export function buildApiUrl(path: string): string {
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

// ============================================
// CLIENTE API PARA BACKEND EXPRESS
// ============================================

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      nombre: string;
      email: string;
    };
    token: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
  data?: undefined;
}

export type ApiResponse = LoginResponse | ApiError;

/**
 * Type guard para verificar si la respuesta es un error
 */
export function isApiError(response: ApiResponse): response is ApiError {
  return !response.success;
}

/**
 * Login con el backend Express (API Propia)
 * @param email - Email del usuario
 * @param password - Contraseña
 * @returns Token JWT y datos del usuario (con role: 'admin' o 'user')
 * 
 * URL: POST /api/own/auth/login
 */
export async function loginExpress(
  email: string,
  password: string
): Promise<ApiResponse> {
  const response = await fetch(buildApiUrl("/api/own/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Error al iniciar sesión",
    };
  }

  // Guardar token en localStorage
  if (data.success && data.data?.token) {
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
  }

  return data as ApiResponse;
}

/**
 * Registro con el backend Express (API Propia)
 * 
 * URL: POST /api/own/auth/register
 */
export async function registerExpress(
  nombre: string,
  email: string,
  password: string,
  telefono?: string
): Promise<ApiResponse> {
  const response = await fetch(buildApiUrl("/api/own/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nombre, email, password, telefono }),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || "Error al registrar usuario",
    };
  }

  // Auto-login después de registro exitoso
  if (data.success && data.data?.token) {
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
  }

  return data as ApiResponse;
}

/**
 * Decodifica el JWT guardado en `localStorage` y extrae el campo `role`.
 * No verifica la firma — solo lee el payload (la validación real la hace
 * el backend en cada request). Si el token es malformado o no existe,
 * devuelve `null`.
 *
 * @returns `'admin'` | `'user'` | `null`
 */
export function getUserRole(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    // JWT payload está en la segunda parte (base64)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "user";
  } catch {
    return null;
  }
}

/** Shortcut de `getUserRole() === 'admin'`. */
export function isAdmin(): boolean {
  return getUserRole() === "admin";
}

/** Devuelve el JWT guardado o `null` si no hay sesión. */
export function getToken(): string | null {
  return localStorage.getItem("token");
}

/** Elimina el JWT y datos de usuario del `localStorage`. */
export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/** `true` cuando hay un JWT guardado (no valida expiración). */
export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============================================
// EXPERIENCIAS - Catálogo
// ============================================

export interface Experiencia {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  descripcionLarga: string | null;
  precio: number;
  duracionMinutos: number;
  rangoEdad: string | null;
  tamanoGrupo: string | null;
  beneficios: string[];
  incluye: string[];
  color: string | null;
  imagenUrl: string | null;
  rating: number;
  reviews: number;
  createdAt?: string;
  updatedAt?: string;
  fechasDisponibles?: FechaDisponible[];
}

export interface FechaDisponible {
  id: string;
  fecha: string | Date;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
}

/**
 * Obtiene el catálogo de experiencias desde el backend Express.
 * URL: GET /api/own/experiencias
 */
export async function getExperiencias(options?: {
  limit?: number;
  sortBy?: "rating" | "createdAt";
}): Promise<Experiencia[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.sortBy) params.set("sortBy", options.sortBy);

  const qs = params.toString();
  const url = buildApiUrl(`/api/own/experiencias${qs ? `?${qs}` : ""}`);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener experiencias");
  const json = await res.json();
  return json?.data?.experiencias ?? [];
}

/**
 * Obtiene una experiencia por ID incluyendo fechas disponibles.
 * URL: GET /api/own/experiencias/:id
 */
export async function getExperienciaById(id: string): Promise<Experiencia | null> {
  const res = await fetch(buildApiUrl(`/api/own/experiencias/${id}`), {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Error al obtener la experiencia");
  const json = await res.json();
  return json?.data?.experiencia ?? null;
}

// ============================================
// ADMIN - Fetch helpers con JWT
// ============================================

/**
 * Wrapper de `fetch` para llamadas autenticadas al backend. Inyecta el
 * header `Authorization: Bearer <token>` si hay sesión y agrega
 * `Content-Type: application/json` automáticamente cuando el body es JSON.
 *
 * Usarlo en todos los componentes admin evita repetir la misma lógica.
 *
 * @example
 *   const res = await adminFetch('/api/own/admin/stats');
 *   const data = await res.json();
 */
export async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(buildApiUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });
}

// ============================================
// HOOK useAuth - Reemplazo de NextAuth
// ============================================

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  role?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse>;
  logout: () => void;
  refresh: () => void;
}

/**
 * Hook de autenticación basado en JWT almacenado en localStorage.
 * Reemplaza a NextAuth useSession().
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const parsedUser: AuthUser = storedUser ? JSON.parse(storedUser) : null;
      const role = getUserRole();
      setUser(parsedUser ? { ...parsedUser, role: role ?? parsedUser.role } : null);
      setToken(storedToken);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Escuchar cambios en otras pestañas
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") refresh();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  const doLogin = useCallback(
    async (email: string, password: string) => {
      const result = await loginExpress(email, password);
      if (!isApiError(result)) refresh();
      return result;
    },
    [refresh]
  );

  const doLogout = useCallback(() => {
    logout();
    setUser(null);
    setToken(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    loading,
    login: doLogin,
    logout: doLogout,
    refresh,
  };
}

/**
 * Hook para proteger rutas. Redirige si no cumple requisitos.
 * Uso: useRequireAuth({ adminOnly: true })
 */
export function useRequireAuth(options?: {
  adminOnly?: boolean;
  redirectTo?: string;
}) {
  const auth = useAuth();
  const { loading, isAuthenticated: authed, isAdmin: admin } = auth;
  const redirectTo = options?.redirectTo ?? "/auth/login";
  const adminOnly = options?.adminOnly ?? false;

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;
    if (!authed) {
      window.location.href = redirectTo;
      return;
    }
    if (adminOnly && !admin) {
      window.location.href = "/";
    }
  }, [loading, authed, admin, adminOnly, redirectTo]);

  return auth;
}
