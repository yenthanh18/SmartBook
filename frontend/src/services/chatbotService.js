import { apiClient, buildQueryString } from './apiClient';
import { getSessionId } from '../utils/session';

export const chatbotService = {
  getSessionHistory: () => apiClient(`/chatbot/session${buildQueryString({ session_id: getSessionId() })}`),
  
  sendMessage: (message) => apiClient('/chatbot', {
    method: 'POST',
    body: JSON.stringify({ session_id: getSessionId(), message })
  })
};
