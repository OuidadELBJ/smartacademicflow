import os
import re
from typing import Optional

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "/app/data/chroma")

# Reglement interieur integre pour demo
REGLEMENT_INTERIEUR = """
REGLEMENT INTERIEUR - ENSIAS
Universite Mohammed V de Rabat

TITRE I : DISPOSITIONS GENERALES

Article 1 : Le present reglement s'applique a l'ensemble des etudiants inscrits.

Article 2 : L'inscription vaut acceptation du present reglement.

TITRE II : ASSIDUITE ET ABSENCES

Article 10 : La presence aux cours, TD et TP est obligatoire.

Article 11 : Toute absence doit etre justifiee dans un delai de 48 heures.

Article 12 : Les justificatifs acceptes sont : certificats medicaux,
convocations administratives, evenements familiaux graves.

Article 13 : Le certificat medical doit etre delivre par un medecin agree,
mentionner la duree de l'incapacite et etre remis a la scolarite.

TITRE III : EXAMENS ET EVALUATIONS

Article 30 : Les examens sont organises a la fin de chaque semestre.

Article 31 : L'acces a la salle d'examen est interdit apres 15 minutes.

Article 32 : La note est sur 20. La moyenne de validation est 10/20.

Article 33 : Le rattrapage est accorde aux etudiants ayant une note entre 7 et 10.

Article 34 : Le jury de deliberation est souverain dans ses decisions.

Article 35 : Le rachat est possible pour les notes entre 8 et 10,
sous reserve de justification par le responsable de module.

Article 36 : Le rachat ne peut exceder 2 points d'augmentation.

Article 37 : Tout rachat doit etre motive et consigne dans le proces-verbal.

Article 38 : Les notes sont definitives apres validation du PV semestriel
par le chef de filiere.

Article 39 : Toute absence injustifiee a un examen entraine la note de 0/20.
Cette note ne peut faire l'objet d'aucun rachat ni deliberation favorable.
L'etudiant concerne est marque "Defaillant" pour l'element correspondant.

Article 40 : En cas de fraude averee, l'etudiant encourt l'exclusion
definitive et la note 0/20 a l'ensemble du module.

TITRE IV : DELIBERATION

Article 45 : Le jury de deliberation se reunit a la fin de chaque semestre.

Article 46 : Le jury est compose du chef de filiere, des responsables de modules
et d'un representant de la scolarite.

Article 47 : Les decisions du jury sont : Valide, Rattrapage, Non Valide, Exclu.

Article 48 : Le PV de deliberation est signe par le chef de filiere
et archive a la scolarite.

Article 49 : Apres signature du PV, aucune modification n'est possible
sauf erreur materielle constatee.

TITRE V : DISPOSITIONS FINALES

Article 55 : Le present reglement entre en vigueur a la date de sa publication.

Article 56 : Toute situation non prevue par le present reglement releve
de la competence du conseil de l'etablissement.
"""


class RAGService:
    """
    Service RAG simplifie pour interroger le reglement interieur.
    Utilise une recherche par mots-cles sans dependance PyTorch.
    """

    def __init__(self):
        self._initialized = False
        self.articles = {}
        self.vectorstore = None
        self._parse_articles()

    def _parse_articles(self):
        """Parse le reglement en articles individuels."""
        current_article = None
        current_text = []

        for line in REGLEMENT_INTERIEUR.strip().split("\n"):
            line = line.strip()
            match = re.match(r"^Article\s+(\d+)\s*:", line)
            if match:
                if current_article:
                    self.articles[current_article] = " ".join(current_text).strip()
                current_article = f"Article {match.group(1)}"
                current_text = [line[match.end():].strip()]
            elif current_article and line:
                current_text.append(line)

        if current_article:
            self.articles[current_article] = " ".join(current_text).strip()

        self._initialized = True

    def initialize(self):
        """Reinitialise le parsing si necessaire."""
        if not self._initialized:
            self._parse_articles()

    def _search_articles(self, question: str, top_k: int = 3) -> list[dict]:
        """Recherche les articles pertinents par mots-cles."""
        question_lower = question.lower()
        question_words = set(re.findall(r"\w+", question_lower))

        scores = []
        for article_name, content in self.articles.items():
            content_lower = content.lower()
            content_words = set(re.findall(r"\w+", content_lower))

            # Score = nombre de mots en commun
            common = question_words.intersection(content_words)
            score = len(common)

            # Bonus si le numero d'article est mentionne
            art_num = re.search(r"\d+", article_name)
            if art_num and art_num.group() in question:
                score += 10

            # Bonus mots-cles importants
            important_keywords = ["absence", "injustifiee", "rachat", "deliberation",
                                  "jury", "certificat", "note", "pv", "validation",
                                  "cloture", "fraude", "rattrapage", "examen"]
            for kw in important_keywords:
                if kw in question_lower and kw in content_lower:
                    score += 3

            if score > 0:
                scores.append((article_name, content, score))

        scores.sort(key=lambda x: x[2], reverse=True)
        return [
            {"article": name, "extrait": text[:200], "score": score}
            for name, text, score in scores[:top_k]
        ]

    def query(self, question: str) -> dict:
        """Interroge le reglement interieur."""
        if not self._initialized:
            self.initialize()

        results = self._search_articles(question)

        if not results:
            return {
                "reponse": "Aucune information pertinente trouvee dans le reglement.",
                "sources": [],
                "confiance": 0.0,
            }

        sources = [
            {"article": r["article"], "page": None, "extrait": r["extrait"]}
            for r in results
        ]

        max_score = results[0]["score"] if results else 0
        confiance = min(max_score / 15.0, 1.0)

        reponse = self._generate_response(question, results)

        return {
            "reponse": reponse,
            "sources": sources,
            "confiance": round(confiance, 2),
        }

    def _generate_response(self, question: str, results: list) -> str:
        """Genere une reponse basee sur les articles trouves."""
        question_lower = question.lower()

        if "article 39" in question_lower or "absence injustifiee" in question_lower:
            return (
                "Selon l'Article 39 du reglement interieur : "
                "Toute absence injustifiee a un examen entraine automatiquement "
                "la note de 0/20. Cette note ne peut faire l'objet d'aucun rachat "
                "ni deliberation favorable. L'etudiant est marque 'Defaillant'."
            )

        if "rachat" in question_lower:
            return (
                "Selon les Articles 35, 36 et 37 : Le rachat est possible pour "
                "les notes entre 8 et 10/20, avec un maximum de 2 points "
                "d'augmentation. Le responsable de module doit obligatoirement "
                "fournir une justification qui sera consignee au proces-verbal."
            )

        if "deliberation" in question_lower or "jury" in question_lower:
            return (
                "Selon les Articles 45 a 49 : Le jury de deliberation se reunit "
                "en fin de semestre, compose du chef de filiere, des responsables "
                "de modules et d'un representant de la scolarite. Les decisions "
                "possibles sont : Valide, Rattrapage, Non Valide, Exclu. "
                "Apres signature du PV, aucune modification n'est possible."
            )

        if "certificat" in question_lower or "justificatif" in question_lower:
            return (
                "Selon les Articles 11, 12 et 13 : L'absence doit etre justifiee "
                "sous 48h. Les justificatifs acceptes incluent les certificats "
                "medicaux (delivres par medecin agree, mentionnant la duree "
                "d'incapacite), convocations administratives et evenements "
                "familiaux graves."
            )

        if "pv" in question_lower or "validation" in question_lower or "cloture" in question_lower:
            return (
                "Selon les Articles 38 et 48 : Les notes deviennent definitives "
                "apres validation du PV semestriel par le chef de filiere. "
                "Le PV est signe et archive a la scolarite. Aucune modification "
                "ulterieure n'est possible sauf erreur materielle constatee."
            )

        if "fraude" in question_lower:
            return (
                "Selon l'Article 40 : En cas de fraude averee, l'etudiant encourt "
                "l'exclusion definitive et la note 0/20 a l'ensemble du module."
            )

        if "rattrapage" in question_lower:
            return (
                "Selon l'Article 33 : Le rattrapage est accorde aux etudiants "
                "ayant obtenu une note comprise entre 7 et 10/20."
            )

        # Reponse generique
        context = "\n".join([f"- {r['article']} : {r['extrait']}" for r in results])
        return f"D'apres le reglement interieur :\n\n{context}"


# Singleton
rag_service = RAGService()
