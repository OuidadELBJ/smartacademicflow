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
    private final DeliberationService deliberationService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;

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
        int totalAjournes = 0;
        int totalRattrapage = 0;
        int totalCasLimites = 0;

        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());
            for (ElementModule el : elements) {
                List<Note> notes = noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM);
                int nbNotes = notes.size();

                // Compter etudiants attendus (basee sur prefix filiere)
                String filiereCode = mod.getFiliere().getCode().toLowerCase().replace("&", "");
                long nbEtudiants = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().startsWith(filiereCode + ".")).count();

                totalNotesSaisies += nbNotes;
                totalNotesAttendues += nbEtudiants;

                // Compter ajournes (note < 10) et rattrapage (7 <= note < 10) et cas limites (8 <= note < 10)
                for (Note n : notes) {
                    if (n.getValeur() < 7) totalAjournes++;
                    else if (n.getValeur() < 10) totalRattrapage++;
                    if (n.getValeur() >= 8 && n.getValeur() < 10) totalCasLimites++;
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
        result.put("totalAjournes", totalAjournes);
        result.put("totalRattrapage", totalRattrapage);
        result.put("totalCasLimites", totalCasLimites);
        result.put("elementsProgress", elementsProgress);

        return ResponseEntity.ok(result);
    }

    /**
     * Liste des cas limites (etudiants entre 8 et 10 de moyenne exam)
     */
    @GetMapping("/cas-limites")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getCasLimites(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Module> modules = moduleRepository.findByResponsableId(rm.getId());

        List<Map<String, Object>> casLimites = new ArrayList<>();

        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());
            for (ElementModule el : elements) {
                List<Note> notes = noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM);
                for (Note n : notes) {
                    if (n.getValeur() >= 8 && n.getValeur() < 10 && !n.isBlockedByArticle39()) {
                        Map<String, Object> cas = new HashMap<>();
                        cas.put("noteId", n.getId());
                        cas.put("etudiantId", n.getEtudiant().getId());
                        cas.put("etudiantNom", n.getEtudiant().getNom());
                        cas.put("etudiantPrenom", n.getEtudiant().getPrenom());
                        cas.put("elementIntitule", el.getIntitule());
                        cas.put("moduleIntitule", mod.getIntitule());
                        cas.put("noteExam", n.getValeur());
                        cas.put("ecartValidation", Math.round((10 - n.getValeur()) * 100.0) / 100.0);
                        cas.put("isRachete", n.isRachete());
                        cas.put("motifRachat", n.getMotifRachat());
                        casLimites.add(cas);
                    }
                }
            }
        }

        // Trier par ecart le plus petit (plus proche de 10)
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
            @RequestBody Map<String, String> request) {
        emailService.sendRelanceEmail(
                request.get("email"),
                request.get("enseignantNom"),
                request.get("moduleIntitule"),
                request.get("elementIntitule")
        );
        return ResponseEntity.ok(Map.of("message", "Relance envoyee avec succes"));
    }
}
