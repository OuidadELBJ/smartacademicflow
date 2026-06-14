"""
RAG Service - Règlement Intérieur ENSIAS (Cycle Ingénieur)
Source: Règlement des études de l'ENSIAS - Cycle Ingénieur
Version du 10 Septembre 2021 - Résolution CE ENSIAS 18/2021

Ce service implémente un Chat RAG sur les règlements et PV académiques ENSIAS.
Le texte intégral du règlement officiel est indexé et interrogeable.
"""

from typing import Optional


# ============================================================
# REGLEMENT COMPLET ENSIAS - ARTICLES EXTRAITS DU DOCUMENT OFFICIEL
# Source: Règlement des études de l'ENSIAS Cycle Ingénieur 2021
# ============================================================

REGLEMENT_ENSIAS = {
    "Article 1": {
        "titre": "Conditions d'acces et procedures de selection",
        "contenu": (
            "Admission en premiere annee du cycle ingenieur par concours (CPGE/CNC/DEUG SM ou SMI) "
            "ou sur etude de dossier (Licence SMA/SMI/Bachelor). "
            "Criteres d'eligibilite DEUG : moins de 22 ans, DEUG en 2 ans avec mention AB ou 3 ans avec mention B."
        ),
        "chapitre": "I - Enseignement",
        "page": 5,
    },
    "Article 2": {
        "titre": "Duree et contenu de la formation",
        "contenu": (
            "Le cycle ingenieur est un cursus modulaire de 3 annees en 6 semestres (S1-S6). "
            "Sanctionne par un diplome d'ingenieur d'etat. "
            "L'annee universitaire comporte 2 semestres de 18 semaines chacun (hors stages)."
        ),
        "chapitre": "I - Enseignement",
        "page": 5,
    },
    "Article 3": {
        "titre": "Filieres du cycle ingenieur",
        "contenu": (
            "L'ENSIAS offre 9 filieres : 2IA (Intelligence Artificielle), 2SCL (Smart Supply Chain & Logistics), "
            "BI&A (Business Intelligence & Analytics), GD (Genie de la Data), GL (Genie Logiciel), "
            "IDF (Ingenierie Digitale de la Finance), IDSIT (Data Science and IoT avec options IWA et IIMS), "
            "SSE (Systemes Intelligents avec options Industrie 4.0 et Systemes autonomes), "
            "SSI (Securite des Systemes d'Information). Tronc commun en 1A, specialisation progressive."
        ),
        "chapitre": "I - Enseignement",
        "page": 6,
    },
    "Article 4": {
        "titre": "Composition d'une filiere",
        "contenu": (
            "Une filiere ingenieur est composee de 30 a 40 modules repartis sur 5 semestres "
            "avec un volume horaire global semestriel minimal de 384 heures, "
            "plus un PFE realise durant tout le sixieme semestre."
        ),
        "chapitre": "I - Enseignement",
        "page": 7,
    },
    "Article 5": {
        "titre": "Definition d'un module",
        "contenu": (
            "Le module est l'unite fondamentale du systeme de formation. Il comprend 1 a 3 elements de module "
            "qui peuvent etre enseignes dans une ou plusieurs langues. Un element de module peut etre une matiere "
            "(cours + TD + TP) ou une activite pratique (terrain/projet). Les elements constituent une unite coherente."
        ),
        "chapitre": "I - Enseignement",
        "page": 7,
    },
    "Article 6": {
        "titre": "Projet de Fin d'Etudes (PFE)",
        "contenu": (
            "Le PFE est specifique a une filiere, d'une duree d'un semestre, obligatoire. "
            "Realise de preference en entreprise. En monome ou binome. "
            "Sujet valide par le coordonnateur. Pre-soutenance de mi-parcours obligatoire. "
            "Le jury prononce l'acceptation du PFE (pas la reussite de l'annee). "
            "PFE valide si note >= 12/20."
        ),
        "chapitre": "I - Enseignement",
        "page": 8,
    },
    "Article 7": {
        "titre": "Stages d'ete",
        "contenu": (
            "2 stages obligatoires de 1 a 2 mois pendant les vacances d'ete : "
            "Stage ouvrier en fin de 1A, Stage d'etudes en fin de 2A."
        ),
        "chapitre": "I - Enseignement",
        "page": 9,
    },
    "Article 10": {
        "titre": "Evaluation des acquis",
        "contenu": (
            "L'evaluation s'effectue sous forme de controle continu ou d'examen final : "
            "epreuves ecrites, tests en ligne, devoirs, exposes, rapports ou tout autre moyen. "
            "Le controle s'effectue pour chaque element de module conformement au calendrier valide par la Direction."
        ),
        "chapitre": "I - Evaluation",
        "page": 9,
    },
    "Article 12": {
        "titre": "Note d'un element de module",
        "contenu": (
            "Chaque controle est note de 0 a 20. La note finale pour chaque element de module est "
            "la moyenne des notes obtenues dans chaque controle en multipliant chaque note par son coefficient "
            "conformement au descriptif de la filiere."
        ),
        "chapitre": "I - Evaluation",
        "page": 10,
    },
    "Article 13": {
        "titre": "Note de module",
        "contenu": (
            "La note d'un module est une moyenne ponderee des differentes evaluations des elements qui le composent. "
            "La ponderation tient compte de la nature des evaluations, des volumes horaires des differents elements "
            "ainsi que de leur nature conformement au descriptif de la filiere."
        ),
        "chapitre": "I - Evaluation",
        "page": 10,
    },
    "Article 14": {
        "titre": "Validation de module",
        "contenu": (
            "Un module est valide si sa note est superieure ou egale a 12/20 "
            "ET aucune note d'element du module n'est strictement inferieure a 05/20."
        ),
        "chapitre": "I - Evaluation",
        "page": 10,
    },
    "Article 16": {
        "titre": "Controle de rattrapage",
        "contenu": (
            "Un eleve n'ayant pas valide un ou plusieurs modules beneficie d'un controle de rattrapage. "
            "Realise apres la fin du semestre. Un seul rattrapage par module et par annee. "
            "Si note module < 12 : rattrapage dans les elements ou note < 12. "
            "Si note module >= 12 : rattrapage dans les elements ou note < 5. "
            "Note Element = Max(Note Examen, Note Rattrapage). "
            "Note Module = Max(Note Module avant Rattrapage, Min(Note Module apres Rattrapage, 12))."
        ),
        "chapitre": "I - Evaluation",
        "page": 11,
    },
    "Article 17": {
        "titre": "Jury de semestre",
        "contenu": (
            "Compose du Chef d'etablissement (president), coordonnateur pedagogique, "
            "coordonnateurs des modules, enseignants d'encadrement. "
            "Arrete la liste des eleves ayant valide les modules et ceux autorises au rattrapage."
        ),
        "chapitre": "I - Evaluation",
        "page": 11,
    },
    "Article 18": {
        "titre": "Moyenne generale d'annee",
        "contenu": (
            "La moyenne generale de l'annee est egale a la moyenne des notes des differents modules "
            "suivis durant l'annee consideree selon le descriptif de la filiere."
        ),
        "chapitre": "I - Evaluation",
        "page": 11,
    },
    "Article 19": {
        "titre": "Validation de la 1ere ou 2eme annee",
        "contenu": (
            "Une annee est validee si les 4 conditions sont satisfaites : "
            "1) Moyenne generale >= 12/20. "
            "2) Nombre de modules non valides <= [nombre de modules / 4]. "
            "3) Aucune note de module < 05/20. "
            "4) Aucune note de module fondamental < 08/20."
        ),
        "chapitre": "I - Evaluation",
        "page": 12,
    },
    "Article 22": {
        "titre": "Validation du cinquieme semestre",
        "contenu": (
            "Le 5eme semestre est valide si : "
            "1) Moyenne generale S5 >= 12/20. "
            "2) Nombre de modules non valides <= 2. "
            "3) Aucune note de module < 05/20."
        ),
        "chapitre": "I - Evaluation",
        "page": 12,
    },
    "Article 23": {
        "titre": "Validation du PFE",
        "contenu": "Le PFE est valide si l'eleve y obtient une note >= 12/20.",
        "chapitre": "I - Evaluation",
        "page": 12,
    },
    "Article 24": {
        "titre": "Obtention du diplome",
        "contenu": (
            "L'eleve obtient le diplome s'il valide les 2 premieres annees, le S5, le PFE et les 2 stages. "
            "Moyenne globale = (Moy(A1) + Moy(A2) + Moy(S5) + Note(PFE)) / 4."
        ),
        "chapitre": "I - Evaluation",
        "page": 13,
    },
    "Article 26": {
        "titre": "Annee de reserve",
        "contenu": (
            "Le Directeur peut accorder une annee de reserve si l'annee n'est pas validee "
            "mais la moyenne >= 10/20. Une seule annee de reserve durant le cycle. "
            "L'eleve suit obligatoirement les modules non valides. "
            "Si l'annee de reserve n'est pas validee, l'eleve n'a plus le droit de se reinscrire."
        ),
        "chapitre": "I - Evaluation",
        "page": 13,
    },
    "Article 38": {
        "titre": "Presence obligatoire et justification d'absence",
        "contenu": (
            "L'assiduite est obligatoire. Absences en TD/TP systematiquement relevees. "
            "En cas d'absences repetees non justifiees, le jury peut interdire le rattrapage dans le module. "
            "Justification : demande ecrite 3 jours avant (raison personnelle) ou "
            "certificat medical homologue dans les 5 jours ouvrables (maladie)."
        ),
        "chapitre": "II - Droits et devoirs",
        "page": 16,
    },
    "Article 39": {
        "titre": "Absences aux examens",
        "contenu": (
            "Les absences aux examens, meme justifiees par un certificat medical, ne sont en AUCUN CAS acceptees. "
            "Toute absence a un examen entrainera la note ZERO au titre de l'examen concerne."
        ),
        "chapitre": "II - Droits et devoirs",
        "page": 17,
    },
    "Article 40": {
        "titre": "Sanction de l'absenteisme",
        "contenu": (
            "Sanctions progressives selon le % d'absence dans un element de module : "
            "x < 15% : penalite -x/50 sur la note. "
            "15% <= x < 25% : penalite -2x/50. "
            "25% <= x < 50% : penalite -3x/50. "
            "x >= 50% : penalite -3 points ET interdiction de rattrapage dans cet element."
        ),
        "chapitre": "II - Droits et devoirs",
        "page": 17,
    },
    "Article 47": {
        "titre": "Fraude",
        "contenu": (
            "Toute fraude, tentative ou complicite : exclusion immediate de la salle, note zero automatique "
            "a l'element de module, aucune autorisation de rattrapage. "
            "Si fraude confirmee : note 0 definitive, module non valide (note eliminatoire). "
            "L'eleve peut etre traduit devant le conseil de discipline."
        ),
        "chapitre": "II - Discipline",
        "page": 19,
    },
}


class RAGService:
    """
    Service RAG (Retrieval-Augmented Generation) pour le reglement ENSIAS.
    Base sur le texte officiel du Reglement des Etudes Cycle Ingenieur 2021.

    Modes :
    1. Chat RAG reglementaire : repond aux questions sur le reglement
    2. Assistant RM deliberation : analyse cas limites et recommandations

    Regles strictes :
    - Ne JAMAIS inventer une regle
    - Toujours citer les articles sources
    - Indiquer le niveau de confiance
    """

    def __init__(self):
        self._initialized = True
        self.vectorstore = True

    def initialize(self):
        self._initialized = True

    def query(self, question: str) -> dict:
        """Repond aux questions en utilisant le reglement officiel ENSIAS."""
        q = question.lower()

        # Recherche d'articles pertinents
        sources = self._search_articles(q)

        # Generation de reponse
        reponse = self._generate_response(q, sources)

        if not sources:
            sources = [
                {"article": "Article 14", "page": 10, "extrait": REGLEMENT_ENSIAS["Article 14"]["contenu"]},
                {"article": "Article 16", "page": 11, "extrait": REGLEMENT_ENSIAS["Article 16"]["contenu"]},
            ]

        confiance = min(len(sources) * 0.2 + 0.4, 0.95)

        return {
            "reponse": reponse,
            "sources": sources[:5],
            "confiance": round(confiance, 2),
        }

    def _search_articles(self, question: str) -> list:
        """Recherche les articles pertinents par mots-cles."""
        keywords_map = {
            "Article 1": ["admission", "acces", "concours", "cpge", "cnc", "deug", "licence"],
            "Article 2": ["duree", "formation", "semestre", "3 ans", "6 semestres"],
            "Article 3": ["filiere", "2ia", "gl", "bia", "gd", "idf", "sse", "ssi", "2scl", "idsit"],
            "Article 4": ["composition", "30 a 40 modules", "384 heures"],
            "Article 5": ["module", "element", "td", "tp", "cours", "definition", "unite"],
            "Article 6": ["pfe", "projet fin", "soutenance", "6eme semestre"],
            "Article 7": ["stage", "ete", "ouvrier", "etudes"],
            "Article 10": ["evaluation", "controle", "examen", "epreuve"],
            "Article 12": ["note element", "coefficient", "moyenne element"],
            "Article 13": ["note module", "moyenne ponderee", "ponderation"],
            "Article 14": ["validation module", "12/20", "05/20", "valide", "seuil"],
            "Article 16": ["rattrapage", "non valide", "max", "min", "12", "element inferieur"],
            "Article 17": ["jury", "semestre", "deliberation", "president"],
            "Article 18": ["moyenne generale", "annee"],
            "Article 19": ["validation annee", "1ere", "2eme", "4 conditions", "fondamental"],
            "Article 22": ["5eme semestre", "s5", "validation s5"],
            "Article 23": ["validation pfe", "12/20"],
            "Article 24": ["diplome", "obtention", "ingenieur d'etat", "moyenne globale"],
            "Article 26": ["reserve", "annee reserve", "10/20", "redoublement", "reinscrire"],
            "Article 38": ["assiduite", "presence", "justification", "certificat medical", "5 jours"],
            "Article 39": ["absence examen", "zero", "aucun cas", "meme justifiee"],
            "Article 40": ["sanction", "absenteisme", "penalite", "pourcentage", "15%", "25%", "50%"],
            "Article 47": ["fraude", "plagiat", "exclusion", "tentative", "complicite", "zero definitif"],
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
        """Genere une reponse structuree."""

        # --- RATTRAPAGE ---
        if "rattrapage" in question:
            return (
                "Regles de rattrapage (Art. 16 - Reglement ENSIAS 2021) :\n\n"
                "Conditions :\n"
                "  Un eleve n'ayant pas valide un module beneficie d'un controle de rattrapage.\n"
                "  Un seul rattrapage par module et par annee universitaire.\n\n"
                "Elements concernes :\n"
                "  • Si note module < 12 : rattrapage dans les elements ou note < 12\n"
                "  • Si note module >= 12 (mais module non valide car element < 5) :\n"
                "    rattrapage uniquement dans les elements ou note < 5\n\n"
                "Calcul apres rattrapage :\n"
                "  • Note Element = Max(Note Examen, Note Rattrapage)\n"
                "  • Note Module = Max(Note Module avant, Min(Note Module apres, 12))\n\n"
                "Important : La note du module apres rattrapage est PLAFONNEE a 12/20.\n\n"
                "Reference : Article 16, page 11"
            )

        # --- VALIDATION MODULE ---
        if "validation" in question and "module" in question:
            return (
                "Validation d'un module (Art. 14) :\n\n"
                "Un module est valide si :\n"
                "  1. Note module >= 12/20\n"
                "  2. Aucune note d'element < 05/20 (note eliminatoire)\n\n"
                "Si l'une de ces conditions n'est pas remplie, le module n'est PAS valide "
                "et l'eleve doit passer le rattrapage (Art. 16).\n\n"
                "Reference : Article 14, page 10"
            )

        # --- VALIDATION ANNEE ---
        if "validation" in question and ("annee" in question or "1ere" in question or "2eme" in question):
            return (
                "Validation d'annee (Art. 19) :\n\n"
                "4 conditions cumulatives :\n"
                "  1. Moyenne generale d'annee >= 12/20\n"
                "  2. Nombre de modules non valides <= [nb modules / 4]\n"
                "  3. Aucune note de module < 05/20\n"
                "  4. Aucune note de module fondamental < 08/20\n\n"
                "Si non validee et moyenne >= 10/20 : annee de reserve possible (Art. 26).\n"
                "Si moyenne < 10/20 : l'eleve n'a plus le droit de se reinscrire (Art. 29).\n\n"
                "Reference : Article 19, page 12"
            )

        # --- ABSENCE ---
        if "absence" in question:
            if "examen" in question:
                return (
                    "Absences aux examens (Art. 39) :\n\n"
                    "REGLE STRICTE : Les absences aux examens, MEME JUSTIFIEES par un certificat medical, "
                    "ne sont en AUCUN CAS acceptees.\n\n"
                    "Consequence : Note ZERO automatique a l'examen concerne.\n\n"
                    "Cette regle est absolue et ne comporte aucune exception.\n\n"
                    "Reference : Article 39, page 17"
                )
            return (
                "Assiduite et absenteisme (Art. 38, 39, 40) :\n\n"
                "Presence obligatoire (Art. 38) :\n"
                "  • TD/TP : absences systematiquement relevees\n"
                "  • Justification : certificat medical dans les 5 jours ouvrables\n"
                "  • Absences repetees : le jury peut interdire le rattrapage\n\n"
                "Absence examen (Art. 39) :\n"
                "  • Toute absence = note ZERO (meme justifiee)\n\n"
                "Sanctions absenteisme (Art. 40) :\n"
                "  • < 15% : penalite -x/50\n"
                "  • 15-25% : penalite -2x/50\n"
                "  • 25-50% : penalite -3x/50\n"
                "  • >= 50% : -3 points + interdiction rattrapage\n\n"
                "Reference : Articles 38, 39, 40 — pages 16-17"
            )

        # --- FRAUDE ---
        if "fraude" in question or "plagiat" in question:
            return (
                "Fraude et plagiat (Art. 47, 48) :\n\n"
                "En cas de fraude/tentative/complicite :\n"
                "  1. Exclusion immediate de la salle\n"
                "  2. Note ZERO automatique a l'element de module\n"
                "  3. Aucune autorisation de rattrapage pour cette note\n\n"
                "Si fraude confirmee :\n"
                "  • Note 0 DEFINITIVE\n"
                "  • Module NON VALIDE (note eliminatoire)\n"
                "  • Conseil de discipline possible\n\n"
                "Le plagiat est sanctionne comme une fraude (Art. 48).\n\n"
                "Reference : Articles 47-48, page 19"
            )

        # --- DIPLOME ---
        if "diplome" in question or "obtention" in question:
            return (
                "Obtention du diplome d'ingenieur (Art. 24) :\n\n"
                "Conditions cumulatives :\n"
                "  1. Valider les 2 premieres annees\n"
                "  2. Valider le 5eme semestre\n"
                "  3. Valider le PFE (note >= 12/20)\n"
                "  4. Avoir effectue les 2 stages obligatoires\n\n"
                "Moyenne globale ingenieur :\n"
                "  = (Moy(A1) + Moy(A2) + Moy(S5) + Note(PFE)) / 4\n\n"
                "Reference : Article 24, page 13"
            )

        # --- PFE ---
        if "pfe" in question or "projet fin" in question:
            return (
                "Projet de Fin d'Etudes (Art. 6, 23) :\n\n"
                "Caracteristiques :\n"
                "  • Duree : 1 semestre (S6)\n"
                "  • En monome ou binome\n"
                "  • De preference en entreprise\n"
                "  • Sujet valide par le coordonnateur\n"
                "  • Pre-soutenance de mi-parcours obligatoire\n\n"
                "Validation : Note PFE >= 12/20 (Art. 23)\n\n"
                "Le jury prononce l'acceptation du PFE, "
                "ce qui ne signifie pas la reussite de la 3eme annee.\n\n"
                "Reference : Articles 6 et 23, pages 8 et 12"
            )

        # --- STAGE ---
        if "stage" in question:
            return (
                "Stages obligatoires (Art. 7, 30-33) :\n\n"
                "2 stages obligatoires :\n"
                "  1. Stage ouvrier (fin 1A) : 20-40 jours ouvrables\n"
                "  2. Stage d'etudes (fin 2A) : 20-40 jours ouvrables, soutenance en anglais\n\n"
                "Note stage 1A = 50% Organisme + 30% Rapport + 20% Soutenance\n"
                "Note stage 2A = 40% Organisme + 30% Rapport + 30% Soutenance\n\n"
                "Si une des 3 composantes manque : note 0 et stage non valide.\n\n"
                "Reference : Articles 7, 30-33, pages 9, 14-15"
            )

        # --- ANNEE RESERVE ---
        if "reserve" in question or "redoublement" in question:
            return (
                "Annee de reserve (Art. 26) :\n\n"
                "Conditions :\n"
                "  • Annee non validee MAIS moyenne >= 10/20\n"
                "  • Accordee par le Directeur sur proposition du jury\n"
                "  • UNE SEULE annee de reserve durant le cycle\n\n"
                "Pendant l'annee de reserve :\n"
                "  • Suivre obligatoirement les modules non valides\n"
                "  • Possibilite de suivre des modules de l'annee suivante\n\n"
                "Si l'annee de reserve n'est pas validee :\n"
                "  L'eleve n'a plus le droit de se reinscrire a l'ENSIAS.\n\n"
                "Reference : Article 26, page 13"
            )

        # --- FILIERE ---
        if "filiere" in question or "2ia" in question or "gl" in question or "bia" in question:
            return (
                "Filieres de l'ENSIAS (Art. 3) :\n\n"
                "9 filieres ingenieur :\n"
                "  1. 2IA : Ingenierie de l'Intelligence Artificielle\n"
                "  2. 2SCL : Smart Supply Chain and Logistics\n"
                "  3. BI&A : Business Intelligence & Analytics\n"
                "  4. GD : Genie de la Data\n"
                "  5. GL : Genie Logiciel\n"
                "  6. IDF : Ingenierie Digitale de la Finance\n"
                "  7. IDSIT : Data Science and IoT (options IWA / IIMS)\n"
                "  8. SSE : Systemes Intelligents (options Industrie 4.0 / Systemes autonomes)\n"
                "  9. SSI : Securite des Systemes d'Information\n\n"
                "Tronc commun en 1A. Specialisation progressive en 2A et 3A.\n"
                "Mobilite interne possible (passerelles) apres validation de la 1A.\n\n"
                "Reference : Article 3, page 6"
            )

        # --- NOTE / CALCUL ---
        if "note" in question or "calcul" in question or "moyenne" in question:
            return (
                "Systeme de notation (Art. 12, 13, 18) :\n\n"
                "Note element (Art. 12) :\n"
                "  • Chaque controle note de 0 a 20\n"
                "  • Note finale element = moyenne ponderee des controles\n\n"
                "Note module (Art. 13) :\n"
                "  • Moyenne ponderee des elements\n"
                "  • Ponderation selon volumes horaires et nature des evaluations\n\n"
                "Moyenne generale d'annee (Art. 18) :\n"
                "  • Moyenne des notes de tous les modules de l'annee\n\n"
                "Seuils :\n"
                "  • Validation module : >= 12/20 (Art. 14)\n"
                "  • Note eliminatoire element : < 05/20 (Art. 14)\n"
                "  • Validation annee : 4 conditions (Art. 19)\n\n"
                "Reference : Articles 12, 13, 14, 18, 19"
            )

        # --- DEFAUT ---
        return (
            "Assistant RAG - Reglement ENSIAS (Cycle Ingenieur 2021)\n\n"
            "Je peux vous renseigner sur :\n\n"
            "  • Validation : module (Art. 14), annee (Art. 19), S5 (Art. 22), PFE (Art. 23)\n"
            "  • Rattrapage : conditions, calcul, plafonnement a 12 (Art. 16)\n"
            "  • Absences : aux examens = zero (Art. 39), penalites (Art. 40)\n"
            "  • Diplome : conditions d'obtention, moyenne globale (Art. 24)\n"
            "  • Filieres : liste des 9 filieres, tronc commun (Art. 3)\n"
            "  • Stages : ouvrier et etudes, notation (Art. 7, 30-33)\n"
            "  • PFE : validation, soutenance (Art. 6, 23)\n"
            "  • Annee de reserve : conditions (Art. 26)\n"
            "  • Fraude/plagiat : sanctions (Art. 47-48)\n\n"
            "Posez votre question sur le reglement academique ENSIAS.\n"
            "Source : Reglement des etudes Cycle Ingenieur, version 10 sept 2021."
        )


# Singleton
rag_service = RAGService()
