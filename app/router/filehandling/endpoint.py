import json

from fastapi import APIRouter, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse
from httpx import ConnectError
from ollama import ResponseError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common import FILE_EXTENSIONS
from app.database.db import get_session
from app.helper.document_handler import readFile
from app.helper.rag import (
    NO_DOCUMENTS_MESSAGE,
    answer_question,
    format_sources,
    retrieve,
    stream_answer_tokens,
)
from app.router.filehandling.schema import AskRequest, AskResponse

router = APIRouter(prefix="/api")


def _ollama_error(e: ResponseError | ConnectError) -> HTTPException:
    if isinstance(e, ResponseError):
        return HTTPException(status_code=502, detail=f"Ollama error: {e.error}")
    return HTTPException(status_code=503, detail="Cannot reach Ollama. Is it running?")


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/fileUpload")
async def fileUpload(file: UploadFile, session: AsyncSession = Depends(get_session)):
    extension = file.filename.rsplit(".", 1)[-1].lower()
    if extension not in FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not supported")
    await readFile(file, extension, session)
    return file.filename


@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest, session: AsyncSession = Depends(get_session)):
    try:
        answer, sources = await answer_question(
            session, body.question, body.top_k, body.document_names
        )
    except (ResponseError, ConnectError) as e:
        raise _ollama_error(e)
    return AskResponse(answer=answer, sources=sources)


@router.post("/ask/stream")
async def ask_stream(body: AskRequest, session: AsyncSession = Depends(get_session)):
    """Same as /ask, but streams the answer as Server-Sent Events.

    Events, in order: `sources` (the retrieved chunks, known before generation
    starts), then one `token` per piece of the answer, then `done`. If Ollama
    fails mid-answer an `error` event is sent instead of `done`.
    """
    rows = await retrieve(session, body.question, body.top_k, body.document_names)
    tokens = stream_answer_tokens(body.question, rows)
    try:
        first = await anext(tokens, None) if rows else None
    except (ResponseError, ConnectError) as e:
        raise _ollama_error(e)

    async def event_stream():
        yield _sse("sources", format_sources(rows))
        if not rows:
            yield _sse("token", NO_DOCUMENTS_MESSAGE)
        else:
            try:
                if first is not None:
                    yield _sse("token", first)
                async for token in tokens:
                    yield _sse("token", token)
            except (ResponseError, ConnectError) as e:
                yield _sse("error", {"detail": _ollama_error(e).detail})
                return
        yield _sse("done", {})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )