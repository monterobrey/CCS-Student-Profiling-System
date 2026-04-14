/**
 * Custom Hooks for API Integration
 * Provides reusable hooks for common API operations
 * 
 * Usage:
 * const { data, loading, error } = useFetch('/courses');
 * const { login, loading: isLoading } = useLogin();
 */

import { useState, useEffect, useCallback } from 'react';
import { httpClient, authService } from '../services';

/**
 * Hook for fetching data from API
 * @param {string} endpoint - API endpoint
 * @param {boolean} immediate - Fetch immediately on mount (default: true)
 * @returns {Object} - { data, loading, error, refetch }
 */
export const useFetch = (endpoint, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get(endpoint);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Error fetching data');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
};

/**
 * Hook for POST/PUT operations
 * @param {Function} apiCall - API service function
 * @returns {Object} - { execute, loading, error, data }
 */
export const useApi = (apiCall) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiCall(...args);
        if (response.success) {
          setData(response.data);
          return response;
        } else {
          setError(response.errors || response.message);
          return response;
        }
      } catch (err) {
        const errorMsg = err.message || 'Network error';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  return { execute, loading, error, data };
};

/**
 * Hook for authentication
 * @returns {Object} - { login, logout, user, loading, error }
 */
export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password, role = 'student') => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password, role);
      if (response.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const setupPassword = useCallback(
    async (email, token, password, passwordConfirmation) => {
      setLoading(true);
      setError(null);
      try {
        const response = await authService.setupPassword(
          email,
          token,
          password,
          passwordConfirmation
        );
        if (response.success) {
          return { success: true };
        } else {
          setError(response.message);
          return { success: false, message: response.message };
        }
      } catch (err) {
        const errorMsg = err.message || 'Setup failed';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { user, setUser, login, logout, setupPassword, loading, error };
};

/**
 * Hook for paginated data
 * @param {Function} apiCall - API function that accepts page parameter
 * @param {number} initialPage - Starting page (default: 1)
 * @returns {Object} - { data, currentPage, loading, error, goToPage, nextPage, prevPage }
 */
export const usePagination = (apiCall, initialPage = 1) => {
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(page);
      if (response.success) {
        setData(response.data);
        setCurrentPage(page);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetch(currentPage);
  }, [currentPage, fetch]);

  return {
    data,
    currentPage,
    loading,
    error,
    goToPage: (page) => setCurrentPage(page),
    nextPage: () => setCurrentPage(p => p + 1),
    prevPage: () => setCurrentPage(p => (p > 1 ? p - 1 : 1)),
  };
};

export default { useFetch, useApi, useAuth, usePagination };
