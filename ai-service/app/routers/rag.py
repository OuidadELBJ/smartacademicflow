from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    RAGQueryRequest, RAGQueryResponse, RAGSource,
    AnalyseEtudiantRequest, AnalyseEtudiantResponse,
    ElementAnalysis, SimulationRattrapage,
)
from app.services.rag_service import rag_service

router = APIRouter()


@router.post("/query", response_model=RAGQueryResponse)
async def query_reglement(request: RAGQueryRequest):
    """
    Interroge le reglement interieur via RAG (Retrieval-Augmented Generation).
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


@router.post("/analyse-etudiant", response_model=AnalyseEtudiantResponse)
async def analyse_etudiant(request: AnalyseEtudiantRequest):
    """
    Analyse le dossier d'un etudiant selon le reglement ENSIAS.

    Applique strictement :
    - Decomposition des notes par element
    - Detection des elements faibles
    - Determination eligibilite au rattrapage (Art. 25)
    - Simulation resultat apres rattrapage (Art. 26, 27)
    - Recommandation explicable
    """
    try:
        # 1. Analyser chaque element
        elements_analysis = []
        elements_rattrapage = []
        note_module = request.note_module

        for el in request.elements:
            nom = el.get("nom", "")
            note = el.get("note_element", 0)
            is_blocked = el.get("is_blocked", False)

            if is_blocked:
                statut = "BLOQUE"
            elif note >= 12:
                statut = "OK"
            else:
                statut = "RATTRAPAGE"

            elements_analysis.append(ElementAnalysis(
                nom=nom, note=round(note, 2), statut=statut
            ))

        # 2. Determiner elements a rattraper (Art. 25)
        if note_module < 12:
            # Cas 1: note module < 12 → rattrapage elements < 12
            seuil = 12.0
        else:
            # Cas 2: note module >= 12 → rattrapage elements < 5
            seuil = 5.0

        for el in request.elements:
            note = el.get("note_element", 0)
            is_blocked = el.get("is_blocked", False)
            if not is_blocked and note > 0 and note < seuil:
                elements_rattrapage.append(el.get("nom", ""))

        # 3. Simuler rattrapage (on suppose que l'etudiant obtient 12 au rattrapage)
        simulated_elements = []
        total_coeff = 0
        total_weighted = 0

        for el in request.elements:
            nom = el.get("nom", "")
            note = el.get("note_element", 0)
            coeff = el.get("coefficient", 1.0)
            is_blocked = el.get("is_blocked", False)

            if nom in elements_rattrapage and not is_blocked:
                # Note Element = Max(Note Examen, Note Rattrapage=12)
                new_note = max(note, 12.0)
                simulated_elements.append(nom)
            else:
                new_note = note

            total_weighted += new_note * coeff
            total_coeff += coeff

        note_module_apres = total_weighted / total_coeff if total_coeff > 0 else 0

        # Art. 27: Note Module = Max(Avant, Min(Apres, 12))
        note_module_finale = max(note_module, min(note_module_apres, 12.0))

        simulation = SimulationRattrapage(
            avant=round(note_module, 2),
            apres=round(note_module_finale, 2),
            elements_modifies=simulated_elements,
        )

        # 4. Recommandation
        has_blocked = any(el.get("is_blocked", False) for el in request.elements)

        if note_module >= 12:
            recommandation = "VALIDER"
            justification = (
                f"Module valide : note {note_module}/20 >= 12/20 (Art. 21). "
                f"Aucune action requise."
            )
            confiance = 0.95
        elif has_blocked:
            recommandation = "REFUSER"
            justification = (
                f"Module non valide ({note_module}/20 < 12). "
                f"Element(s) bloque(s) par absence injustifiee (Art. 35). "
                f"Rachat impossible sur les elements bloques."
            )
            confiance = 0.90
        elif len(elements_rattrapage) > 0 and note_module_finale >= 12:
            recommandation = "RATTRAPAGE"
            justification = (
                f"Module non valide ({note_module}/20 < 12). "
                f"Rattrapage possible dans : {', '.join(elements_rattrapage)} (Art. 25). "
                f"Simulation : si rattrapage reussi (12/20), note module finale = {note_module_finale:.2f}/20 "
                f"(plafonnee a 12, Art. 27). Module potentiellement validable apres rattrapage."
            )
            confiance = 0.85
        elif len(elements_rattrapage) > 0:
            recommandation = "RATTRAPAGE"
            justification = (
                f"Module non valide ({note_module}/20 < 12). "
                f"Rattrapage dans : {', '.join(elements_rattrapage)} (Art. 25). "
                f"Meme avec rattrapage a 12, note module simulee = {note_module_finale:.2f}/20. "
                f"Validation incertaine — depend des notes de rattrapage obtenues."
            )
            confiance = 0.70
        else:
            recommandation = "REFUSER"
            justification = (
                f"Module non valide ({note_module}/20 < 12). "
                f"Aucun element eligible au rattrapage. "
                f"L'etudiant doit refaire le module (Art. 45 - ajournement)."
            )
            confiance = 0.85

        resume = (
            f"Etudiant {request.etudiant_nom} {request.etudiant_prenom} — "
            f"Note module : {note_module}/20 — "
            f"{'Module VALIDE' if note_module >= 12 else 'Module NON VALIDE'} — "
            f"{len(elements_rattrapage)} element(s) a rattraper"
        )

        return AnalyseEtudiantResponse(
            resume=resume,
            elements=elements_analysis,
            elements_rattrapage=elements_rattrapage,
            simulation=simulation,
            recommandation=recommandation,
            justification=justification,
            confiance=confiance,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur analyse: {str(e)}"
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
