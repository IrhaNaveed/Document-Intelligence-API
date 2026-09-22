from fastapi import APIRouter, UploadFile, HTTPException, Depends
from httpx import ConnectError
from ollama import ResponseError
from sqlalchemy.ext.asyncio import AsyncSession

from app.common import FILE_EXTENSIONS
from app.database.db import get_session
from app.helper.pdf_handler import readFile
from app.helper.rag import answer_question
from app.router.filehandling.schema import AskRequest, AskResponse

router = APIRouter(prefix="/api")

@router.post("/fileUpload")
async def fileUpload(file: UploadFile, session: AsyncSession = Depends(get_session)):
    extension = file.filename.split(".")[-1]
    if extension not in FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not supported")
    await readFile(file, session)
    return file.filename


@router.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest, session: AsyncSession = Depends(get_session)):
    try:
        answer, sources = await answer_question(
            session, body.question, body.top_k, body.document_names
        )
    except ResponseError as e:
        raise HTTPException(status_code=502, detail=f"Ollama error: {e.error}")
    except ConnectError:
        raise HTTPException(status_code=503, detail="Cannot reach Ollama. Is it running?")
    return AskResponse(answer=answer, sources=sources)