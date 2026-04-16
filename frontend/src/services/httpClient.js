/**
 * HTTP Client - Centralized API communication layer
 * This acts as a bridge between React components and the Laravel backend
 * 
 * Purpose:
 * - Centralize all HTTP requests (GET, POST, PUT, DELETE)
 * - Automatically handle authentication tokens
 * - Standardize error handling
 * - Make it easy to change backend URL in one place
 * 
 * Security notes:
 * - Token management happens here
 * - Backend validates every request
 * - CORS is configured on backend
 * - All requests go through Laravel validation & authorization
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Build authorization header
 */
const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Make HTTP request with automatic token handling
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await response.json() : {};

    // Check if token expired (401 unauthorized)
    if (response.status === 401 && data.message?.includes('Unauthenticated')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/faculty/login';
    }

    return {
      status: response.status,
      ok: response.ok,
      success: data.success ?? response.ok,
      message: data.message ?? '',
      data: data.data ?? null,
      errors: data.errors ?? null,
    };
  } catch (error) {
    console.error('Network error:', error);
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      code: 0,
    };
  }
};

/**
 * GET request
 */
export const httpClient = {
  get: (endpoint, options = {}) => {
    return request(endpoint, {
      method: 'GET',
      ...options,
    });
  },

  /**
   * POST request
   */
  post: (endpoint, payload = {}, options = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  },

  /**
   * PUT request
   */
  put: (endpoint, payload = {}, options = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...options,
    });
  },

  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) => {
    return request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  },

  /**
   * PATCH request
   */
  patch: (endpoint, payload = {}, options = {}) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      ...options,
    });
  },
};

export default httpClient;
