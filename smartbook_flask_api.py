from __future__ import annotations

import logging
import os
import pickle
import re
import uuid
from datetime import date, datetime
from decimal import Decimal
from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity

# ======================================================
# SMARTBOOK AI STORE - FLASK API v3 (PRODUCTION-READY MVP)
# ======================================================
# Features:
# - Health check
# - Book listing with filters and pagination
# - Single book detail
# - Similar book recommendation
# - Same author recommendation
# - Semantic search
# - Trending / bestseller / deals
# - Cart API
# - Checkout API (demo)
# - Chatbot API with session preferences
# - Safer JSON serialization
# - Resource validation
# - Lazy TF-IDF matrix initialization
# ======================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "smartbook_catalog.csv")
VECTORIZER_FILE = os.path.join(BASE_DIR, "models", "vectorizer.pkl")
SIMILARITY_FILE = os.path.join(BASE_DIR, "models", "similarity.npy")

DEFAULT_PAGE = 1
DEFAULT_LIMIT = 12
MAX_LIMIT = 50
DEFAULT_TOP_N = 6
DEFAULT_CHATBOT_TOP_N = 5
DEFAULT_CURRENCY = "USD"
MAX_CART_QTY_PER_ITEM = 10


# ======================================================
# APP / LOGGING
# ======================================================
app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("smartbook_api_v3")

# In-memory demo stores
cart_store: dict[str, list[dict[str, Any]]] = {}
chat_sessions: dict[str, dict[str, Any]] = {}
orders_store: list[dict[str, Any]] = []

# Startup state
startup_error: str | None = None
df = pd.DataFrame()
tfidf: Any = None
similarity: np.ndarray | None = None


# ======================================================
# HELPERS
# ======================================================
def parse_int(value: str | None, default: int, minimum: int | None = None, maximum: int | None = None) -> int:
    try:
        parsed = int(value) if value is not None else default
    except (TypeError, ValueError):
        parsed = default

    if minimum is not None:
        parsed = max(parsed, minimum)
    if maximum is not None:
        parsed = min(parsed, maximum)
    return parsed



def parse_float(value: str | None) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None



def parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return None



def normalize_text(text: str) -> str:
    text = str(text).lower().strip()
    text = re.sub(r"\s+", " ", text)
    return text



def is_missing_scalar(val: Any) -> bool:
    try:
        result = pd.isna(val)
    except Exception:
        return False
    return isinstance(result, (bool, np.bool_)) and bool(result)



def sanitize_value(val: Any) -> Any:
    """Recursively convert pandas/numpy/other special values to JSON-safe Python types."""
    if isinstance(val, dict):
        return {str(k): sanitize_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize_value(v) for v in val]
    if isinstance(val, tuple):
        return [sanitize_value(v) for v in val]
    if isinstance(val, set):
        return [sanitize_value(v) for v in val]
    if isinstance(val, np.ndarray):
        return [sanitize_value(v) for v in val.tolist()]
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        if np.isnan(val) or np.isinf(val):
            return None
        return float(val)
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, pd.Timestamp):
        return val.isoformat()
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, pd.Series):
        return {str(k): sanitize_value(v) for k, v in val.to_dict().items()}
    if val is None:
        return None
    if is_missing_scalar(val):
        return None
    return val



def ok(data: Any, status_code: int = 200, **meta: Any):
    payload = {"success": True, "data": sanitize_value(data)}
    if meta:
        payload.update(sanitize_value(meta))
    return jsonify(payload), status_code



def error_response(message: str, status_code: int = 400, **extra: Any):
    payload = {"success": False, "error": message}
    if extra:
        payload.update(sanitize_value(extra))
    return jsonify(payload), status_code



def require_ready() -> str | None:
    return startup_error


BOOK_CARD_FIELDS = [
    "product_id",
    "sku",
    "title",
    "authors",
    "category",
    "image_url",
    "final_price",
    "average_rating",
    "availability_status",
    "is_bestseller",
    "is_featured",
]

BOOK_DETAIL_FIELDS = [
    "product_id",
    "sku",
    "isbn13",
    "isbn10",
    "title",
    "subtitle",
    "authors",
    "category",
    "raw_category",
    "description",
    "image_url",
    "published_year",
    "average_rating",
    "page_count",
    "ratings_count",
    "price",
    "discount_percent",
    "final_price",
    "currency",
    "stock_quantity",
    "availability_status",
    "is_bestseller",
    "is_featured",
]



def frame_to_records(frame: pd.DataFrame, fields: list[str] | None = None) -> list[dict[str, Any]]:
    if fields:
        existing = [c for c in fields if c in frame.columns]
        frame = frame[existing]
    return sanitize_value(frame.to_dict(orient="records"))



def one_record(series: pd.Series, fields: list[str] | None = None) -> dict[str, Any]:
    if fields:
        data = {k: series.get(k, None) for k in fields}
    else:
        data = series.to_dict()
    return sanitize_value(data)


# ======================================================
# DATA LOADING / VALIDATION
# ======================================================
def load_dataframe() -> pd.DataFrame:
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Missing file: {DATA_FILE}")

    frame = pd.read_csv(DATA_FILE)

    defaults = {
        "product_id": lambda f: f.index + 1,
        "sku": "",
        "title": "",
        "authors": "",
        "category": "",
        "image_url": frame["thumbnail"] if "thumbnail" in frame.columns else "",
        "final_price": frame["price"] if "price" in frame.columns else 0.0,
        "average_rating": 0.0,
        "ratings_count": 0,
        "availability_status": "in_stock",
        "is_bestseller": 0,
        "is_featured": 0,
        "currency": DEFAULT_CURRENCY,
        "ai_text": "",
    }
    for col, default in defaults.items():
        if col not in frame.columns:
            frame[col] = default(frame) if callable(default) else default

    numeric_cols = [
        "product_id",
        "published_year",
        "average_rating",
        "page_count",
        "ratings_count",
        "price",
        "discount_percent",
        "final_price",
        "stock_quantity",
        "is_bestseller",
        "is_featured",
    ]
    for col in numeric_cols:
        if col in frame.columns:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")

    text_cols = [
        "sku",
        "isbn13",
        "isbn10",
        "title",
        "subtitle",
        "authors",
        "category",
        "raw_category",
        "description",
        "image_url",
        "currency",
        "availability_status",
        "ai_text",
    ]
    for col in text_cols:
        if col in frame.columns:
            frame[col] = frame[col].fillna("").astype(str)

    if "product_id" in frame.columns:
        frame = frame.dropna(subset=["product_id"]).copy()
        frame["product_id"] = frame["product_id"].astype(int)
        frame = frame.drop_duplicates(subset=["product_id"], keep="first").reset_index(drop=True)

    return frame



def load_vectorizer() -> Any:
    if not os.path.exists(VECTORIZER_FILE):
        raise FileNotFoundError(f"Missing file: {VECTORIZER_FILE}")
    with open(VECTORIZER_FILE, "rb") as f:
        return pickle.load(f)



def load_similarity() -> np.ndarray:
    if not os.path.exists(SIMILARITY_FILE):
        raise FileNotFoundError(f"Missing file: {SIMILARITY_FILE}")
    matrix = np.load(SIMILARITY_FILE)
    if not isinstance(matrix, np.ndarray):
        raise ValueError("Similarity file is not a valid NumPy array")
    if matrix.ndim != 2:
        raise ValueError("Similarity matrix must be 2-dimensional")
    return matrix



def validate_resources(frame: pd.DataFrame, sim: np.ndarray | None) -> None:
    if frame.empty:
        raise ValueError("Dataset is empty")
    if sim is not None and (sim.shape[0] != len(frame) or sim.shape[1] != len(frame)):
        raise ValueError(
            f"Similarity matrix mismatch dataset: dataset={len(frame)}, similarity_shape={sim.shape}"
        )



def initialize_resources():
    global df, vectorizer, similarity

    print("Loading dataset...")
    df = pd.read_csv(DATA_FILE)

    # ===== VECTOR LOADER =====
    if not os.path.exists(VECTORIZER_FILE):
        print("Vectorizer missing → rebuilding AI artifacts...")
        os.system("python smartbook_ai_pipeline.py")

    print("Loading vectorizer...")
    with open(VECTORIZER_FILE, "rb") as f:
        vectorizer = pickle.load(f)

    # ===== SIMILARITY LOADER =====
    if not os.path.exists(SIMILARITY_FILE):
        print("Similarity matrix missing → rebuilding AI artifacts...")
        os.system("python smartbook_ai_pipeline.py")

    print("Loading similarity matrix...")
    similarity = np.load(SIMILARITY_FILE)

    print("AI resources ready.")


@lru_cache(maxsize=1)
def get_tfidf_matrix():
    if tfidf is None:
        raise RuntimeError("Vectorizer is not loaded")
    if df.empty:
        raise RuntimeError("Dataset is empty")
    if "ai_text" not in df.columns:
        raise RuntimeError("Dataset missing ai_text column")
    logger.info("Building TF-IDF matrix lazily for %s books", len(df))
    return tfidf.transform(df["ai_text"].fillna(""))


initialize_resources()


# ======================================================
# CORE BOOK LOGIC
# ======================================================
def get_book_by_id(product_id: int) -> pd.Series | None:
    matched = df[df["product_id"] == product_id]
    if matched.empty:
        return None
    return matched.iloc[0]



def get_book_by_title(title: str) -> pd.Series | None:
    title_norm = normalize_text(title)
    matched = df[df["title"].str.lower().str.strip() == title_norm]
    if matched.empty:
        return None
    return matched.iloc[0]



def recommend_by_title(title: str, top_n: int = DEFAULT_TOP_N) -> pd.DataFrame:
    if similarity is None or df.empty:
        return pd.DataFrame()

    matched = df[df["title"].str.lower().str.strip() == normalize_text(title)]
    if matched.empty:
        return pd.DataFrame()

    idx = matched.index[0]
    if idx >= similarity.shape[0]:
        logger.warning("Recommendation skipped: index %s out of bounds for similarity", idx)
        return pd.DataFrame()

    scores = list(enumerate(similarity[idx]))
    scores.sort(key=lambda x: x[1], reverse=True)

    selected_indices: list[int] = []
    for i, _score in scores[1:]:
        if len(selected_indices) >= top_n:
            break
        if i != idx and i < len(df):
            selected_indices.append(i)

    return df.iloc[selected_indices].copy() if selected_indices else pd.DataFrame()



def same_author_by_title(title: str, top_n: int = DEFAULT_TOP_N) -> pd.DataFrame:
    book = get_book_by_title(title)
    if book is None or "authors" not in df.columns:
        return pd.DataFrame()

    same_author = df[df["authors"] == book.get("authors", "")].copy()
    same_author = same_author[same_author["title"].str.lower().str.strip() != normalize_text(title)]

    if same_author.empty:
        return pd.DataFrame()

    sort_cols = [c for c in ["average_rating", "ratings_count"] if c in same_author.columns]
    if sort_cols:
        same_author = same_author.sort_values(by=sort_cols, ascending=[False] * len(sort_cols))
    return same_author.head(top_n)



def get_trending(top_n: int = 10) -> pd.DataFrame:
    temp = df.copy()
    avg_r = temp["average_rating"] if "average_rating" in temp.columns else 0
    rating_c = temp["ratings_count"] if "ratings_count" in temp.columns else 0
    temp["trend_score"] = avg_r * np.log1p(rating_c + 1)
    return temp.sort_values(by="trend_score", ascending=False).head(top_n)



def get_bestsellers(top_n: int = 10) -> pd.DataFrame:
    temp = df[df["is_bestseller"] == 1].copy() if "is_bestseller" in df.columns else df.copy()
    if temp.empty:
        temp = df.copy()
    sort_cols = [c for c in ["ratings_count", "average_rating"] if c in temp.columns]
    if sort_cols:
        temp = temp.sort_values(by=sort_cols, ascending=[False] * len(sort_cols))
    return temp.head(top_n)



def get_deals(top_n: int = 10) -> pd.DataFrame:
    if "discount_percent" not in df.columns:
        return pd.DataFrame()
    temp = df[df["discount_percent"] > 0].copy()
    if temp.empty:
        return temp
    sort_cols = [c for c in ["discount_percent", "average_rating"] if c in temp.columns]
    if sort_cols:
        temp = temp.sort_values(by=sort_cols, ascending=[False] * len(sort_cols))
    return temp.head(top_n)



def semantic_search_books(query: str, top_n: int = DEFAULT_TOP_N) -> pd.DataFrame:
    query = query.strip()
    if not query or tfidf is None:
        return pd.DataFrame()

    matrix = get_tfidf_matrix()
    query_vec = tfidf.transform([query])
    scores = cosine_similarity(query_vec, matrix).flatten()
    top_idx = scores.argsort()[-top_n:][::-1]
    return df.iloc[top_idx].copy() if len(top_idx) else pd.DataFrame()



def filter_books_frame(
    category: str | None = None,
    author: str | None = None,
    keyword: str | None = None,
    featured: bool | None = None,
    bestseller: bool | None = None,
    on_sale: bool | None = None,
    in_stock: bool | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    sort_by: str = "trending",
    limit: int | None = None,
) -> pd.DataFrame:
    filtered = df.copy()

    if category and "category" in filtered.columns:
        filtered = filtered[filtered["category"].str.lower() == category.lower()]

    if author and "authors" in filtered.columns:
        filtered = filtered[filtered["authors"].str.contains(author, case=False, na=False)]

    if keyword:
        cols_to_search = [col for col in ["title", "authors", "category", "description"] if col in filtered.columns]
        if cols_to_search:
            mask = pd.Series(False, index=filtered.index)
            for col in cols_to_search:
                mask = mask | filtered[col].str.contains(keyword, case=False, na=False)
            filtered = filtered[mask]

    if min_price is not None and "final_price" in filtered.columns:
        filtered = filtered[filtered["final_price"] >= min_price]
    if max_price is not None and "final_price" in filtered.columns:
        filtered = filtered[filtered["final_price"] <= max_price]
    if min_rating is not None and "average_rating" in filtered.columns:
        filtered = filtered[filtered["average_rating"] >= min_rating]

    if featured is True and "is_featured" in filtered.columns:
        filtered = filtered[filtered["is_featured"] == 1]
    if bestseller is True and "is_bestseller" in filtered.columns:
        filtered = filtered[filtered["is_bestseller"] == 1]
    if on_sale is True and "discount_percent" in filtered.columns:
        filtered = filtered[filtered["discount_percent"] > 0]
    if in_stock is True and "availability_status" in filtered.columns:
        filtered = filtered[filtered["availability_status"].str.lower() != "out_of_stock"]

    if sort_by == "price_asc" and "final_price" in filtered.columns:
        filtered = filtered.sort_values(by="final_price", ascending=True)
    elif sort_by == "price_desc" and "final_price" in filtered.columns:
        filtered = filtered.sort_values(by="final_price", ascending=False)
    elif sort_by == "rating":
        sort_cols = [c for c in ["average_rating", "ratings_count"] if c in filtered.columns]
        if sort_cols:
            filtered = filtered.sort_values(by=sort_cols, ascending=[False] * len(sort_cols))
    elif sort_by == "newest" and "published_year" in filtered.columns:
        filtered = filtered.sort_values(by="published_year", ascending=False)
    elif sort_by == "popular" and "ratings_count" in filtered.columns:
        filtered = filtered.sort_values(by="ratings_count", ascending=False)
    else:
        temp = filtered.copy()
        avg_r = temp["average_rating"] if "average_rating" in temp.columns else 0
        rating_c = temp["ratings_count"] if "ratings_count" in temp.columns else 0
        temp["trend_score"] = avg_r * np.log1p(rating_c + 1)
        filtered = temp.sort_values(by="trend_score", ascending=False).drop(columns=["trend_score"], errors="ignore")

    if limit is not None:
        filtered = filtered.head(limit)

    return filtered



def filter_books_from_request() -> tuple[pd.DataFrame, dict[str, Any]]:
    category = request.args.get("category", "").strip()
    author = request.args.get("author", "").strip()
    q = request.args.get("q", "").strip()
    sort_by = request.args.get("sort_by", "trending").strip().lower()

    featured = parse_bool(request.args.get("featured"))
    bestseller = parse_bool(request.args.get("bestseller"))
    on_sale = parse_bool(request.args.get("on_sale"))
    in_stock = parse_bool(request.args.get("in_stock"))

    min_price = parse_float(request.args.get("min_price"))
    max_price = parse_float(request.args.get("max_price"))
    min_rating = parse_float(request.args.get("min_rating"))

    filtered = filter_books_frame(
        category=category or None,
        author=author or None,
        keyword=q or None,
        featured=featured,
        bestseller=bestseller,
        on_sale=on_sale,
        in_stock=in_stock,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        sort_by=sort_by,
    )

    meta = {
        "filters": {
            "category": category or None,
            "author": author or None,
            "q": q or None,
            "featured": featured,
            "bestseller": bestseller,
            "on_sale": on_sale,
            "in_stock": in_stock,
            "sort_by": sort_by,
            "min_price": min_price,
            "max_price": max_price,
            "min_rating": min_rating,
        }
    }
    return filtered, meta


# ======================================================
# CART / CHECKOUT
# ======================================================
def build_cart_item(book: pd.Series, quantity: int) -> dict[str, Any]:
    final_price = float(book["final_price"]) if not is_missing_scalar(book.get("final_price")) else 0.0
    item = {
        "product_id": int(book["product_id"]),
        "sku": str(book.get("sku", "")),
        "title": str(book.get("title", "")),
        "authors": str(book.get("authors", "")),
        "category": str(book.get("category", "")),
        "image_url": str(book.get("image_url", "")),
        "unit_price": round(final_price, 2),
        "quantity": int(quantity),
        "subtotal": round(final_price * quantity, 2),
        "availability_status": str(book.get("availability_status", "in_stock")),
        "currency": str(book.get("currency", DEFAULT_CURRENCY)) or DEFAULT_CURRENCY,
    }
    return sanitize_value(item)



def get_or_create_cart(session_id: str) -> list[dict[str, Any]]:
    if session_id not in cart_store:
        cart_store[session_id] = []
    return cart_store[session_id]



def summarize_cart(items: list[dict[str, Any]]) -> dict[str, Any]:
    total_quantity = sum(int(item["quantity"]) for item in items)
    subtotal = round(sum(float(item["subtotal"]) for item in items), 2)
    currency = items[0].get("currency", DEFAULT_CURRENCY) if items else DEFAULT_CURRENCY
    return sanitize_value(
        {
            "items": items,
            "summary": {
                "total_items": len(items),
                "total_quantity": total_quantity,
                "subtotal": subtotal,
                "currency": currency,
            },
        }
    )


# ======================================================
# CHATBOT
# ======================================================
CATEGORY_KEYWORDS = {
    "Fantasy & Science Fiction": ["fantasy", "magic", "wizard", "dragon", "sci-fi", "science fiction", "space"],
    "Mystery & Thriller": ["mystery", "thriller", "crime", "detective", "murder", "suspense"],
    "Romance": ["romance", "love", "relationship", "romantic"],
    "Horror & Supernatural": ["horror", "ghost", "vampire", "supernatural", "scary"],
    "Historical & War": ["historical", "war", "history", "world war"],
    "Business & Self-Help": ["business", "self-help", "leadership", "finance", "motivation", "productivity"],
    "Technology & Science": ["technology", "computer", "programming", "science", "physics", "math"],
    "Psychology & Social Sciences": ["psychology", "social", "behavior", "mental", "mind"],
    "Religion & Spirituality": ["religion", "spiritual", "christian", "bible", "meditation"],
    "Children & Young Adult": ["children", "kids", "young adult", "ya", "teen"],
    "Comics, Humor & Arts": ["comic", "graphic novel", "humor", "art", "music"],
    "Fiction": ["fiction", "novel", "literary"],
}



def get_or_create_chat_session(session_id: str) -> dict[str, Any]:
    if session_id not in chat_sessions:
        chat_sessions[session_id] = {
            "preferences": {},
            "history": [],
            "last_updated": datetime.utcnow().isoformat(),
        }
    return chat_sessions[session_id]



def detect_category(message: str) -> str | None:
    msg = normalize_text(message)
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in msg for keyword in keywords):
            return category
    return None



def extract_price_limit(message: str) -> float | None:
    msg = normalize_text(message)
    patterns = [
        r"under\s*\$?(\d+(?:\.\d+)?)",
        r"below\s*\$?(\d+(?:\.\d+)?)",
        r"less than\s*\$?(\d+(?:\.\d+)?)",
        r"cheap(?:er)?\s*than\s*\$?(\d+(?:\.\d+)?)",
        r"\$\s*(\d+(?:\.\d+)?)",
    ]
    for pattern in patterns:
        match = re.search(pattern, msg)
        if match:
            return float(match.group(1))
    return None



def extract_min_rating(message: str) -> float | None:
    msg = normalize_text(message)
    patterns = [
        r"rated\s*(\d(?:\.\d)?)",
        r"rating\s*(\d(?:\.\d)?)",
        r"above\s*(\d(?:\.\d)?)\s*stars?",
        r"at least\s*(\d(?:\.\d)?)\s*stars?",
    ]
    for pattern in patterns:
        match = re.search(pattern, msg)
        if match:
            return float(match.group(1))
    return None



def detect_bestseller_flag(message: str) -> bool:
    msg = normalize_text(message)
    return any(x in msg for x in ["bestseller", "best seller", "popular", "top rated", "trending"])



def detect_sale_flag(message: str) -> bool:
    msg = normalize_text(message)
    return any(x in msg for x in ["deal", "discount", "sale", "cheap", "affordable"])



def detect_same_author_intent(message: str) -> bool:
    msg = normalize_text(message)
    return any(x in msg for x in ["same author", "by the same author", "more books by"])



def detect_recommend_intent(message: str) -> bool:
    msg = normalize_text(message)
    return any(x in msg for x in ["recommend", "suggest", "similar to", "like this book"])



def extract_quoted_title(message: str) -> str | None:
    patterns = [r'"([^"]+)"', r"'([^']+)'"]
    for pattern in patterns:
        match = re.search(pattern, message)
        if match:
            return match.group(1).strip()
    return None



def parse_chatbot_intent(message: str, session: dict[str, Any]) -> dict[str, Any]:
    msg = normalize_text(message)
    preferences = session.get("preferences", {})

    detected_category = detect_category(msg) or preferences.get("category")
    detected_max_price = extract_price_limit(msg)
    detected_min_rating = extract_min_rating(msg)
    bestseller = detect_bestseller_flag(msg)
    on_sale = detect_sale_flag(msg)
    same_author = detect_same_author_intent(msg)
    recommend = detect_recommend_intent(msg)
    title = extract_quoted_title(message)

    if detected_category:
        preferences["category"] = detected_category
    if detected_max_price is not None:
        preferences["max_price"] = detected_max_price
    if detected_min_rating is not None:
        preferences["min_rating"] = detected_min_rating
    if bestseller:
        preferences["bestseller"] = True
    if on_sale:
        preferences["on_sale"] = True

    session["preferences"] = preferences
    session["last_updated"] = datetime.utcnow().isoformat()

    if same_author and title:
        return {"intent": "same_author", "title": title, "preferences": preferences}
    if recommend and title:
        return {"intent": "recommend_by_title", "title": title, "preferences": preferences}
    if detected_category or detected_max_price is not None or detected_min_rating is not None or bestseller or on_sale:
        return {"intent": "search_filtered_books", "preferences": preferences}
    return {"intent": "semantic_search", "query": message.strip(), "preferences": preferences}



def chatbot_reply(message: str, session_id: str) -> dict[str, Any]:
    session = get_or_create_chat_session(session_id)
    parsed = parse_chatbot_intent(message, session)
    intent = parsed["intent"]
    preferences = parsed.get("preferences", {})

    books = pd.DataFrame()
    reply = ""

    if intent == "same_author":
        title = parsed["title"]
        books = same_author_by_title(title, top_n=DEFAULT_CHATBOT_TOP_N)
        reply = (
            f"Here are some books by the same author as '{title}'."
            if not books.empty
            else f"I couldn't find more books by the same author for '{title}'."
        )

    elif intent == "recommend_by_title":
        title = parsed["title"]
        books = recommend_by_title(title, top_n=DEFAULT_CHATBOT_TOP_N)
        reply = (
            f"Here are some books similar to '{title}'."
            if not books.empty
            else f"I couldn't find similar books for '{title}'."
        )

    elif intent == "search_filtered_books":
        books = filter_books_frame(
            category=preferences.get("category"),
            max_price=preferences.get("max_price"),
            min_rating=preferences.get("min_rating"),
            bestseller=preferences.get("bestseller"),
            on_sale=preferences.get("on_sale"),
            in_stock=True,
            sort_by="trending",
            limit=DEFAULT_CHATBOT_TOP_N,
        )

        parts = ["Here are some books"]
        if preferences.get("category"):
            parts.append(f"in {preferences['category']}")
        if preferences.get("max_price") is not None:
            parts.append(f"under ${preferences['max_price']:.2f}")
        if preferences.get("min_rating") is not None:
            parts.append(f"with rating above {preferences['min_rating']}")
        if preferences.get("bestseller"):
            parts.append("that are bestsellers")
        if preferences.get("on_sale"):
            parts.append("currently on sale")
        reply = " ".join(parts) + "."

        if books.empty:
            reply = "I couldn't find books that match those preferences. You can try a broader category or a higher price range."

    else:
        query = parsed.get("query", message)
        books = semantic_search_books(query, top_n=DEFAULT_CHATBOT_TOP_N)
        reply = (
            "Here are some books you may like based on your request."
            if not books.empty
            else "I couldn't find relevant books for that request."
        )

    session["history"].append(
        {
            "user_message": message,
            "intent": intent,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

    follow_up = None
    if intent == "search_filtered_books" and books.empty:
        follow_up = "Try asking something like: fantasy books under 15 dollars, bestselling business books, or mystery books rated above 4 stars."
    elif intent == "semantic_search":
        follow_up = "You can refine your search by category, price, or rating."
    elif intent == "search_filtered_books" and not preferences.get("max_price"):
        follow_up = "You can also tell me your budget, like under 15 dollars."

    return sanitize_value(
        {
            "reply": reply,
            "intent": intent,
            "filters": preferences,
            "books": frame_to_records(books, BOOK_CARD_FIELDS),
            "follow_up": follow_up,
            "session_id": session_id,
        }
    )


# ======================================================
# ROUTES
# ======================================================
@app.before_request
def fail_fast_if_not_ready():
    if request.path in {"/", "/api/health"}:
        return None
    if require_ready():
        return error_response(f"API startup failed: {startup_error}", 500)
    return None


@app.get("/")
def home():
    if startup_error:
        return error_response(f"API startup failed: {startup_error}", 500)
    return ok(
        {
            "name": "SmartBook AI Store API",
            "version": "3.0.0",
            "status": "running",
            "total_books": int(len(df)),
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
                "chatbot": "/api/chatbot",
            },
        }
    )


@app.get("/api/health")
def health_check():
    if startup_error:
        return error_response(
            startup_error,
            500,
            status="unhealthy",
            dataset_loaded=False,
            vectorizer_loaded=False,
            similarity_loaded=False,
        )
    return ok(
        {
            "status": "healthy",
            "dataset_loaded": True,
            "vectorizer_loaded": tfidf is not None,
            "similarity_loaded": similarity is not None,
            "total_books": int(len(df)),
        }
    )


@app.get("/api/categories")
def categories():
    counts = df["category"].value_counts().reset_index()
    counts.columns = ["category", "count"]
    return ok(frame_to_records(counts))


@app.get("/api/books")
def list_books():
    filtered, meta = filter_books_from_request()
    page = parse_int(request.args.get("page"), DEFAULT_PAGE, minimum=1)
    limit = parse_int(request.args.get("limit"), DEFAULT_LIMIT, minimum=1, maximum=MAX_LIMIT)

    total_items = int(len(filtered))
    total_pages = max((total_items + limit - 1) // limit, 1)
    start = (page - 1) * limit
    end = start + limit
    paged = filtered.iloc[start:end]

    return ok(
        frame_to_records(paged, BOOK_CARD_FIELDS),
        pagination={
            "page": page,
            "limit": limit,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        **meta,
    )


@app.get("/api/books/<int:product_id>")
def book_detail(product_id: int):
    book = get_book_by_id(product_id)
    if book is None:
        return error_response("Book not found", 404)
    return ok(one_record(book, BOOK_DETAIL_FIELDS))


@app.get("/api/recommend")
def recommend_route():
    title = request.args.get("title", "").strip()
    top_n = parse_int(request.args.get("top_n"), DEFAULT_TOP_N, minimum=1, maximum=20)
    if not title:
        return error_response("Missing required query parameter: title")
    results = recommend_by_title(title, top_n=top_n)
    if results.empty:
        return error_response("No recommendations found for the given title", 404)
    return ok(frame_to_records(results, BOOK_CARD_FIELDS), query={"title": title, "top_n": top_n})


@app.get("/api/author")
def same_author_route():
    title = request.args.get("title", "").strip()
    top_n = parse_int(request.args.get("top_n"), DEFAULT_TOP_N, minimum=1, maximum=20)
    if not title:
        return error_response("Missing required query parameter: title")
    results = same_author_by_title(title, top_n=top_n)
    if results.empty:
        return error_response("No same-author books found for the given title", 404)
    return ok(frame_to_records(results, BOOK_CARD_FIELDS), query={"title": title, "top_n": top_n})


@app.get("/api/search")
def search_route():
    query = request.args.get("q", "").strip()
    top_n = parse_int(request.args.get("top_n"), DEFAULT_TOP_N, minimum=1, maximum=20)
    if not query:
        return error_response("Missing required query parameter: q")
    results = semantic_search_books(query, top_n=top_n)
    if results.empty:
        return error_response("No search results found", 404)
    return ok(frame_to_records(results, BOOK_CARD_FIELDS), query={"q": query, "top_n": top_n})


@app.get("/api/trending")
def trending_route():
    top_n = parse_int(request.args.get("top_n"), 10, minimum=1, maximum=20)
    return ok(frame_to_records(get_trending(top_n=top_n), BOOK_CARD_FIELDS), query={"top_n": top_n})


@app.get("/api/bestsellers")
def bestsellers_route():
    top_n = parse_int(request.args.get("top_n"), 10, minimum=1, maximum=20)
    return ok(frame_to_records(get_bestsellers(top_n=top_n), BOOK_CARD_FIELDS), query={"top_n": top_n})


@app.get("/api/deals")
def deals_route():
    top_n = parse_int(request.args.get("top_n"), 10, minimum=1, maximum=20)
    return ok(frame_to_records(get_deals(top_n=top_n), BOOK_CARD_FIELDS), query={"top_n": top_n})


@app.get("/api/cart")
def get_cart():
    session_id = request.args.get("session_id", "guest").strip() or "guest"
    items = get_or_create_cart(session_id)
    return ok(summarize_cart(items), session_id=session_id)


@app.post("/api/cart/add")
def add_to_cart():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "guest")).strip() or "guest"
    product_id = payload.get("product_id")
    quantity = parse_int(str(payload.get("quantity", 1)), 1, minimum=1, maximum=MAX_CART_QTY_PER_ITEM)

    if product_id is None:
        return error_response("Missing required field: product_id")
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return error_response("product_id must be an integer")

    book = get_book_by_id(product_id)
    if book is None:
        return error_response("Book not found", 404)

    cart = get_or_create_cart(session_id)
    existing = next((item for item in cart if item["product_id"] == product_id), None)
    if existing:
        existing["quantity"] = min(int(existing["quantity"]) + quantity, MAX_CART_QTY_PER_ITEM)
        existing["subtotal"] = round(float(existing["unit_price"]) * int(existing["quantity"]), 2)
    else:
        cart.append(build_cart_item(book, quantity))

    return ok(summarize_cart(cart), message="Book added to cart", session_id=session_id)


@app.post("/api/cart/update")
def update_cart_item():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "guest")).strip() or "guest"
    product_id = payload.get("product_id")
    quantity = payload.get("quantity")

    if product_id is None or quantity is None:
        return error_response("Missing required fields: product_id and quantity")

    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return error_response("product_id and quantity must be integers")

    cart = get_or_create_cart(session_id)
    existing = next((item for item in cart if item["product_id"] == product_id), None)
    if not existing:
        return error_response("Item not found in cart", 404)

    if quantity <= 0:
        cart.remove(existing)
    else:
        existing["quantity"] = min(quantity, MAX_CART_QTY_PER_ITEM)
        existing["subtotal"] = round(float(existing["unit_price"]) * int(existing["quantity"]), 2)

    return ok(summarize_cart(cart), message="Cart updated", session_id=session_id)


@app.post("/api/cart/remove")
def remove_cart_item():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "guest")).strip() or "guest"
    product_id = payload.get("product_id")

    if product_id is None:
        return error_response("Missing required field: product_id")
    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return error_response("product_id must be an integer")

    cart = get_or_create_cart(session_id)
    existing = next((item for item in cart if item["product_id"] == product_id), None)
    if not existing:
        return error_response("Item not found in cart", 404)

    cart.remove(existing)
    return ok(summarize_cart(cart), message="Item removed from cart", session_id=session_id)


@app.post("/api/cart/clear")
def clear_cart():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "guest")).strip() or "guest"
    cart_store[session_id] = []
    return ok(summarize_cart([]), message="Cart cleared", session_id=session_id)


@app.get("/api/checkout/summary")
def checkout_summary():
    session_id = request.args.get("session_id", "guest").strip() or "guest"
    items = get_or_create_cart(session_id)
    if not items:
        return error_response("Cart is empty", 400)
    return ok(summarize_cart(items), session_id=session_id)


@app.post("/api/checkout")
def checkout():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("session_id", "guest")).strip() or "guest"
    customer_name = str(payload.get("customer_name", "")).strip()
    email = str(payload.get("email", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    address = str(payload.get("address", "")).strip()
    payment_method = str(payload.get("payment_method", "Cash on Delivery")).strip()

    if not customer_name or not email or not address:
        return error_response("customer_name, email, and address are required")

    items = get_or_create_cart(session_id)
    if not items:
        return error_response("Cart is empty", 400)

    summary = summarize_cart(items)
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    order = {
        "order_id": order_id,
        "session_id": session_id,
        "customer_name": customer_name,
        "email": email,
        "phone": phone,
        "address": address,
        "payment_method": payment_method,
        "items": items,
        "summary": summary["summary"],
        "status": "success",
        "created_at": datetime.utcnow().isoformat(),
    }
    orders_store.append(sanitize_value(order))
    cart_store[session_id] = []
    return ok(order, message="Checkout completed successfully")


@app.post("/api/chatbot")
def chatbot_route():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()
    session_id = str(payload.get("session_id", "chat_guest")).strip() or "chat_guest"

    if not message:
        return error_response("Missing required field: message")

    result = chatbot_reply(message, session_id)
    return ok(result)


@app.get("/api/chatbot/session")
def chatbot_session_route():
    session_id = request.args.get("session_id", "chat_guest").strip() or "chat_guest"
    session = get_or_create_chat_session(session_id)
    return ok(session, session_id=session_id)


# ======================================================
# ERROR HANDLERS
# ======================================================
@app.errorhandler(404)
def not_found(_error):
    return error_response("Endpoint not found", 404)


@app.errorhandler(500)
def internal_error(error):
    logger.exception("Unhandled server error: %s", error)
    return error_response("Internal server error", 500)


# ======================================================
# MAIN
# ======================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
