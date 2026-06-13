package ma.ensias.smartacademicflow.controller;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.*;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.JustificatifStatut;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.repository.*;
import ma.ensias.smartacademicflow.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@RestController
@RequestMapping("/scolarite")
@RequiredArgsConstructor
public class ScolariteController {

    private final AbsenceRepository absenceRepository;
    private final ExportService exportService;
    private final WebClient.Builder webClientBuilder;
    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    @GetMapping("/certificats/en-attente")
    public ResponseEntity<List<Absence>> getCertificatsEnAttente() {
        return ResponseEntity.ok(
                absenceRepository.findByJustificatifStatut(JustificatifStatut.EN_ATTENTE)
        );
    }

    @PostMapping("/certificats/{absenceId}/valider")
    public ResponseEntity<Map<String, String>> validerCertificat(@PathVariable Long absenceId) {
        Absence absence = absenceRepository.findById(absenceId)
                .orElseThrow(() -> new RuntimeException("Absence introuvable"));
        absence.setJustificatifStatut(JustificatifStatut.VALIDE);
        absenceRepository.save(absence);
        return ResponseEntity.ok(Map.of("message", "Certificat valide"));
    }

    @PostMapping("/certificats/{absenceId}/rejeter")
    public ResponseEntity<Map<String, String>> rejeterCertificat(@PathVariable Long absenceId) {
        Absence absence = absenceRepository.findById(absenceId)
                .orElseThrow(() -> new RuntimeException("Absence introuvable"));
        absence.setJustificatifStatut(JustificatifStatut.REJETE);
        absenceRepository.save(absence);
        return ResponseEntity.ok(Map.of("message", "Certificat rejete"));
    }

    @GetMapping("/export/apogee/{elementId}")
    public ResponseEntity<byte[]> exportApogee(@PathVariable Long elementId) {
        String csv = exportService.exportApogeeCSV(elementId);
        byte[] csvBytes = csv.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=export_apogee.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    /**
     * Appel au microservice IA pour analyser un certificat medical
     */
    @PostMapping("/certificats/analyse-ia")
    public ResponseEntity<String> analyserCertificatIA(@RequestBody Map<String, String> request) {
        String aiServiceUrl = "http://ai-service:8000";

        String response = webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/api/ocr/analyze")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return ResponseEntity.ok(response);
    }

    /**
     * Dashboard Scolarite avec KPIs reels
     */
    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDashboard() {
        // Modules transmis a la scolarite
        List<Module> modulesTransmis = moduleRepository.findAll().stream()
                .filter(m -> m.getStatut() == ModuleStatut.TRANSMIS_SCO || m.getStatut() == ModuleStatut.CLOTURE)
                .toList();

        int modulesRecus = (int) moduleRepository.findAll().stream()
                .filter(m -> m.getStatut() == ModuleStatut.TRANSMIS_SCO).count();
        int modulesClotures = (int) moduleRepository.findAll().stream()
                .filter(m -> m.getStatut() == ModuleStatut.CLOTURE).count();
        int totalModules = (int) moduleRepository.count();

        // Certificats
        long certificatsEnAttente = absenceRepository.findByJustificatifStatut(JustificatifStatut.EN_ATTENTE).size();
        long totalAbsences = absenceRepository.count();

        Map<String, Object> result = new HashMap<>();
        result.put("modulesRecus", modulesRecus);
        result.put("modulesClotures", modulesClotures);
        result.put("totalModules", totalModules);
        result.put("certificatsEnAttente", certificatsEnAttente);
        result.put("totalAbsences", totalAbsences);

        return ResponseEntity.ok(result);
    }

    /**
     * Modules recus (statut TRANSMIS_SCO) - prets pour export Apogee
     */
    @GetMapping("/modules-recus")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getModulesRecus() {
        List<Module> modules = moduleRepository.findAll().stream()
                .filter(m -> m.getStatut() == ModuleStatut.TRANSMIS_SCO || m.getStatut() == ModuleStatut.CLOTURE)
                .toList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Module mod : modules) {
            List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());

            String filiereCode = mod.getFiliere().getCode().toLowerCase().replace("&", "");
            long nbEtudiants = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().startsWith(filiereCode + ".")).count();

            int notesSaisies = 0;
            List<Map<String, Object>> elementsData = new ArrayList<>();
            for (ElementModule el : elements) {
                int nbNotes = noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM).size();
                notesSaisies += nbNotes;

                Map<String, Object> elMap = new HashMap<>();
                elMap.put("elementId", el.getId());
                elMap.put("code", el.getCode());
                elMap.put("intitule", el.getIntitule());
                elMap.put("nbNotes", nbNotes);
                elementsData.add(elMap);
            }

            Map<String, Object> map = new HashMap<>();
            map.put("moduleId", mod.getId());
            map.put("code", mod.getCode());
            map.put("intitule", mod.getIntitule());
            map.put("semestre", mod.getSemestre());
            map.put("statut", mod.getStatut().name());
            map.put("filiereCode", mod.getFiliere().getCode());
            map.put("filiereIntitule", mod.getFiliere().getIntitule());
            map.put("responsableNom", mod.getResponsable().getNom() + " " + mod.getResponsable().getPrenom());
            map.put("notesSaisies", notesSaisies);
            map.put("nbEtudiants", nbEtudiants);
            map.put("elements", elementsData);
            map.put("dateTransmissionSCO", mod.getDateTransmissionSCO() != null ? mod.getDateTransmissionSCO().toString() : null);
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Liste de toutes les absences avec details
     */
    @GetMapping("/absences")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAllAbsences() {
        List<Absence> absences = absenceRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Absence abs : absences) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", abs.getId());
            map.put("etudiantNom", abs.getEtudiant().getNom());
            map.put("etudiantPrenom", abs.getEtudiant().getPrenom());
            map.put("etudiantEmail", abs.getEtudiant().getEmail());
            map.put("elementIntitule", abs.getElementModule().getIntitule());
            map.put("moduleIntitule", abs.getElementModule().getModule().getIntitule());
            map.put("dateAbsence", abs.getDateAbsence().toString());
            map.put("type", abs.getType().name());
            map.put("justificatifStatut", abs.getJustificatifStatut().name());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }
}
