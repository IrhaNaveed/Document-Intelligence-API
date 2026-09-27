import json
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from httpx import ConnectError
from ollama import ResponseError
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.common import FILE_EXTENSIONS
from app.database.db import Chunk, Conversation, Message, User, async_session_factory, get_session
from app.helper.document_handler import readFile
from app.helper.rag import (
    NO_DOCUMENTS_MESSAGE,
    answer_question,
    format_sources,
    retrieve,
    stream_answer_tokens,
)
from app.router.filehandling.schema import AskRequest, AskResponse, DocumentSummary

router = APIRouter(prefix="/api")


def _ollama_error(e: ResponseError | ConnectError) -> HTTPException:
    if isinstance(e, ResponseError):
        return HTTPException(status_code=502, detail=f"Ollama error: {e.error}")
    return HTTPException(status_code=503, detail="Cannot reach Ollama. Is it running?")


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _get_owned_conversation(
    session: AsyncSession, conversation_id: int, owner_id: int
) -> Conversation:
    conversation = await session.get(Conversation, conversation_id)
    if conversation is None or conversation.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


async def _persist_exchange(
    conversation_id: int, question: str, answer: str, sources: list[dict]
) -> None:
    """Saves a question/answer pair using a fresh session, independent of the
    request-scoped one, so it works safely from inside a StreamingResponse
    generator that outlives the original dependency scope.
    """
    async with async_session_factory() as session:
        conversation = await session.get(Conversation, conversation_id)
        if conversation is None:
            return
        session.add(Message(conversation_id=conversation_id, role="user", content=question))
        session.add(
            Message(
                conversation_id=conversation_id,
                role="assistant",
                content=answer,
                sources=sources,
            )
        )
        if conversation.title == "New conversation":
            conversation.title = question[:60]
        conversation.updated_at = datetime.now(timezone.utc)
        await session.commit()


@router.post("/fileUpload")
async def fileUpload(
    file: UploadFile,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not supported")
    await readFile(file, extension, session, current_user.id)
    return file.filename


@router.get("/documents", response_model=list[DocumentSummary])
async def list_documents(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Chunk.document_name,
            func.count(Chunk.id).label("chunk_count"),
            func.min(Chunk.created_at).label("uploaded_at"),
        )
        .where(Chunk.owner_id == current_user.id)
        .group_by(Chunk.document_name)
        .order_by(func.min(Chunk.created_at).desc())
    )
    rows = await session.execute(stmt)
    return [
        DocumentSummary(
            document_name=row.document_name,
            chunk_count=row.chunk_count,
            uploaded_at=row.uploaded_at,
        )
        for row in rows
    ]


@router.delete("/documents/{document_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_name: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    result = await session.execute(
        delete(Chunk).where(
            Chunk.document_name == document_name, Chunk.owner_id == current_user.id
        )
    )
    await session.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")


@router.post("/ask", response_model=AskResponse)
async def ask(
    body: AskRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_conversation(session, body.conversation_id, current_user.id)

    try:
        answer, sources = await answer_question(
            session, body.question, body.top_k, body.document_names, current_user.id
        )
    except (ResponseError, ConnectError) as e:
        raise _ollama_error(e)

    await _persist_exchange(body.conversation_id, body.question, answer, sources)
    return AskResponse(answer=answer, sources=sources)


@router.post("/ask/stream")
async def ask_stream(
    body: AskRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Same as /ask, but streams the answer as Server-Sent Events.

    Events, in order: `sources` (the retrieved chunks, known before generation
    starts), then one `token` per piece of the answer, then `done`. If Ollama
    fails mid-answer an `error` event is sent instead of `done`.
    """
    await _get_owned_conversation(session, body.conversation_id, current_user.id)

    rows = await retrieve(
        session, body.question, body.top_k, body.document_names, current_user.id
    )
    tokens = stream_answer_tokens(body.question, rows)
    try:
        first = await anext(tokens, None) if rows else None
    except (ResponseError, ConnectError) as e:
        raise _ollama_error(e)

    sources = format_sources(rows)

    async def event_stream():
        yield _sse("sources", sources)
        answer_chunks: list[str] = []
        if not rows:
            answer_chunks.append(NO_DOCUMENTS_MESSAGE)
            yield _sse("token", NO_DOCUMENTS_MESSAGE)
        else:
            try:
                if first is not None:
                    answer_chunks.append(first)
                    yield _sse("token", first)
                async for token in tokens:
                    answer_chunks.append(token)
                    yield _sse("token", token)
            except (ResponseError, ConnectError) as e:
                yield _sse("error", {"detail": _ollama_error(e).detail})
                return
        await _persist_exchange(
            body.conversation_id, body.question, "".join(answer_chunks), sources
        )
        yield _sse("done", {})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )