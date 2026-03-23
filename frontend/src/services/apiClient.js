const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value === true || value === 'true') {
      searchParams.append(key, 'true');
    } else if (value !== false && value !== 'false') {
      searchParams.append(key, value);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    const json = await response.json();
    if (json && typeof json === 'object' && 'success' in json) {
      if (!json.success) throw new Error(json.error || 'API request failed');
    }
    return json;
  } catch (error) {
    console.error(`[apiClient] Error fetching ${endpoint}:`, error);
    throw error;
  }
};

export const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
};

export const unwrapObject = (res) => {
  if (res && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
  return res || {};
};
