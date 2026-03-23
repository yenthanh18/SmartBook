/**
 * API Service Layer Placeholder
 * 
 * This file serves as the centralized location for all backend API calls.
 * Replace the mocked implementations with real `fetch` or `axios` calls
 * when the backend timeline is ready.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const CatalogService = {
  getProducts: async () => {
    // throw new Error("Not implemented");
    return [];
  },
  getProductById: async (id) => {
    // throw new Error("Not implemented");
    return null;
  }
};

export const AnalyticsService = {
  logEvent: (eventName, payload) => {
    // Google Analytics Event Hook Placeholder
    console.log(`[Analytics] ${eventName}`, payload);
  }
};

export const CartService = {
  syncCart: async (items) => {
    // TODO: Sync local cart state with backend
    console.log("[Cart] Synced items", items);
  }
};
