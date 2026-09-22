from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.router.filehandling.endpoint import router as file_router
from app.database.db import init_db

@asynccontextmanager
async def create_app(app: FastAPI):
    await init_db()
    yield

app = FastAPI(lifespan=create_app)

app.include_router(file_router)
@app.get("/")
async def healthcheck():
    return {"message": "Working"}

