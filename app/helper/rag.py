import asyncio
import os

import torch
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.db import Chunk
from app.helper.embeddings import embedding_model
from app.helper.reranker import reranker_model

llm = ChatOllama(
    model=os.getenv("OLLAMA_MODEL", "llama3.2"),
    base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
    temperature=0,
)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You answer questions using only the provided context. "
        "Each context block is labelled with its source as [document, page N]. "
        "Cite the sources you used in the answer in that same format. "
        "If the context does not contain the answer, say you could not find it "
        "in the documents. Do not use outside knowledge.",
    ),
    ("human", "Context:\n{context}\n\nQuestion: {question}"),
])


RERANK_CANDIDATE_FACTOR = 4


async def search_chunks(
    session: AsyncSession,
    question: str,
    top_k: int,
    document_names: list[str] | None,
):
    query_embedding = await asyncio.to_thread(embedding_model.encode, question)

    distance = Chunk.embedding.cosine_distance(query_embedding.tolist())
    stmt = select(Chunk).order_by(distance).limit(top_k * RERANK_CANDIDATE_FACTOR)
    if document_names:
        stmt = stmt.where(Chunk.document_name.in_(document_names))

    result = await session.execute(stmt)
    return result.scalars().all()


async def rerank_chunks(question: str, chunks: list[Chunk], top_k: int):
    if not chunks:
        return []
    ranked = await asyncio.to_thread(
        reranker_model.rank,
        question,
        [chunk.content for chunk in chunks],
        top_k=top_k,
        activation_fn=torch.nn.Sigmoid(),
    )
    return [(chunks[r["corpus_id"]], float(r["score"])) for r in ranked]


async def answer_question(
    session: AsyncSession,
    question: str,
    top_k: int,
    document_names: list[str] | None,
):
    candidates = await search_chunks(session, question, top_k, document_names)
    rows = await rerank_chunks(question, candidates, top_k)
    if not rows:
        return "No documents were found to answer from.", []

    context = "\n\n".join(
        f"[{chunk.document_name}, page {chunk.chunk_metadata.get('page', '?')}]\n{chunk.content}"
        for chunk, _ in rows
    )
    response = await (prompt | llm).ainvoke({"context": context, "question": question})

    sources = [
        {
            "document": chunk.document_name,
            "page": chunk.chunk_metadata.get("page"),
            "content": chunk.content,
            "score": round(score, 4),
        }
        for chunk, score in rows
    ]
    return response.content, sources
