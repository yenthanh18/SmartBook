# SmartBook AI Store API Contract (Updated)

## Base URL

```text
http://localhost:5000
```

When deployed on Render, replace with your public domain, for example:

```text
https://smartbook-ai-store.onrender.com
```

---

## Response format

All endpoints return JSON in this general format.

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": "Message here"
}
```

---

# 1. Home

## Endpoint

```http
GET /
```

## Purpose
Return API summary and available endpoints.

## Sample response

```json
{
  "success": true,
  "data": {
    "name": "SmartBook AI Store API",
    "version": "2.0.0",
    "status": "running",
    "total_books": 6071,
    "endpoints": {
      "health": "/api/health",
      "books": "/api/books",
      "book_detail": "/api/books/<product_id>",
      "categories": "/api/categories",
      "recommend": "/api/recommend?title=...",
      "same_author": "/api/author?title=...",
      "search": "/api/search?q=...",
      "trending": "/api/trending",
      "bestsellers": "/api/bestsellers",
      "deals": "/api/deals",
      "cart": "/api/cart?session_id=...",
      "checkout": "/api/checkout",
      "chatbot": "/api/chatbot"
    }
  }
}
```

---

# 2. Health Check

## Endpoint

```http
GET /api/health
```

## Purpose
Check whether dataset and AI files are loaded correctly.

## Sample response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "dataset_loaded": true,
    "vectorizer_loaded": true,
    "similarity_loaded": true,
    "total_books": 6071
  }
}
```

---

# 3. Categories

## Endpoint

```http
GET /api/categories
```

## Purpose
Return category list and book counts for menu and filter UI.

## Sample response

```json
{
  "success": true,
  "data": [
    {
      "category": "Fiction",
      "count": 4059
    },
    {
      "category": "Children & Young Adult",
      "count": 656
    },
    {
      "category": "Comics, Humor & Arts",
      "count": 349
    }
  ]
}
```

---

# 4. Book List

## Endpoint

```http
GET /api/books
```

## Purpose
Return paginated product cards for the shop page.

## Query parameters

| Parameter | Type | Required | Example | Description |
|---|---|---:|---|---|
| page | int | No | 1 | Page number |
| limit | int | No | 12 | Items per page |
| category | string | No | Fiction | Filter by category |
| author | string | No | Agatha Christie | Filter by author |
| q | string | No | wizard | Keyword search on title, author, category, description |
| min_price | float | No | 5 | Minimum final price |
| max_price | float | No | 20 | Maximum final price |
| min_rating | float | No | 4 | Minimum rating |
| featured | boolean | No | true | Only featured books |
| bestseller | boolean | No | true | Only bestseller books |
| on_sale | boolean | No | true | Only discounted books |
| in_stock | boolean | No | true | Exclude out of stock |
| sort_by | string | No | trending | trending, price_asc, price_desc, rating, newest, popular |

## Example request

```http
GET /api/books?page=1&limit=8&category=Fiction&min_rating=4&in_stock=true&sort_by=popular
```

## Sample response

```json
{
  "success": true,
  "data": [
    {
      "product_id": 102,
      "sku": "SB-000102",
      "title": "The Hobbit",
      "authors": "J.R.R. Tolkien",
      "category": "Fantasy & Science Fiction",
      "image_url": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1",
      "final_price": 14.99,
      "average_rating": 4.7,
      "availability_status": "in_stock",
      "is_bestseller": 1,
      "is_featured": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 8,
    "total_items": 120,
    "total_pages": 15,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "category": "Fiction",
    "author": null,
    "q": null,
    "featured": false,
    "bestseller": false,
    "on_sale": false,
    "in_stock": true,
    "sort_by": "popular",
    "min_price": null,
    "max_price": null,
    "min_rating": 4.0
  }
}
```

---

# 5. Book Detail

## Endpoint

```http
GET /api/books/<product_id>
```

## Purpose
Return full book detail for the product page.

## Example request

```http
GET /api/books/102
```

## Sample response

```json
{
  "success": true,
  "data": {
    "product_id": 102,
    "sku": "SB-000102",
    "isbn13": "9780618260300",
    "isbn10": "0618260307",
    "title": "The Hobbit",
    "subtitle": "There and Back Again",
    "authors": "J.R.R. Tolkien",
    "category": "Fantasy & Science Fiction",
    "raw_category": "Fantasy fiction",
    "description": "Bilbo Baggins is swept into a dangerous quest across Middle-earth...",
    "image_url": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1",
    "published_year": 1937,
    "average_rating": 4.7,
    "page_count": 320,
    "ratings_count": 265000,
    "price": 17.99,
    "discount_percent": 15,
    "final_price": 15.29,
    "currency": "USD",
    "stock_quantity": 11,
    "availability_status": "in_stock",
    "is_bestseller": 1,
    "is_featured": 1
  }
}
```

---

# 6. Similar Book Recommendation

## Endpoint

```http
GET /api/recommend
```

## Purpose
Return AI-based similar books for a given title.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| title | string | Yes | The Hobbit |
| top_n | int | No | 6 |

## Example request

```http
GET /api/recommend?title=The%20Hobbit&top_n=4
```

## Sample response

```json
{
  "success": true,
  "data": [
    {
      "product_id": 205,
      "sku": "SB-000205",
      "title": "The Fellowship of the Ring",
      "authors": "J.R.R. Tolkien",
      "category": "Fantasy & Science Fiction",
      "image_url": "https://books.google.com/books/content?id=ghi789&printsec=frontcover&img=1&zoom=1",
      "final_price": 16.99,
      "average_rating": 4.8,
      "availability_status": "in_stock",
      "is_bestseller": 1,
      "is_featured": 1
    }
  ],
  "query": {
    "title": "The Hobbit",
    "top_n": 4
  }
}
```

---

# 7. Same Author Recommendation

## Endpoint

```http
GET /api/author
```

## Purpose
Return books by the same author as the selected title.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| title | string | Yes | The Hobbit |
| top_n | int | No | 6 |

## Example request

```http
GET /api/author?title=The%20Hobbit&top_n=4
```

---

# 8. Semantic Search

## Endpoint

```http
GET /api/search
```

## Purpose
Return AI semantic search results based on natural language query.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| q | string | Yes | books about friendship and loss |
| top_n | int | No | 6 |

## Example request

```http
GET /api/search?q=books%20about%20magic%20and%20friendship&top_n=6
```

---

# 9. Trending Books

## Endpoint

```http
GET /api/trending
```

## Purpose
Return trending books based on rating and popularity.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| top_n | int | No | 10 |

---

# 10. Bestseller Books

## Endpoint

```http
GET /api/bestsellers
```

## Purpose
Return bestseller books based on `ratings_count` and bestseller flag.

---

# 11. Deal Books

## Endpoint

```http
GET /api/deals
```

## Purpose
Return discounted books for the deals section.

---

# 12. Cart Summary

## Endpoint

```http
GET /api/cart
```

## Purpose
Return the current cart state for a given session.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| session_id | string | No | user_001 |

## Example request

```http
GET /api/cart?session_id=user_001
```

## Sample response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product_id": 102,
        "sku": "SB-000102",
        "title": "The Hobbit",
        "authors": "J.R.R. Tolkien",
        "category": "Fantasy & Science Fiction",
        "image_url": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1",
        "unit_price": 15.29,
        "quantity": 2,
        "subtotal": 30.58,
        "availability_status": "in_stock"
      }
    ],
    "summary": {
      "total_items": 1,
      "total_quantity": 2,
      "subtotal": 30.58,
      "currency": "USD"
    }
  },
  "session_id": "user_001"
}
```

---

# 13. Add to Cart

## Endpoint

```http
POST /api/cart/add
```

## Purpose
Add one item to the cart or increase its quantity.

## Request body

```json
{
  "session_id": "user_001",
  "product_id": 102,
  "quantity": 1
}
```

## Sample response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "product_id": 102,
        "sku": "SB-000102",
        "title": "The Hobbit",
        "authors": "J.R.R. Tolkien",
        "category": "Fantasy & Science Fiction",
        "image_url": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1",
        "unit_price": 15.29,
        "quantity": 1,
        "subtotal": 15.29,
        "availability_status": "in_stock"
      }
    ],
    "summary": {
      "total_items": 1,
      "total_quantity": 1,
      "subtotal": 15.29,
      "currency": "USD"
    }
  },
  "message": "Book added to cart",
  "session_id": "user_001"
}
```

---

# 14. Update Cart Item

## Endpoint

```http
POST /api/cart/update
```

## Purpose
Update quantity of one cart item.

## Request body

```json
{
  "session_id": "user_001",
  "product_id": 102,
  "quantity": 3
}
```

---

# 15. Remove Cart Item

## Endpoint

```http
POST /api/cart/remove
```

## Purpose
Remove one item from cart.

## Request body

```json
{
  "session_id": "user_001",
  "product_id": 102
}
```

---

# 16. Clear Cart

## Endpoint

```http
POST /api/cart/clear
```

## Purpose
Remove all items from cart.

## Request body

```json
{
  "session_id": "user_001"
}
```

---

# 17. Checkout Summary

## Endpoint

```http
GET /api/checkout/summary
```

## Purpose
Return the current order summary before checkout.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| session_id | string | No | user_001 |

## Example request

```http
GET /api/checkout/summary?session_id=user_001
```

---

# 18. Checkout

## Endpoint

```http
POST /api/checkout
```

## Purpose
Submit a demo order and clear the cart after success.

## Request body

```json
{
  "session_id": "user_001",
  "customer_name": "Le Yen Thanh",
  "email": "thanh@example.com",
  "phone": "0123456789",
  "address": "Can Tho, Vietnam",
  "payment_method": "Cash on Delivery"
}
```

## Sample response

```json
{
  "success": true,
  "data": {
    "order_id": "ORD-7F21AB3C",
    "session_id": "user_001",
    "customer_name": "Le Yen Thanh",
    "email": "thanh@example.com",
    "phone": "0123456789",
    "address": "Can Tho, Vietnam",
    "payment_method": "Cash on Delivery",
    "items": [
      {
        "product_id": 102,
        "sku": "SB-000102",
        "title": "The Hobbit",
        "authors": "J.R.R. Tolkien",
        "category": "Fantasy & Science Fiction",
        "image_url": "https://books.google.com/books/content?id=abc123&printsec=frontcover&img=1&zoom=1",
        "unit_price": 15.29,
        "quantity": 1,
        "subtotal": 15.29,
        "availability_status": "in_stock"
      }
    ],
    "summary": {
      "total_items": 1,
      "total_quantity": 1,
      "subtotal": 15.29,
      "currency": "USD"
    },
    "status": "success",
    "created_at": "2026-03-22T10:30:00.000000"
  },
  "message": "Checkout completed successfully"
}
```

---

# 19. Chatbot Level 2

## Endpoint

```http
POST /api/chatbot
```

## Purpose
Support conversational book discovery with short-term preference memory.

The chatbot can understand:
- category intent
- price limit
- minimum rating
- bestseller request
- deal request
- same author request
- similar book request
- general semantic search

## Request body

```json
{
  "session_id": "chat_001",
  "message": "I want bestselling fantasy books under 15 dollars"
}
```

## Sample response

```json
{
  "success": true,
  "data": {
    "reply": "Here are some books in Fantasy & Science Fiction under $15.00 that are bestsellers.",
    "intent": "search_filtered_books",
    "filters": {
      "category": "Fantasy & Science Fiction",
      "max_price": 15.0,
      "bestseller": true
    },
    "books": [
      {
        "product_id": 205,
        "sku": "SB-000205",
        "title": "The Fellowship of the Ring",
        "authors": "J.R.R. Tolkien",
        "category": "Fantasy & Science Fiction",
        "image_url": "https://books.google.com/books/content?id=ghi789&printsec=frontcover&img=1&zoom=1",
        "final_price": 14.99,
        "average_rating": 4.8,
        "availability_status": "in_stock",
        "is_bestseller": 1,
        "is_featured": 1
      }
    ],
    "follow_up": "You can also tell me your budget, like under 15 dollars.",
    "session_id": "chat_001"
  }
}
```

---

# 20. Chatbot Session State

## Endpoint

```http
GET /api/chatbot/session
```

## Purpose
Return saved chatbot preferences and conversation history for one session.

## Query parameters

| Parameter | Type | Required | Example |
|---|---|---:|---|
| session_id | string | No | chat_001 |

---

# 21. Frontend integration notes

## Recommended homepage sections and matching endpoints

| UI Section | Endpoint |
|---|---|
| Hero search bar | `/api/search?q=...` |
| Featured books | `/api/books?featured=true&limit=8` |
| Bestsellers | `/api/bestsellers?top_n=8` |
| Deals | `/api/deals?top_n=8` |
| Trending now | `/api/trending?top_n=8` |
| Category menu | `/api/categories` |
| Shop page grid | `/api/books?page=1&limit=12` |
| Product detail | `/api/books/<product_id>` |
| Similar books | `/api/recommend?title=...` |
| Same author | `/api/author?title=...` |
| Cart page | `/api/cart?session_id=...` |
| Add to Cart button | `/api/cart/add` |
| Checkout page | `/api/checkout/summary?session_id=...` |
| Place Order button | `/api/checkout` |
| Floating chatbot | `/api/chatbot` |

---

# 22. Suggested Google Analytics events

| Event | Trigger |
|---|---|
| `view_item` | User opens product detail page |
| `select_item` | User clicks a product card |
| `search` | User submits search query |
| `view_item_list` | User opens category/shop page |
| `add_to_cart` | User clicks Add to Cart |
| `view_cart` | User opens cart page |
| `begin_checkout` | User opens checkout page |
| `purchase_demo` | User clicks Place Order in demo checkout |
| `select_promotion` | User clicks Deals banner |
| `click_recommendation` | User clicks a recommended book |
| `open_chatbot` | User opens the chatbot widget |
| `send_chat_message` | User sends chatbot message |
| `chatbot_recommendation_click` | User clicks a book from chatbot results |

---

# 23. Notes for Stitch / Antigravity

Use these response shapes when prompting UI/code generation tools.

## Product card data shape

```json
{
  "product_id": 102,
  "sku": "SB-000102",
  "title": "The Hobbit",
  "authors": "J.R.R. Tolkien",
  "category": "Fantasy & Science Fiction",
  "image_url": "https://...",
  "final_price": 15.29,
  "average_rating": 4.7,
  "availability_status": "in_stock",
  "is_bestseller": 1,
  "is_featured": 1
}
```

## Cart item data shape

```json
{
  "product_id": 102,
  "sku": "SB-000102",
  "title": "The Hobbit",
  "authors": "J.R.R. Tolkien",
  "category": "Fantasy & Science Fiction",
  "image_url": "https://...",
  "unit_price": 15.29,
  "quantity": 2,
  "subtotal": 30.58,
  "availability_status": "in_stock"
}
```

## Chatbot response data shape

```json
{
  "reply": "Here are some books in Fantasy & Science Fiction under $15.00 that are bestsellers.",
  "intent": "search_filtered_books",
  "filters": {
    "category": "Fantasy & Science Fiction",
    "max_price": 15.0,
    "bestseller": true
  },
  "books": [],
  "follow_up": "You can also tell me your budget, like under 15 dollars.",
  "session_id": "chat_001"
}
```

## Checkout response data shape

```json
{
  "order_id": "ORD-7F21AB3C",
  "session_id": "user_001",
  "customer_name": "Le Yen Thanh",
  "email": "thanh@example.com",
  "phone": "0123456789",
  "address": "Can Tho, Vietnam",
  "payment_method": "Cash on Delivery",
  "items": [],
  "summary": {
    "total_items": 1,
    "total_quantity": 1,
    "subtotal": 15.29,
    "currency": "USD"
  },
  "status": "success",
  "created_at": "2026-03-22T10:30:00.000000"
}
```

