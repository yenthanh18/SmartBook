// analyticsService.js
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Initialization Check
export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('GA4 Measurement ID not found. Analytics disabled.');
    return false;
  }
  // If gtag exists globally (e.g. loaded via index.html), great.
  if (typeof window.gtag === 'function') {
    return true;
  }
  return false;
};

const pushEvent = (eventName, payload = {}) => {
  if (!initAnalytics()) {
    console.log(`[Analytics Mock] ${eventName}`, payload);
    return;
  }
  window.gtag('event', eventName, payload);
};

export const trackViewItem = (item) => {
  pushEvent('view_item', {
    currency: 'USD',
    value: item.price,
    items: [
      {
        item_id: item.product_id,
        item_name: item.title,
        item_category: item.category,
        price: item.price
      }
    ]
  });
};

export const trackSelectItem = (item, listName = 'General') => {
  pushEvent('select_item', {
    item_list_name: listName,
    items: [{
      item_id: item.product_id,
      item_name: item.title,
      price: item.price
    }]
  });
};

export const trackSearch = (searchTerm) => {
  pushEvent('search', {
    search_term: searchTerm
  });
};

export const trackViewItemList = (items, listName) => {
  pushEvent('view_item_list', {
    item_list_name: listName,
    items: items.map(item => ({
      item_id: item.product_id,
      item_name: item.title,
      price: item.price
    }))
  });
};

export const trackAddToCart = (item, quantity = 1) => {
  pushEvent('add_to_cart', {
    currency: 'USD',
    value: item.price * quantity,
    items: [{
      item_id: item.product_id,
      item_name: item.title,
      price: item.price,
      quantity
    }]
  });
};

export const trackViewCart = (items, totalValue) => {
  pushEvent('view_cart', {
    currency: 'USD',
    value: totalValue,
    items: items.map(item => ({
      item_id: item.product_id,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price
    }))
  });
};

export const trackBeginCheckout = (items, totalValue) => {
  pushEvent('begin_checkout', {
    currency: 'USD',
    value: totalValue,
    items: items.map(item => ({
      item_id: item.product_id,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price
    }))
  });
};

export const trackPurchaseDemo = (items, totalValue, transactionId) => {
  pushEvent('purchase_demo', {
    transaction_id: transactionId,
    value: totalValue,
    currency: 'USD',
    items: items.map(item => ({
      item_id: item.product_id,
      item_name: item.title,
      quantity: item.quantity,
      price: item.price
    }))
  });
};

export const trackSelectPromotion = (promotionName, items = []) => {
  pushEvent('select_promotion', {
    promotion_name: promotionName,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.title
    }))
  });
};

export const trackClickRecommendation = (item, source = 'automated') => {
  pushEvent('click_recommendation', {
    recommendation_source: source,
    item_id: item.id,
    item_name: item.title
  });
};

export const trackOpenChatbot = () => pushEvent('open_chatbot');
export const trackSendChatMessage = (msgType) => pushEvent('send_chat_message', { message_type: msgType });
export const trackChatbotRecommendationClick = (item) => {
  pushEvent('chatbot_recommendation_click', {
    item_id: item.id,
    item_name: item.title
  });
};
