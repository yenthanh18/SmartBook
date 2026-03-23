import { apiClient, buildQueryString } from './apiClient';
import { getSessionId } from '../utils/session';

export const cartService = {
  notifyCartUpdated: () => window.dispatchEvent(new Event('cart_updated')),

  getCart: () => apiClient(`/cart${buildQueryString({ session_id: getSessionId() })}`),
  
  addToCart: async (productId, quantity = 1) => {
    const res = await apiClient('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ session_id: getSessionId(), product_id: productId, quantity })
    });
    cartService.notifyCartUpdated();
    return res;
  },
  
  updateCartItem: async (productId, quantity) => {
    const res = await apiClient('/cart/update', {
      method: 'POST',
      body: JSON.stringify({ session_id: getSessionId(), product_id: productId, quantity })
    });
    cartService.notifyCartUpdated();
    return res;
  },
  
  removeCartItem: async (productId) => {
    const res = await apiClient('/cart/remove', {
      method: 'POST',
      body: JSON.stringify({ session_id: getSessionId(), product_id: productId })
    });
    cartService.notifyCartUpdated();
    return res;
  },
  
  clearCart: async () => {
    const res = await apiClient('/cart/clear', {
      method: 'POST',
      body: JSON.stringify({ session_id: getSessionId() })
    });
    cartService.notifyCartUpdated();
    return res;
  },
  
  getCheckoutSummary: () => apiClient(`/checkout/summary${buildQueryString({ session_id: getSessionId() })}`),
  
  processCheckout: (checkoutData) => apiClient('/checkout', {
    method: 'POST',
    body: JSON.stringify({ session_id: getSessionId(), ...checkoutData })
  })
};
