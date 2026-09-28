/**
 * FindIt API Service — connects React frontend to Express + MySQL backend
 * Uses Fetch API, handles JWT storage, auto-attaches token.
 */

// Default '/api' goes through the Vite dev proxy (see vite.config.js) -> no CORS / port problems.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('findit_token');
}

function setToken(token) {
  if (token) localStorage.setItem('findit_token', token);
  else localStorage.removeItem('findit_token');
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const url = `${API_BASE}${path}`;
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (auth) {
    Object.assign(finalHeaders, getAuthHeaders());
  }
  // Remove content-type if body is FormData
  if (body instanceof FormData) {
    delete finalHeaders['Content-Type'];
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { success: false, message: text || 'Invalid JSON response' };
  }

  if (!res.ok) {
    // Build detailed message from validation errors if present
    let msg = data.message || `Request failed: ${res.status}`;
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      msg = data.errors[0].message || data.errors[0].msg || msg;
      // Attach all field errors
    }
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.fieldErrors = data.errors || [];
    // Auto logout on 401
    if (res.status === 401) {
      if (!path.includes('/auth/login')) {
        setToken(null);
      }
    }
    throw err;
  }
  return data;
}

// ==================== AUTH ====================
export const authAPI = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: payload }),
  changePassword: (payload) => request('/auth/change-password', { method: 'PUT', body: payload }),
};

// ==================== USERS (admin) ====================
export const usersAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/users${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/users/${id}`),
  delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  updateRole: (id, role) => request(`/users/${id}/role`, { method: 'PUT', body: { role } }),
};

// ==================== ITEMS ====================
export const itemsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/items${qs ? `?${qs}` : ''}`, { auth: false }); // public can search
  },
  listAuth: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/items${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/items/${id}`, { auth: false }),
  getAuth: (id) => request(`/items/${id}`),
  create: (payload) => request('/items', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/items/${id}`, { method: 'PUT', body: payload }),
  delete: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  myItems: (userId) => {
    if (userId) return request(`/items/my/${userId}`);
    return request('/items/my');
  },
};

// ==================== CLAIMS ====================
export const claimsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/claims${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/claims/${id}`),
  create: (payload) => request('/claims', { method: 'POST', body: payload }),
  updateStatus: (id, status) => request(`/claims/${id}/status`, { method: 'PUT', body: { status } }),
  delete: (id) => request(`/claims/${id}`, { method: 'DELETE' }),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/notifications${qs ? `?${qs}` : ''}`);
  },
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),
  create: (payload) => request('/notifications', { method: 'POST', body: payload }),
};

// ==================== MATCHES ====================
export const matchesAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/matches${qs ? `?${qs}` : ''}`);
  },
  forItem: (id) => request(`/matches/item/${id}`),
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  get: () => request('/analytics'),
  heatmap: () => request('/analytics/heatmap'),
  overview: () => request('/analytics/overview'),
};

export { API_BASE, getToken, setToken };
