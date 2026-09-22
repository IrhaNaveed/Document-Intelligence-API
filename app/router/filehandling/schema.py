from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    document_names: list[str] | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class Source(BaseModel):
    document: str
    page: int | None
    content: str
    score: float


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
