from fastapi import APIRouter, HTTPException
from app.models.schemas import OCRAnalyzeRequest, OCRAnalyzeResponse
from app.services.ocr_service import ocr_service

router = APIRouter()


@router.post("/analyze", response_model=OCRAnalyzeResponse)
async def analyze_certificate(request: OCRAnalyzeRequest):
    """
    Analyse un certificat medical via OCR + NLP.

    - Recoit une image en base64 et la date d'examen
    - Extrait le texte via Tesseract OCR
    - Detecte les dates d'incapacite et le medecin via spaCy
    - Compare avec la date d'examen
    - Retourne une recommandation (VALIDE/REJETE) avec score de confiance
    """
    try:
        result = ocr_service.analyze_certificate(
            image_base64=request.image_base64,
            date_examen_str=request.date_examen,
        )
        return OCRAnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur analyse OCR: {str(e)}"
        )


@router.post("/extract-text")
async def extract_text_only(request: dict):
    """
    Endpoint simplifie : extraction de texte uniquement (sans analyse).
    """
    image_base64 = request.get("image_base64")
    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 requis")

    text = ocr_service.extract_text_from_image(image_base64)
    return {"texte_extrait": text}
