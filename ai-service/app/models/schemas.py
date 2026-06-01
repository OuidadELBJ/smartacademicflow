from pydantic import BaseModel
from typing import Optional


class OCRAnalyzeRequest(BaseModel):
    image_base64: str
    date_examen: str  # format YYYY-MM-DD


class OCRAnalyzeResponse(BaseModel):
    texte_extrait: str
    date_incapacite_debut: Optional[str] = None
    date_incapacite_fin: Optional[str] = None
    medecin_detecte: Optional[str] = None
    recommandation: str  # "VALIDE" ou "REJETE"
    score_confiance: float  # 0.0 a 1.0
    motif: str
    couvre_date_examen: bool


class RAGSource(BaseModel):
    article: str
    page: Optional[int] = None
    extrait: str


class RAGQueryRequest(BaseModel):
    question: str


class RAGQueryResponse(BaseModel):
    reponse: str
    sources: list[RAGSource]
    confiance: float
