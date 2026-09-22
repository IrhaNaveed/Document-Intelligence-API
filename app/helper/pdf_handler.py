import pymupdf4llm
import tempfile

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.database.db import Chunk
from app.helper.embeddings import embedding_model


async def readFile(file, session):
    file_bytes = await file.read()
    with tempfile.NamedTemporaryFile(suffix=".pdf") as temp:
        temp.write(file_bytes)
        temp.flush()
        pages = pymupdf4llm.to_markdown(temp.name, page_chunks=True)

    # create the chunks page by page so every chunk keeps its page number

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    chunks = []
    chunk_pages = []
    for page in pages:
        page_number = page["metadata"]["page_number"]
        for chunk in splitter.split_text(page["text"]):
            chunks.append(chunk)
            chunk_pages.append(page_number)

    embeddings = embedding_model.encode(chunks)
    for chunk, page_number, embedding in zip(chunks, chunk_pages, embeddings):
        db_chunk = Chunk(
            document_name=file.filename,
            content=chunk,
            embedding=embedding.tolist(),
            chunk_metadata={"name": file.filename, "page": page_number}
        )
        session.add(db_chunk)
    await session.commit()

    return "hello world"

