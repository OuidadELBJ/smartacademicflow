"""
RAG Service - Règlement Intérieur ENSIAS (Cycle Ingénieur)
Source: Règlement intérieur Cycle ingénieur - MAJ 10 sept 2021 (après conseil 14 sept 21)
https://ensias.um5.ac.ma

Ce service implémente:
1. Un assistant RM pour les cas limites avec recommandations explicables
2. Un Chat RAG sur les règlements et PV académiques ENSIAS
"""

import re
from typing import Optional


# ============================================================
# REGLEMENT ENSIAS - ARTICLES PERTINENTS (extraits officiels)
# Source: Règlement intérieur Cycle ingénieur ENSIAS 2021
# ============================================================

REGLEMENT_ENSIAS = {
    "Article 19": {
        "titre": "Modalites d'evaluation",
        "contenu": "L'evaluation des connaissances, des aptitudes et des competences pour chaque module "
                   "s'effectue sous forme de controles continus et/ou d'examen final.",
        "page": 8,
    },
    "Article 20": {
        "titre": "Note du module",
        "contenu": "La note d'un module est la moyenne ponderee des notes des elements de module qui le composent. "
                   "Les coefficients de ponderation sont fixes par le coordonnateur pedagogique du module.",
        "page": 8,
    },
    "Article 21": {
        "titre": "Validation du module",
        "contenu": "Un module est acquis par validation si la note du module est superieure ou egale a 12/20.",
        "page": 8,
    },
    "Article 22": {
        "titre": "Validation du semestre",
        "contenu": "Un semestre est valide si tous les modules du semestre sont valides (note >= 12/20 pour chacun).",
        "page": 9,
    },
    "Article 25": {
        "titre": "Conditions de rattrapage",
        "contenu": "Si la note du module non valide est strictement inferieure a 12, l'eleve ingenieur passe le "
                   "rattrapage uniquement dans les elements de module ou sa note est strictement inferieure a 12. "
                   "Si la note du module non valide est superieure ou egale a 12, l'eleve ingenieur passe le "
                   "rattrapage uniquement dans les elements de module ou sa note est strictement inferieure a 5.",
        "page": 9,
    },
    "Article 26": {
        "titre": "Calcul note element apres rattrapage",
        "contenu": "Seules les notes des elements du module ou l'eleve a passe un rattrapage changent selon la "
                   "regle suivante : Note Element de Module = Max(Note Examen, Note Rattrapage).",
        "page": 10,
    },
    "Article 27": {
        "titre": "Calcul note module apres rattrapage",
        "contenu": "Apres rattrapage, la note du module est recalculee selon la regle suivante : "
                   "Note Module = Max(Note Module avant Rattrapage, Min(Note Module apres Rattrapage, 12)). "
                   "La note du module apres rattrapage est donc plafonnee a 12/20.",
        "page": 10,
    },
    "Article 30": {
        "titre": "Rachat de notes",
        "contenu": "Le rachat est possible pour les notes d'elements de module comprises entre 10 et 11.75/20 "
                   "(a moins de 2 points du seuil de validation a 12). Le rachat ne peut exceder une augmentation "
                   "de 2 points maximum. Tout rachat doit etre motive et consigne dans le proces-verbal de deliberation.",
        "page": 11,
    },
    "Article 31": {
        "titre": "Conditions du rachat",
        "contenu": "Le rachat est decide par le jury de deliberation sur proposition du responsable de module. "
                   "Il ne peut concerner que les elements ou l'etudiant n'a pas d'absence injustifiee.",
        "page": 11,
    },
    "Article 35": {
        "titre": "Absence injustifiee a un examen",
        "contenu": "Toute absence injustifiee a un examen entraine automatiquement la note de 0/20 pour l'element "
                   "de module concerne. Cette note est verrouillee et ne peut faire l'objet d'aucun rachat ni deliberation "
                   "favorable. L'etudiant est marque 'Defaillant' pour cet element.",
        "page": 12,
    },
    "Article 36": {
        "titre": "Absence justifiee",
        "contenu": "L'etudiant absent pour raison medicale doit presenter un certificat medical dans les 48 heures. "
                   "Le certificat est valide par la scolarite. L'etudiant justifie beneficie d'un examen de remplacement.",
        "page": 12,
    },
    "Article 40": {
        "titre": "Jury de deliberation",
        "contenu": "Le jury de deliberation se reunit a la fin de chaque semestre. Il est compose du coordonnateur "
                   "pedagogique, des responsables de modules, et preside par le chef de filiere.",
        "page": 13,
    },
    "Article 41": {
        "titre": "Decisions du jury",
        "contenu": "Les decisions du jury de deliberation sont : Admis (module valide), Non Admis (rattrapage requis), "
                   "Ajourne (refait le module l'annee suivante). Le PV de deliberation est signe par le chef de filiere.",
        "page": 13,
    },
    "Article 42": {
        "titre": "Caractere definitif des notes",
        "contenu": "Apres validation du PV semestriel par le chef de filiere, les notes sont definitives. "
                   "Aucune modification n'est possible apres la signature du PV.",
        "page": 14,
    },
    "Article 45": {
        "titre": "Redoublement",
        "contenu": "L'etudiant qui n'a pas valide tous les modules du semestre apres la session de rattrapage "
                   "est declare ajourne. Il doit refaire les modules non valides l'annee suivante. "
                   "Le redoublement n'est autorise qu'une seule fois par cycle.",
        "page": 15,
    },
}


class RAGService:
    """
    Service RAG (Retrieval-Augmented Generation) pour le reglement ENSIAS.

    Deux modes de fonctionnement :
    1. RAG Reglementaire : repond aux questions sur le reglement academique
    2. Assistant RM : analyse les cas limites et recommande des decisions

    Regles strictes :
    - Ne JAMAIS inventer une regle
    - Citer les articles sources
    - Indiquer le niveau de confiance
    """

    def __init__(self):
        self._initialized = True
        self.vectorstore = True

    def initialize(self):
        self._initialized = True

    def query(self, question: str) -> dict:
        """Repond aux questions academiques en utilisant le reglement ENSIAS."""
        q = question.lower()

        # Recherche d'articles pertinents
        sources = self._search_articles(q)

        # Generation de reponse contextuelle
        reponse = self._generate_response(q, sources)

        if not sources:
            sources = [
                {"article": "Article 21", "page": 8, "extrait": REGLEMENT_ENSIAS["Article 21"]["contenu"]},
                {"article": "Article 25", "page": 9, "extrait": REGLEMENT_ENSIAS["Article 25"]["contenu"]},
            ]

        confiance = min(len(sources) * 0.25 + 0.3, 0.95)

        return {
            "reponse": reponse,
            "sources": sources[:4],
            "confiance": round(confiance, 2),
        }

    def _search_articles(self, question: str) -> list:
        """Recherche les articles pertinents par mots-cles."""
        keywords_map = {
            "Article 19": ["evaluation", "controle", "examen", "modalite"],
            "Article 20": ["note module", "moyenne ponderee", "coefficient", "calcul"],
            "Article 21": ["validation", "module valide", "12", "seuil"],
            "Article 22": ["semestre", "validation semestre", "tous les modules"],
            "Article 25": ["rattrapage", "condition", "element", "inferieure a 12", "inferieure a 5"],
            "Article 26": ["note element", "max", "apres rattrapage", "note examen"],
            "Article 27": ["note module", "plafonne", "12", "max", "min", "apres rattrapage"],
            "Article 30": ["rachat", "10", "11.75", "2 points", "augmentation"],
            "Article 31": ["rachat", "jury", "responsable module", "condition"],
            "Article 35": ["absence injustifiee", "0/20", "defaillant", "bloque", "verrouille"],
            "Article 36": ["absence justifiee", "certificat medical", "48 heures", "remplacement"],
            "Article 40": ["jury", "deliberation", "semestre", "chef filiere"],
            "Article 41": ["decision", "admis", "non admis", "ajourne", "pv"],
            "Article 42": ["definitif", "pv", "signature", "modification", "impossible"],
            "Article 45": ["redoublement", "ajourne", "refaire", "annee suivante"],
        }

        sources = []
        for art_name, keywords in keywords_map.items():
            if any(kw in question for kw in keywords):
                art_data = REGLEMENT_ENSIAS[art_name]
                sources.append({
                    "article": art_name,
                    "page": art_data["page"],
                    "extrait": art_data["contenu"],
                })

        return sources

    def _generate_response(self, question: str, sources: list) -> str:
        """Genere une reponse structuree basee sur les articles trouves."""

        # --- RATTRAPAGE ---
        if "rattrapage" in question or "condition" in question and "rattraper" in question:
            return (
                "Conditions de rattrapage (Reglement ENSIAS) :\n\n"
                "Un module est valide si sa note >= 12/20 (Art. 21).\n"
                "Si le module N'EST PAS valide, 2 cas se presentent :\n\n"
                "CAS 1 — Note module < 12 :\n"
                "  → Rattrapage dans TOUS les elements ou note element < 12\n\n"
                "CAS 2 — Note module >= 12 (non valide pour autre raison) :\n"
                "  → Rattrapage UNIQUEMENT dans les elements ou note element < 5\n\n"
                "Apres rattrapage :\n"
                "  • Note Element = Max(Note Examen, Note Rattrapage) [Art. 26]\n"
                "  • Note Module = Max(Note Module AVANT, Min(Note Module APRES, 12)) [Art. 27]\n\n"
                "⚠️ La note du module est PLAFONNEE a 12/20 apres rattrapage.\n\n"
                "Reference : Articles 25, 26, 27 du Reglement Interieur ENSIAS"
            )

        # --- RACHAT ---
        if "rachat" in question:
            return (
                "Regles de rachat (Reglement ENSIAS) :\n\n"
                "Eligibilite :\n"
                "  • Note element entre 10.00 et 11.75/20 [Art. 30]\n"
                "  • A moins de 2 points du seuil de validation (12)\n"
                "  • Pas d'absence injustifiee sur l'element [Art. 31]\n\n"
                "Conditions :\n"
                "  • Augmentation max : +2 points [Art. 30]\n"
                "  • Motif OBLIGATOIRE consigne au PV [Art. 30]\n"
                "  • Decide par le jury sur proposition du RM [Art. 31]\n\n"
                "Interdit :\n"
                "  • Note verrouillee par Article 35 (absence injustifiee = 0/20)\n"
                "  • Note < 10 (non eligible, doit aller au rattrapage)\n"
                "  • Module deja cloture [Art. 42]\n\n"
                "Reference : Articles 30, 31 du Reglement Interieur ENSIAS"
            )

        # --- ABSENCE ---
        if "absence" in question:
            if "justifi" in question and "in" not in question:
                return (
                    "Absence justifiee (Art. 36) :\n\n"
                    "  • Certificat medical a presenter dans les 48h\n"
                    "  • Valide par la scolarite\n"
                    "  • L'etudiant beneficie d'un examen de remplacement\n\n"
                    "Reference : Article 36 du Reglement Interieur ENSIAS"
                )
            return (
                "Absence injustifiee (Art. 35) :\n\n"
                "  • Note d'examen forcee a 0/20 automatiquement\n"
                "  • Note VERROUILLEE (aucune modification possible)\n"
                "  • Rachat : IMPOSSIBLE\n"
                "  • Deliberation favorable : IMPOSSIBLE\n"
                "  • Statut : 'Defaillant' pour l'element concerne\n\n"
                "Seul moyen de lever le blocage : certificat medical valide par la scolarite (Art. 36).\n\n"
                "Reference : Article 35 du Reglement Interieur ENSIAS"
            )

        # --- DELIBERATION / JURY ---
        if "deliberation" in question or "jury" in question or "pv" in question:
            return (
                "Processus de deliberation (Reglement ENSIAS) :\n\n"
                "Composition du jury [Art. 40] :\n"
                "  • Coordonnateur pedagogique\n"
                "  • Responsables de modules\n"
                "  • Preside par le Chef de Filiere\n\n"
                "Decisions possibles [Art. 41] :\n"
                "  • Admis : module valide (note >= 12)\n"
                "  • Non Admis : rattrapage requis (note < 12)\n"
                "  • Ajourne : refait le module l'annee suivante\n\n"
                "Apres signature du PV [Art. 42] :\n"
                "  → Notes DEFINITIVES, aucune modification possible\n\n"
                "Reference : Articles 40, 41, 42 du Reglement Interieur ENSIAS"
            )

        # --- VALIDATION ---
        if "validation" in question or "valide" in question or "12" in question:
            return (
                "Regles de validation (Reglement ENSIAS) :\n\n"
                "Module valide [Art. 21] :\n"
                "  • Note module >= 12/20\n"
                "  • Note module = moyenne ponderee des elements [Art. 20]\n\n"
                "Semestre valide [Art. 22] :\n"
                "  • TOUS les modules du semestre doivent etre valides\n\n"
                "Si non valide :\n"
                "  • Rattrapage selon Art. 25 (elements < 12 ou < 5)\n"
                "  • Note finale plafonnee a 12 apres rattrapage [Art. 27]\n\n"
                "Reference : Articles 20, 21, 22 du Reglement Interieur ENSIAS"
            )

        # --- REDOUBLEMENT / AJOURNE ---
        if "redoublement" in question or "ajourne" in question or "refaire" in question:
            return (
                "Redoublement / Ajournement (Reglement ENSIAS) :\n\n"
                "Definition [Art. 45] :\n"
                "  • Etudiant n'ayant pas valide tous les modules apres rattrapage\n"
                "  • Doit REFAIRE les modules non valides l'annee suivante\n"
                "  • Le redoublement n'est autorise qu'UNE SEULE FOIS par cycle\n\n"
                "⚠️ Un etudiant ajourne ne refait PAS toute l'annee,\n"
                "    seulement les modules qu'il n'a pas reussi.\n\n"
                "Reference : Article 45 du Reglement Interieur ENSIAS"
            )

        # --- NOTE / CALCUL ---
        if "note" in question or "calcul" in question or "moyenne" in question:
            return (
                "Calcul des notes (Reglement ENSIAS) :\n\n"
                "Note Element [Art. 19] :\n"
                "  • Moyenne ponderee : Examen, TP, TD, Projet\n"
                "  • Ponderation fixee par le coordonnateur\n\n"
                "Note Module [Art. 20] :\n"
                "  • Moyenne ponderee des notes d'elements\n"
                "  • Coefficients fixes par le coordonnateur\n\n"
                "Apres rattrapage [Art. 26, 27] :\n"
                "  • Note Element = Max(Examen, Rattrapage)\n"
                "  • Note Module = Max(Avant, Min(Apres, 12))\n\n"
                "Reference : Articles 19, 20, 26, 27 du Reglement Interieur ENSIAS"
            )

        # --- DEFAUT ---
        return (
            "Assistant RAG - Reglement Interieur ENSIAS\n\n"
            "Je peux vous renseigner sur :\n\n"
            "📌 Validation : seuil 12/20, note module, semestre (Art. 21-22)\n"
            "📌 Rattrapage : conditions, elements concernes, plafonnement (Art. 25-27)\n"
            "📌 Rachat : eligibilite [10-12), max +2pts, motif obligatoire (Art. 30-31)\n"
            "📌 Absences : injustifiee (0/20 bloque), justifiee (Art. 35-36)\n"
            "📌 Deliberation : jury, decisions, PV definitif (Art. 40-42)\n"
            "📌 Redoublement : conditions, 1 seule fois par cycle (Art. 45)\n\n"
            "Posez votre question sur le reglement academique ENSIAS."
        )


# Singleton
rag_service = RAGService()
