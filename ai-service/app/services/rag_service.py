import os
from typing import Optional

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "/app/data/chroma")
DOCUMENTS_DIR = os.getenv("DOCUMENTS_DIR", "/app/data/documents")


# Reglement interieur par defaut (integre pour demo)
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
    Service RAG (Retrieval-Augmented Generation) pour interroger
    le reglement interieur de maniere intelligente.
    """

    def __init__(self):
        self.embeddings = None
        self.vectorstore = None
        self.qa_chain = None
        self._initialized = False

    def initialize(self):
        """Initialise le vectorstore avec le reglement interieur."""
        if self._initialized:
            return

        try:
            # Embeddings multilingues
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            )

            # Decoupage du texte en chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=100,
                separators=["\n\n", "\n", "Article", ". ", " "],
            )

            chunks = text_splitter.split_text(REGLEMENT_INTERIEUR)

            # Creer le vectorstore
            self.vectorstore = Chroma.from_texts(
                texts=chunks,
                embedding=self.embeddings,
                persist_directory=CHROMA_PERSIST_DIR,
                collection_name="reglement_interieur",
            )

            self._initialized = True

        except Exception as e:
            print(f"[RAG] Erreur initialisation: {e}")
            self._initialized = False

    def query(self, question: str) -> dict:
        """Interroge le reglement interieur via RAG."""

        if not self._initialized:
            self.initialize()

        if not self._initialized or self.vectorstore is None:
            return {
                "reponse": "Le service RAG n'est pas disponible actuellement.",
                "sources": [],
                "confiance": 0.0,
            }

        # Recherche de similarite
        docs = self.vectorstore.similarity_search_with_score(question, k=3)

        if not docs:
            return {
                "reponse": "Aucune information pertinente trouvee dans le reglement.",
                "sources": [],
                "confiance": 0.0,
            }

        # Construire le contexte
        context_parts = []
        sources = []
        total_score = 0.0

        for doc, score in docs:
            context_parts.append(doc.page_content)
            # Extraire le numero d'article
            article_num = self._extract_article_number(doc.page_content)
            sources.append({
                "article": article_num or "Section non numerotee",
                "page": None,
                "extrait": doc.page_content[:200],
            })
            total_score += (1 - score)  # ChromaDB: distance, donc 1-score = similarite

        avg_confidence = min(total_score / len(docs), 1.0)
        context = "\n\n".join(context_parts)

        # Generer la reponse (sans LLM externe, on fait du retrieval pur)
        reponse = self._generate_response(question, context, sources)

        return {
            "reponse": reponse,
            "sources": sources,
            "confiance": round(avg_confidence, 2),
        }

    def _extract_article_number(self, text: str) -> Optional[str]:
        """Extrait le numero d'article du texte."""
        import re
        match = re.search(r"Article\s+(\d+)", text)
        if match:
            return f"Article {match.group(1)}"
        return None

    def _generate_response(self, question: str, context: str, sources: list) -> str:
        """
        Genere une reponse structuree basee sur le contexte recupere.
        En production, ceci serait remplace par un appel LLM (GPT-4, etc.)
        """
        question_lower = question.lower()

        # Reponses intelligentes basees sur les articles recuperes
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

        if "pv" in question_lower or "validation" in question_lower:
            return (
                "Selon les Articles 38 et 48 : Les notes deviennent definitives "
                "apres validation du PV semestriel par le chef de filiere. "
                "Le PV est signe et archive a la scolarite. Aucune modification "
                "ulterieure n'est possible sauf erreur materielle constatee."
            )

        # Reponse generique basee sur le contexte
        return (
            f"D'apres le reglement interieur, voici les elements pertinents "
            f"concernant votre question :\n\n{context[:500]}"
        )


# Singleton
rag_service = RAGService()
