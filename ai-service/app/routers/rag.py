from fastapi import APIRouter, HTTPException
from app.models.schemas import RAGQueryRequest, RAGQueryResponse, RAGSource
from app.services.rag_service import rag_service

router = APIRouter()


@router.post("/query", response_model=RAGQueryResponse)
async def query_reglement(request: RAGQueryRequest):
    """
    Interroge le reglement interieur via RAG (Retrieval-Augmented Generation).

    - Le RM pose une question en langage naturel
    - Le systeme recherche les articles pertinents dans le vectorstore
    - Retourne une reponse structuree avec les sources (article + page)
    """
    try:
        result = rag_service.query(question=request.question)

        sources = [
            RAGSource(
                article=s["article"],
                page=s.get("page"),
                extrait=s["extrait"],
            )
            for s in result["sources"]
        ]

        return RAGQueryResponse(
            reponse=result["reponse"],
            sources=sources,
            confiance=result["confiance"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur RAG: {str(e)}"
        )


@router.get("/status")
async def rag_status():
    """Verifie l'etat du service RAG et du vectorstore."""
    return {
        "initialized": rag_service._initialized,
        "vectorstore_ready": rag_service.vectorstore is not None,
    }


@router.post("/initialize")
async def initialize_rag():
    """Force l'initialisation du vectorstore RAG."""
    try:
        rag_service.initialize()
        return {
            "message": "RAG initialise avec succes",
            "initialized": rag_service._initialized,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur initialisation RAG: {str(e)}"
        )
