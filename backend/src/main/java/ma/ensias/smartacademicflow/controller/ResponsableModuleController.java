package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.*;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.dto.*;
import ma.ensias.smartacademicflow.repository.*;
import ma.ensias.smartacademicflow.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/rm")
@RequiredArgsConstructor
public class ResponsableModuleController {

    private final DashboardService dashboardService;
    private final NoteService noteService;
    private final NoteCalculService noteCalculService;
    private final DeliberationService deliberationService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final RelanceRepository relanceRepository;

    /**
     * Dashboard RM avec KPIs reels
     */
    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        int totalModules = modules.size();
        int modulesEnCours = (int) modules.stream().filter(m -> m.getStatut() == ModuleStatut.EN_COURS).count();
        int modulesClotures = (int) modules.stream().filter(m -> m.getStatut() == ModuleStatut.CLOTURE).count();

        // KPIs avancement saisie
        List<Map<String, Object>> elementsProgress = new ArrayList<>();
        int totalNotesSaisies = 0;
        int totalNotesAttendues = 0;
        int totalNonAdmis = 0;      // etudiants dont note module < 12 (vont au rattrapage)
        int totalRattrapage = 0;     // elements a rattraper (note element < 12 dans modules non valides)
        int totalEligiblesRachat = 0; // notes element entre [10, 12) (rachat possible)

        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());

            // Compter etudiants attendus (basee sur prefix filiere)
            String filiereCode = mod.getFiliere().getCode().toLowerCase().replace("&", "");
            List<User> filiereEtudiants = userRepository.findAll().stream()
                .filter(u -> u.getEmail().startsWith(filiereCode + "."))
                .collect(Collectors.toList());
            long nbEtudiants = filiereEtudiants.size();

            for (ElementModule el : elements) {
                List<Note> notes = noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM);
                int nbNotes = notes.size();

                totalNotesSaisies += nbNotes;
                totalNotesAttendues += (int) nbEtudiants;

                // Compter notes eligibles au rachat : note element [10, 12)
                for (Note n : notes) {
                    double noteElement = noteCalculService.calculerNoteElement(el.getId(), n.getEtudiant().getId());
                    if (noteCalculService.isEligibleRachat(noteElement) && !n.isBlockedByArticle39() && !n.isRachete()) {
                        totalEligiblesRachat++;
                    }
                }

                double progression = nbEtudiants > 0 ? (double) nbNotes / nbEtudiants * 100 : 0;

                Map<String, Object> elMap = new HashMap<>();
                elMap.put("elementId", el.getId());
                elMap.put("elementIntitule", el.getIntitule());
                elMap.put("enseignantNom", el.getEnseignant().getNom() + " " + el.getEnseignant().getPrenom());
                elMap.put("enseignantEmail", el.getEnseignant().getEmail());
                elMap.put("notesSaisies", nbNotes);
                elMap.put("totalEtudiants", nbEtudiants);
                elMap.put("progression", Math.min(Math.round(progression), 100));
                elMap.put("moduleIntitule", mod.getIntitule());
                elMap.put("semestre", mod.getSemestre());
                elementsProgress.add(elMap);
            }

            // Compter etudiants non admis (note module < 12) et elements a rattraper
            for (User etu : filiereEtudiants) {
                double noteModule = noteCalculService.calculerNoteModule(mod.getId(), etu.getId());
                if (noteModule > 0 && noteModule < 12.0) {
                    totalNonAdmis++;
                    // Compter elements a rattraper
                    List<Map<String, Object>> elementsRatt = noteCalculService.getElementsARattraper(mod.getId(), etu.getId());
                    totalRattrapage += elementsRatt.size();
                }
            }
        }

        double progressionGlobale = totalNotesAttendues > 0
            ? Math.round((double) totalNotesSaisies / totalNotesAttendues * 100) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("totalModules", totalModules);
        result.put("modulesEnCours", modulesEnCours);
        result.put("modulesClotures", modulesClotures);
        result.put("totalNotesSaisies", totalNotesSaisies);
        result.put("totalNotesAttendues", totalNotesAttendues);
        result.put("progressionGlobale", progressionGlobale);
        result.put("totalNonAdmis", totalNonAdmis);
        result.put("totalRattrapage", totalRattrapage);
        result.put("totalEligiblesRachat", totalEligiblesRachat);
        result.put("elementsProgress", elementsProgress);

        return ResponseEntity.ok(result);
    }

    /**
     * Liste des cas limites (notes element entre [10, 12) - eligibles au rachat)
     */
    @GetMapping("/cas-limites")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getCasLimites(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        List<Map<String, Object>> casLimites = new ArrayList<>();

        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());

            String filiereCode = mod.getFiliere().getCode().toLowerCase().replace("&", "");
            List<User> filiereEtudiants = userRepository.findAll().stream()
                .filter(u -> u.getEmail().startsWith(filiereCode + "."))
                .collect(Collectors.toList());

            for (ElementModule el : elements) {
                for (User etu : filiereEtudiants) {
                    double noteElement = noteCalculService.calculerNoteElement(el.getId(), etu.getId());
                    if (noteElement <= 0) continue;

                    // Eligible au rachat : note element entre [10, 12)
                    if (noteCalculService.isEligibleRachat(noteElement)) {
                        // Chercher la note EXAM pour avoir le noteId
                        Note noteExam = noteRepository.findByEtudiantIdAndElementModuleIdAndTypeEvaluation(
                                etu.getId(), el.getId(), TypeEvaluation.EXAM).orElse(null);
                        if (noteExam == null || noteExam.isBlockedByArticle39()) continue;

                        Map<String, Object> cas = new HashMap<>();
                        cas.put("noteId", noteExam.getId());
                        cas.put("etudiantId", etu.getId());
                        cas.put("etudiantNom", etu.getNom());
                        cas.put("etudiantPrenom", etu.getPrenom());
                        cas.put("elementIntitule", el.getIntitule());
                        cas.put("moduleIntitule", mod.getIntitule());
                        cas.put("noteElement", noteElement);
                        cas.put("noteExam", noteExam.getValeur());
                        cas.put("ecartValidation", noteCalculService.ecartValidation(noteElement));
                        cas.put("isRachete", noteExam.isRachete());
                        cas.put("motifRachat", noteExam.getMotifRachat());
                        cas.put("noteModule", noteCalculService.calculerNoteModule(mod.getId(), etu.getId()));
                        casLimites.add(cas);
                    }
                }
            }
        }

        // Trier par ecart le plus petit (plus proche de 12)
        casLimites.sort((a, b) -> Double.compare((double) a.get("ecartValidation"), (double) b.get("ecartValidation")));

        return ResponseEntity.ok(casLimites);
    }

    /**
     * Synthese academique d'un etudiant (toutes ses notes par module/element)
     */
    @GetMapping("/etudiant/{etudiantId}/synthese")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getSyntheseEtudiant(
            @PathVariable Long etudiantId, Authentication auth) {
        User etudiant = userRepository.findById(etudiantId).orElseThrow();
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();

        List<Note> allNotes = noteRepository.findByEtudiantId(etudiantId);

        // Grouper par element
        Map<Long, List<Note>> notesByElement = allNotes.stream()
            .collect(Collectors.groupingBy(n -> n.getElementModule().getId()));

        List<Map<String, Object>> elements = new ArrayList<>();
        double sommeTotale = 0;
        int countModules = 0;

        for (Map.Entry<Long, List<Note>> entry : notesByElement.entrySet()) {
            List<Note> notes = entry.getValue();
            if (notes.isEmpty()) continue;

            ElementModule el = notes.get(0).getElementModule();
            Map<String, Object> elMap = new HashMap<>();
            elMap.put("elementIntitule", el.getIntitule());
            elMap.put("moduleIntitule", el.getModule().getIntitule());
            elMap.put("semestre", el.getModule().getSemestre());

            Double noteExam = null, noteTd = null, noteTp = null, noteProjet = null;
            for (Note n : notes) {
                switch (n.getTypeEvaluation()) {
                    case EXAM -> noteExam = n.getValeur();
                    case TD -> noteTd = n.getValeur();
                    case TP -> noteTp = n.getValeur();
                    case PROJET -> noteProjet = n.getValeur();
                }
            }
            elMap.put("noteExam", noteExam);
            elMap.put("noteTd", noteTd);
            elMap.put("noteTp", noteTp);
            elMap.put("noteProjet", noteProjet);
            elMap.put("isBlockedByArticle39", notes.stream().anyMatch(Note::isBlockedByArticle39));

            // Moyenne element (ponderee simplement)
            double sum = 0; int count = 0;
            if (noteExam != null) { sum += noteExam * 2; count += 2; }
            if (noteTd != null) { sum += noteTd; count += 1; }
            if (noteTp != null) { sum += noteTp; count += 1; }
            if (noteProjet != null) { sum += noteProjet * 1.5; count += 1; }
            double moyenne = count > 0 ? sum / count : 0;
            elMap.put("moyenne", Math.round(moyenne * 100.0) / 100.0);

            sommeTotale += moyenne;
            countModules++;

            elements.add(elMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("etudiantNom", etudiant.getNom());
        result.put("etudiantPrenom", etudiant.getPrenom());
        result.put("moyenneGenerale", countModules > 0 ? Math.round(sommeTotale / countModules * 100.0) / 100.0 : 0);
        result.put("elements", elements);
        result.put("totalElements", countModules);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/rachat")
    public ResponseEntity<NoteDTO> racheterNote(
            @Valid @RequestBody RachatRequest request,
            Authentication auth) {
        return ResponseEntity.ok(noteService.racheterNote(request, auth.getName()));
    }

    @PostMapping("/deliberation")
    public ResponseEntity<DeliberationModule> deliberer(
            @Valid @RequestBody DeliberationRequest request,
            Authentication auth) {
        return ResponseEntity.ok(deliberationService.deliberer(request, auth.getName()));
    }

    @PostMapping("/relance")
    public ResponseEntity<Map<String, String>> relancerEnseignant(
            @RequestBody Map<String, String> request,
            Authentication auth) {

        // Persister la relance en base
        User expediteur = userRepository.findByEmail(auth.getName()).orElseThrow();
        User enseignant = userRepository.findByEmail(request.get("email")).orElse(null);

        if (enseignant != null) {
            Relance relance = Relance.builder()
                    .enseignant(enseignant)
                    .expediteur(expediteur)
                    .moduleIntitule(request.get("moduleIntitule"))
                    .elementIntitule(request.get("elementIntitule"))
                    .message("La saisie des notes pour l'element \"" + request.get("elementIntitule")
                            + "\" du module \"" + request.get("moduleIntitule") + "\" est en retard. "
                            + "Merci de proceder a la saisie dans les plus brefs delais.")
                    .lu(false)
                    .build();
            relanceRepository.save(relance);
        }

        // Envoyer l'email de relance
        emailService.sendRelanceEmail(
                request.get("email"),
                request.get("enseignantNom"),
                request.get("moduleIntitule"),
                request.get("elementIntitule")
        );
        return ResponseEntity.ok(Map.of("message", "Relance envoyee avec succes"));
    }

    /**
     * Transmettre les notes d'un module au Chef de Filiere
     * Change le statut du module de EN_COURS vers TRANSMIS_CF
     */
    @PostMapping("/transmettre-cf/{moduleId}")
    @Transactional
    public ResponseEntity<Map<String, String>> transmettreAuCF(
            @PathVariable Long moduleId, Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module introuvable"));

        // Verifier que le RM est bien le responsable de ce module
        if (!module.getResponsable().getId().equals(rm.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Vous n'etes pas le responsable de ce module"));
        }

        // Verifier que le module est en cours
        if (module.getStatut() != ModuleStatut.EN_COURS) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ce module a deja ete transmis (statut: " + module.getStatut().name() + ")"));
        }

        module.setStatut(ModuleStatut.TRANSMIS_CF);
        module.setDateTransmissionCF(java.time.LocalDateTime.now());
        moduleRepository.save(module);

        return ResponseEntity.ok(Map.of("message", "Module \"" + module.getIntitule() + "\" transmis au Chef de Filiere avec succes"));
    }

    /**
     * Liste des modules du RM avec leur statut (pour la page suivi/transmission)
     */
    @GetMapping("/mes-modules")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMesModules(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        List<Map<String, Object>> result = new ArrayList<>();
        for (Module mod : modules) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", mod.getId());
            map.put("code", mod.getCode());
            map.put("intitule", mod.getIntitule());
            map.put("semestre", mod.getSemestre());
            map.put("statut", mod.getStatut().name());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Vue par module : liste des etudiants avec statut (ADMIS / RATTRAPAGE / BLOQUE)
     */
    @GetMapping("/module/{moduleId}/etudiants-statut")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getEtudiantsStatutModule(
            @PathVariable Long moduleId, Authentication auth) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module introuvable"));

        String filiereCode = module.getFiliere().getCode().toLowerCase().replace("&", "");
        List<User> filiereEtudiants = userRepository.findAll().stream()
                .filter(u -> u.getEmail().startsWith(filiereCode + "."))
                .collect(Collectors.toList());

        List<Map<String, Object>> etudiants = new ArrayList<>();
        int admisCount = 0, rattrapageCount = 0, bloqueCount = 0;

        for (User etu : filiereEtudiants) {
            double noteModule = noteCalculService.calculerNoteModule(moduleId, etu.getId());
            if (noteModule <= 0) continue;

            String statut;
            List<String> elementsRattrapage = new ArrayList<>();
            boolean hasBlocked = false;

            List<ElementModule> elements = elementModuleRepository.findByModuleId(moduleId);
            for (ElementModule el : elements) {
                var noteOpt = noteRepository.findByEtudiantIdAndElementModuleIdAndTypeEvaluation(
                        etu.getId(), el.getId(), TypeEvaluation.EXAM);
                if (noteOpt.isPresent() && noteOpt.get().isBlockedByArticle39()) {
                    hasBlocked = true;
                }
            }

            if (hasBlocked) {
                statut = "BLOQUE";
                bloqueCount++;
            } else if (noteModule >= 12.0) {
                statut = "ADMIS";
                admisCount++;
            } else {
                statut = "RATTRAPAGE";
                rattrapageCount++;
                List<Map<String, Object>> elemRatt = noteCalculService.getElementsARattraper(moduleId, etu.getId());
                elementsRattrapage = elemRatt.stream()
                        .map(e -> (String) e.get("elementIntitule"))
                        .collect(Collectors.toList());
            }

            Map<String, Object> etuMap = new HashMap<>();
            etuMap.put("etudiantId", etu.getId());
            etuMap.put("nom", etu.getNom());
            etuMap.put("prenom", etu.getPrenom());
            etuMap.put("noteModule", noteModule);
            etuMap.put("statut", statut);
            etuMap.put("elementsRattrapage", elementsRattrapage);
            etudiants.add(etuMap);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("moduleId", module.getId());
        result.put("moduleIntitule", module.getIntitule());
        result.put("moduleCode", module.getCode());
        result.put("semestre", module.getSemestre());
        result.put("totalEtudiants", etudiants.size());
        result.put("admis", admisCount);
        result.put("rattrapage", rattrapageCount);
        result.put("bloques", bloqueCount);
        result.put("etudiants", etudiants);

        return ResponseEntity.ok(result);
    }

    /**
     * Liste des etudiants en rattrapage pour TOUS les modules du RM
     */
    @GetMapping("/etudiants-rattrapage")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getEtudiantsRattrapage(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Module mod : modules) {
            String filiereCode = mod.getFiliere().getCode().toLowerCase().replace("&", "");
            List<User> filiereEtudiants = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().startsWith(filiereCode + "."))
                    .collect(Collectors.toList());

            for (User etu : filiereEtudiants) {
                double noteModule = noteCalculService.calculerNoteModule(mod.getId(), etu.getId());
                if (noteModule <= 0 || noteModule >= 12.0) continue;

                List<Map<String, Object>> elementsRatt = noteCalculService.getElementsARattraper(mod.getId(), etu.getId());
                if (elementsRatt.isEmpty()) continue;

                Map<String, Object> etuMap = new HashMap<>();
                etuMap.put("etudiantId", etu.getId());
                etuMap.put("nom", etu.getNom());
                etuMap.put("prenom", etu.getPrenom());
                etuMap.put("noteModule", noteModule);
                etuMap.put("moduleIntitule", mod.getIntitule());
                etuMap.put("moduleCode", mod.getCode());
                etuMap.put("semestre", mod.getSemestre());
                etuMap.put("elementsRattrapage", elementsRatt);
                etuMap.put("nbElementsRattrapage", elementsRatt.size());
                result.add(etuMap);
            }
        }

        result.sort((a, b) -> Double.compare((double) a.get("noteModule"), (double) b.get("noteModule")));
        return ResponseEntity.ok(result);
    }

    /**
     * Proxy vers le service RAG pour les questions reglementaires
     */
    @GetMapping("/rag-query")
    public ResponseEntity<Map<String, Object>> ragQuery(@RequestParam String question) {
        String aiServiceUrl = "http://ai-service:8000";

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = org.springframework.web.reactive.function.client.WebClient.create(aiServiceUrl)
                    .post()
                    .uri("/api/rag/query")
                    .bodyValue(Map.of("question", question))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "reponse", "Service IA temporairement indisponible. Veuillez reessayer.",
                    "sources", java.util.Collections.emptyList(),
                    "confiance", 0.0
            ));
        }
    }

    /**
     * Historique des rachats effectues (pour tracabilite PV)
     */
    @GetMapping("/historique-rachats")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getHistoriqueRachats(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());
            for (ElementModule el : elements) {
                List<Note> notes = noteRepository.findByElementModuleId(el.getId());
                for (Note n : notes) {
                    if (n.isRachete()) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("noteId", n.getId());
                        map.put("etudiantNom", n.getEtudiant().getNom());
                        map.put("etudiantPrenom", n.getEtudiant().getPrenom());
                        map.put("elementIntitule", el.getIntitule());
                        map.put("moduleIntitule", mod.getIntitule());
                        map.put("noteAvantRachat", n.getNoteAvantRachat());
                        map.put("noteApresRachat", n.getValeur());
                        map.put("motifRachat", n.getMotifRachat());
                        map.put("dateRachat", n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : null);
                        result.add(map);
                    }
                }
            }
        }

        // Trier par date (plus recent d'abord)
        result.sort((a, b) -> {
            String da = (String) a.get("dateRachat");
            String db = (String) b.get("dateRachat");
            if (da == null) return 1;
            if (db == null) return -1;
            return db.compareTo(da);
        });

        return ResponseEntity.ok(result);
    }

    /**
     * Proxy vers le service IA pour l'analyse d'un etudiant (deliberation)
     */
    @PostMapping("/analyse-ia")
    public ResponseEntity<Map<String, Object>> analyseIA(@RequestBody Map<String, Object> request) {
        String aiServiceUrl = "http://ai-service:8000";

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = org.springframework.web.reactive.function.client.WebClient.create(aiServiceUrl)
                    .post()
                    .uri("/api/rag/analyse-etudiant")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "resume", "Erreur service IA",
                    "elements", java.util.Collections.emptyList(),
                    "elements_rattrapage", java.util.Collections.emptyList(),
                    "simulation", Map.of("avant", 0, "apres", 0, "elements_modifies", java.util.Collections.emptyList()),
                    "recommandation", "RATTRAPAGE",
                    "justification", "Service IA temporairement indisponible. Analyse basee sur les regles par defaut.",
                    "confiance", 0.5
            ));
        }
    }

    /**
     * Liste des etudiants des filieres associees aux modules du RM
     */
    @GetMapping("/etudiants")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getEtudiants(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        Set<String> filierePrefixes = new HashSet<>();
        for (Module mod : modules) {
            String prefix = mod.getFiliere().getCode().toLowerCase().replace("&", "");
            filierePrefixes.add(prefix);
        }

        List<User> allUsers = userRepository.findByRole(ma.ensias.smartacademicflow.domain.enums.Role.ENS);
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : allUsers) {
            if (u.getEmail().startsWith("enseignant")) continue;
            String userPrefix = u.getEmail().split("\\.")[0].toLowerCase();
            if (!filierePrefixes.contains(userPrefix)) continue;

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nom", u.getNom());
            map.put("prenom", u.getPrenom());
            map.put("email", u.getEmail());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }
}
