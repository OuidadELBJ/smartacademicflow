package ma.ensias.smartacademicflow.controller;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.enums.JustificatifStatut;
import ma.ensias.smartacademicflow.repository.AbsenceRepository;
import ma.ensias.smartacademicflow.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/scolarite")
@RequiredArgsConstructor
public class ScolariteController {

    private final AbsenceRepository absenceRepository;
    private final ExportService exportService;
    private final WebClient.Builder webClientBuilder;

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
}
