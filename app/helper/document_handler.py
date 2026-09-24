import tempfile

import pymupdf4llm
from fastapi import HTTPException
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import delete

from app.database.db import Chunk
from app.helper.docx_handler import extract_docx_text
from app.helper.embeddings import embedding_model

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)


def _extract_pdf_pages(file_bytes: bytes) -> list[dict]:
    with tempfile.NamedTemporaryFile(suffix=".pdf") as temp:
        temp.write(file_bytes)
        temp.flush()
        return pymupdf4llm.to_markdown(temp.name, page_chunks=True)


def _chunk_document(file_bytes: bytes, extension: str) -> tuple[list[str], list[int | None]]:
    """Split a document into chunks, paired with the page each one came from.

    PDFs carry real page numbers. Word documents don't store pagination at
    all (it's computed by the renderer), so every docx chunk gets page=None
    rather than a guessed number.
    """
    chunks: list[str] = []
    chunk_pages: list[int | None] = []

    if extension == "pdf":
        pages = _extract_pdf_pages(file_bytes)
        for page in pages:
            page_number = page["metadata"]["page_number"]
            for chunk in splitter.split_text(page["text"]):
                chunks.append(chunk)
                chunk_pages.append(page_number)
    elif extension == "docx":
        text = extract_docx_text(file_bytes)
        for chunk in splitter.split_text(text):
            chunks.append(chunk)
            chunk_pages.append(None)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension: {extension}")

    return chunks, chunk_pages


async def readFile(file, extension, session):
    try:
        file_bytes = await file.read()

        chunks, chunk_pages = _chunk_document(file_bytes, extension)
        if not chunks:
            raise HTTPException(status_code=400, detail="No extractable text found in the file.")

        embeddings = embedding_model.encode(chunks)
        await session.execute(delete(Chunk).where(Chunk.document_name == file.filename))
        for chunk, page_number, embedding in zip(chunks, chunk_pages, embeddings):
            db_chunk = Chunk(
                document_name=file.filename,
                content=chunk,
                embedding=embedding.tolist(),
                chunk_metadata={"name": file.filename, "page": page_number}
            )
            session.add(db_chunk)
        await session.commit()

        return "File Read Successfully"
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
