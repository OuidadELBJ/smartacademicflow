from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ocr, rag

app = FastAPI(
    title="SmartAcademicFlow - AI Service",
    description="Microservice IA : OCR de certificats medicaux et RAG juridique",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR - Certificats Medicaux"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG - Reglement Juridique"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}
