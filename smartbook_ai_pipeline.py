# ==============================================
# SMARTBOOK AI STORE - FINAL AI PIPELINE (V2)
# ==============================================
# This script builds:
# - Content-based recommendation
# - Semantic search
# - Same author recommendation
# - Trending books ranking
# - Save trained TF-IDF + similarity matrix
#
# Usage:
# 1. Place this file in same folder as smartbook_catalog.csv
# 2. Run: python smartbook_ai_pipeline_v2.py
#
# Output artifacts:
# - models/vectorizer.pkl
# - models/similarity.npy
# ==============================================

from __future__ import annotations

import os
import pickle

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ==============================================
# PATH CONFIG
# ==============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "smartbook_catalog.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
VECTORIZER_FILE = os.path.join(MODELS_DIR, "vectorizer.pkl")
SIMILARITY_FILE = os.path.join(MODELS_DIR, "similarity.npy")


# ==============================================
# LOAD DATASET
# ==============================================
print("Loading dataset...")

if not os.path.exists(DATA_FILE):
    raise FileNotFoundError(f"Missing dataset file: {DATA_FILE}")

df = pd.read_csv(DATA_FILE)
print("Dataset shape:", df.shape)

if "ai_text" not in df.columns:
    raise ValueError("Missing required column: ai_text")
if "title" not in df.columns:
    raise ValueError("Missing required column: title")

# Fill/normalize columns used later so the pipeline is more robust
text_fallback_cols = ["title", "authors", "category", "image_url", "ai_text"]
for col in text_fallback_cols:
    if col in df.columns:
        df[col] = df[col].fillna("").astype(str)

numeric_fallbacks = {
    "product_id": np.arange(1, len(df) + 1),
    "final_price": 0.0,
    "average_rating": 0.0,
    "ratings_count": 0,
}
for col, default_value in numeric_fallbacks.items():
    if col not in df.columns:
        df[col] = default_value
    df[col] = pd.to_numeric(df[col], errors="coerce")
    if col == "product_id":
        df[col] = df[col].fillna(pd.Series(np.arange(1, len(df) + 1), index=df.index))
    else:
        df[col] = df[col].fillna(default_value)


# ==============================================
# BUILD TF-IDF VECTORS
# ==============================================
print("Building TF-IDF vectorizer...")

tfidf = TfidfVectorizer(
    stop_words="english",
    max_features=8000,
)

tfidf_matrix = tfidf.fit_transform(df["ai_text"])
print("TF-IDF matrix shape:", tfidf_matrix.shape)


# ==============================================
# BUILD SIMILARITY MATRIX
# ==============================================
print("Computing similarity matrix...")

similarity = cosine_similarity(tfidf_matrix)
print("Similarity matrix shape:", similarity.shape)


# ==============================================
# RECOMMENDATION FUNCTION
# ==============================================
def recommend_books(title: str, top_n: int = 6) -> pd.DataFrame:
    if title not in df["title"].values:
        return pd.DataFrame()

    idx = df[df["title"] == title].index[0]
    scores = list(enumerate(similarity[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)[1 : top_n + 1]
    book_indices = [i[0] for i in scores]

    return df.iloc[book_indices][
        [
            "product_id",
            "title",
            "authors",
            "category",
            "image_url",
            "final_price",
            "average_rating",
        ]
    ]


# ==============================================
# SAME AUTHOR FUNCTION
# ==============================================
def same_author_books(title: str, top_n: int = 6) -> pd.DataFrame:
    if title not in df["title"].values:
        return pd.DataFrame()

    author = df[df["title"] == title]["authors"].values[0]
    result = df[(df["authors"] == author) & (df["title"] != title)]

    return result.sort_values("average_rating", ascending=False).head(top_n)[
        [
            "product_id",
            "title",
            "image_url",
            "final_price",
            "average_rating",
        ]
    ]


# ==============================================
# TRENDING BOOKS FUNCTION
# ==============================================
def trending_books(top_n: int = 10) -> pd.DataFrame:
    score = df["average_rating"] * (df["ratings_count"] + 1).apply(lambda x: x**0.3)

    temp = df.copy()
    temp["trend_score"] = score

    return temp.sort_values("trend_score", ascending=False).head(top_n)[
        [
            "product_id",
            "title",
            "image_url",
            "final_price",
            "average_rating",
        ]
    ]


# ==============================================
# SEMANTIC SEARCH FUNCTION
# ==============================================
def semantic_search(query: str, top_n: int = 6) -> pd.DataFrame:
    query = str(query).strip()
    if not query:
        return pd.DataFrame()

    query_vec = tfidf.transform([query])
    scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_idx = scores.argsort()[-top_n:][::-1]

    return df.iloc[top_idx][
        [
            "product_id",
            "title",
            "image_url",
            "final_price",
            "average_rating",
        ]
    ]


# ==============================================
# JSON HELPER
# ==============================================
def to_json(result_df: pd.DataFrame) -> list[dict]:
    return result_df.to_dict(orient="records")


# ==============================================
# SAVE MODEL FILES
# ==============================================
print("Saving model files...")
os.makedirs(MODELS_DIR, exist_ok=True)

with open(VECTORIZER_FILE, "wb") as f:
    pickle.dump(tfidf, f)

np.save(SIMILARITY_FILE, similarity)

print(f"Saved: {VECTORIZER_FILE}")
print(f"Saved: {SIMILARITY_FILE}")


# ==============================================
# QUICK TEST
# ==============================================
print("\n=== QUICK TEST ===")

sample_index = min(100, len(df) - 1)
sample_title = df.iloc[sample_index]["title"]

print("\nSample recommendation for:", sample_title)
print(recommend_books(sample_title))

print("\nTrending books:")
print(trending_books())

print("\nSemantic search: fantasy magic")
print(semantic_search("fantasy magic"))

print("\nPipeline completed successfully.")
