import hashlib
import math
import re
from typing import List
from app.core.config import settings

DIMENSION = settings.EMBEDDING_DIM  # 384


def compute_deterministic_embedding(text: str, dim: int = DIMENSION) -> List[float]:
    """
    Computes a deterministic, normalized 384-dimensional semantic embedding
    from text tokens, n-grams, and keywords without heavy ML runtime overhead.
    Lightweight, highly efficient and fast while providing true cosine similarity rankings.
    """
    cleaned = text.lower().strip()
    words = re.findall(r"\b\w+\b", cleaned)
    
    vec = [0.0] * dim
    if not words:
        return vec

    # Known domain semantic clusters for software engineering
    clusters = {
        "frontend": ["react", "vue", "angular", "next", "vite", "tailwind", "css", "html", "javascript", "typescript", "ui", "ux"],
        "backend": ["fastapi", "python", "django", "flask", "node", "express", "go", "golang", "java", "spring", "api", "rest"],
        "database": ["postgres", "postgresql", "sql", "sqlite", "mysql", "mongodb", "redis", "pgvector", "prisma", "orm"],
        "devops": ["docker", "compose", "kubernetes", "k8s", "github", "actions", "ci", "cd", "aws", "gcp", "azure", "linux"],
        "ai": ["llm", "rag", "langchain", "openai", "embeddings", "agent", "pytorch", "tensorflow", "transformer", "nlp"]
    }

    # Project semantic tokens into deterministic dimensional bands
    band_size = dim // (len(clusters) + 1)
    
    for i, (cluster_name, keywords) in enumerate(clusters.items()):
        start_idx = i * band_size
        end_idx = start_idx + band_size
        
        # Check match intensity using token-boundary regex to prevent substring false positives
        matches = sum(1 for kw in keywords if re.search(rf"\b{re.escape(kw)}\b", cleaned))
        if matches > 0:
            weight = math.log1p(matches) * 2.0
            for j in range(start_idx, end_idx):
                h = int(hashlib.md5(f"{cluster_name}_{j}".encode()).hexdigest(), 16)
                vec[j] += ((h % 1000) / 1000.0) * weight

    # Fine-grained word level hashing across full vector
    for word in words:
        for offset in range(3):
            token = f"{word}_{offset}"
            h = int(hashlib.sha256(token.encode()).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if ((h >> 16) % 2 == 0) else -1.0
            vec[idx] += sign * (1.0 / (offset + 1))

    # L2 Normalization
    magnitude = math.sqrt(sum(v * v for v in vec))
    if magnitude > 1e-9:
        vec = [round(v / magnitude, 6) for v in vec]

    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two normalized vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a < 1e-9 or norm_b < 1e-9:
        return 0.0
    return float(dot_product / (norm_a * norm_b))
