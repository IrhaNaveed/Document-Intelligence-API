from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.router.filehandling.endpoint import router as file_router
from app.router.auth.endpoint import router as auth_router
from app.router.conversation.endpoint import router as conversation_router
from app.database.db import init_db

@asynccontextmanager
async def create_app(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=create_app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(file_router)
app.include_router(conversation_router)
@app.get("/")
async def healthcheck():
    return {"message": "Working"}

