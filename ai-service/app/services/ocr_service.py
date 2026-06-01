import base64
import io
import re
from datetime import datetime, date
from typing import Optional, Tuple

import pytesseract
from PIL import Image

try:
    import spacy
    nlp = spacy.load("fr_core_news_sm")
except Exception:
    nlp = None


class OCRService:
    """
    Service OCR + NLP pour analyser les certificats medicaux.
    Utilise pytesseract pour l'extraction de texte et spaCy pour le NLP.
    """

    # Patterns de dates courants dans les certificats francais/marocains
    DATE_PATTERNS = [
        r"(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})",
        r"(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|"
        r"aout|septembre|octobre|novembre|decembre)\s+(\d{4})",
    ]

    MOIS_MAP = {
        "janvier": 1, "fevrier": 2, "mars": 3, "avril": 4,
        "mai": 5, "juin": 6, "juillet": 7, "aout": 8,
        "septembre": 9, "octobre": 10, "novembre": 11, "decembre": 12,
    }

    # Mots-cles indicatifs d'un certificat medical
    MEDICAL_KEYWORDS = [
        "certificat", "medical", "medecin", "docteur", "dr",
        "incapacite", "repos", "maladie", "patient", "consultation",
        "arret", "travail", "jours", "hopital", "clinique",
    ]

    def extract_text_from_image(self, image_base64: str) -> str:
        """Decode l'image base64 et extrait le texte via Tesseract OCR."""
        try:
            image_data = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_data))

            # Configuration Tesseract pour le francais
            custom_config = r"--oem 3 --psm 6 -l fra"
            text = pytesseract.image_to_string(image, config=custom_config)

            return text.strip()
        except Exception as e:
            return f"[ERREUR OCR] {str(e)}"

    def extract_dates(self, text: str) -> list[date]:
        """Extrait toutes les dates trouvees dans le texte."""
        dates_found = []
        text_lower = text.lower()

        # Pattern numerique : dd/mm/yyyy ou dd-mm-yyyy
        for match in re.finditer(self.DATE_PATTERNS[0], text):
            try:
                day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
                dates_found.append(date(year, month, day))
            except (ValueError, IndexError):
                continue

        # Pattern textuel : dd mois yyyy
        for match in re.finditer(self.DATE_PATTERNS[1], text_lower):
            try:
                day = int(match.group(1))
                month = self.MOIS_MAP.get(match.group(2), 0)
                year = int(match.group(3))
                if month > 0:
                    dates_found.append(date(year, month, day))
            except (ValueError, IndexError):
                continue

        return sorted(dates_found)

    def detect_medecin(self, text: str) -> Optional[str]:
        """Detecte le nom du medecin via NLP (entites nommees)."""
        if nlp is None:
            # Fallback regex si spaCy non disponible
            dr_pattern = r"(?:Dr\.?|Docteur)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)"
            match = re.search(dr_pattern, text)
            return match.group(1) if match else None

        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ == "PER":
                # Verifier proximite avec "Dr" ou "Docteur"
                context = text[max(0, ent.start_char - 20):ent.start_char].lower()
                if "dr" in context or "docteur" in context or "medecin" in context:
                    return ent.text

        return None

    def calculate_confidence(self, text: str, dates: list[date], medecin: Optional[str]) -> float:
        """Calcule un score de confiance pour le document."""
        score = 0.0
        text_lower = text.lower()

        # Presence de mots-cles medicaux (max 0.4)
        keywords_found = sum(1 for kw in self.MEDICAL_KEYWORDS if kw in text_lower)
        score += min(keywords_found / len(self.MEDICAL_KEYWORDS), 0.4)

        # Dates detectees (0.25)
        if len(dates) >= 2:
            score += 0.25
        elif len(dates) == 1:
            score += 0.15

        # Medecin detecte (0.2)
        if medecin:
            score += 0.2

        # Longueur du texte raisonnable (0.15)
        if 50 < len(text) < 2000:
            score += 0.15

        return min(round(score, 2), 1.0)

    def analyze_certificate(
        self, image_base64: str, date_examen_str: str
    ) -> dict:
        """Pipeline complet d'analyse d'un certificat medical."""

        # 1. Extraction OCR
        texte = self.extract_text_from_image(image_base64)

        if texte.startswith("[ERREUR"):
            return {
                "texte_extrait": texte,
                "date_incapacite_debut": None,
                "date_incapacite_fin": None,
                "medecin_detecte": None,
                "recommandation": "REJETE",
                "score_confiance": 0.0,
                "motif": "Impossible de lire le document",
                "couvre_date_examen": False,
            }

        # 2. Extraction des dates
        dates = self.extract_dates(texte)
        date_debut = dates[0].isoformat() if len(dates) >= 1 else None
        date_fin = dates[1].isoformat() if len(dates) >= 2 else (
            dates[0].isoformat() if len(dates) == 1 else None
        )

        # 3. Detection medecin
        medecin = self.detect_medecin(texte)

        # 4. Verification couverture date examen
        try:
            date_examen = datetime.strptime(date_examen_str, "%Y-%m-%d").date()
        except ValueError:
            date_examen = None

        couvre_examen = False
        if date_examen and len(dates) >= 2:
            couvre_examen = dates[0] <= date_examen <= dates[1]
        elif date_examen and len(dates) == 1:
            couvre_examen = dates[0] == date_examen

        # 5. Score de confiance
        confidence = self.calculate_confidence(texte, dates, medecin)

        # 6. Decision
        if confidence >= 0.6 and couvre_examen:
            recommandation = "VALIDE"
            motif = "Le certificat couvre la date d'examen avec un score de confiance suffisant"
        elif confidence >= 0.6 and not couvre_examen:
            recommandation = "REJETE"
            motif = "Le certificat ne couvre pas la date de l'examen"
        elif confidence < 0.4:
            recommandation = "REJETE"
            motif = "Document peu lisible ou non reconnu comme certificat medical"
        else:
            recommandation = "REJETE"
            motif = "Score de confiance insuffisant - verification manuelle recommandee"

        return {
            "texte_extrait": texte,
            "date_incapacite_debut": date_debut,
            "date_incapacite_fin": date_fin,
            "medecin_detecte": medecin,
            "recommandation": recommandation,
            "score_confiance": confidence,
            "motif": motif,
            "couvre_date_examen": couvre_examen,
        }


# Singleton
ocr_service = OCRService()
