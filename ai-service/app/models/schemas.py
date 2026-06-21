from pydantic import BaseModel
from typing import Optional, List


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


# --- Assistant RM - Analyse Etudiant ---

class ElementAnalysis(BaseModel):
    nom: str
    note: float
    statut: str  # "OK" | "RATTRAPAGE" | "BLOQUE"


class SimulationRattrapage(BaseModel):
    avant: float
    apres: float
    elements_modifies: List[str] = []


class AnalyseEtudiantRequest(BaseModel):
    etudiant_nom: str
    etudiant_prenom: str
    note_module: float
    elements: List[dict]  # [{nom, note_exam, note_td, note_tp, note_projet, coefficient, is_blocked}]


class AnalyseEtudiantResponse(BaseModel):
    resume: str
    elements: List[ElementAnalysis]
    elements_rattrapage: List[str]
    simulation: SimulationRattrapage
    recommandation: str  # "VALIDER" | "RATTRAPAGE" | "REFUSER"
    justification: str
    confiance: float
