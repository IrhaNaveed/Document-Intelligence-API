import os

from sentence_transformers import CrossEncoder

reranker_model = CrossEncoder(
    os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
)
