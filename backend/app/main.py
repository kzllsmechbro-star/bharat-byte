from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.spatial import router as spatial_router

app = FastAPI(
    title="ULPIN 3D System API",
    description="Backend for the 3D ULPIN Generation and Vertical Property Mapping System",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spatial_router)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
