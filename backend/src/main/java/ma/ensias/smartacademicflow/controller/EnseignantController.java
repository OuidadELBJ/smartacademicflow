package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.dto.AbsenceRequest;
import ma.ensias.smartacademicflow.dto.NoteDTO;
import ma.ensias.smartacademicflow.dto.NoteSaisieRequest;
import ma.ensias.smartacademicflow.repository.ElementModuleRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import ma.ensias.smartacademicflow.domain.enums.Role;
import ma.ensias.smartacademicflow.service.AbsenceService;
import ma.ensias.smartacademicflow.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/enseignant")
@RequiredArgsConstructor
public class EnseignantController {

    private final NoteService noteService;
    private final AbsenceService absenceService;
    private final ElementModuleRepository elementModuleRepository;
    private final UserRepository userRepository;

    @GetMapping("/mes-elements")
    public ResponseEntity<List<Map<String, Object>>> getMesElements(Authentication auth) {
        User enseignant = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<ElementModule> elements = elementModuleRepository.findByEnseignantId(enseignant.getId());

        List<Map<String, Object>> result = elements.stream().map(el -> Map.<String, Object>of(
            "id", el.getId(),
            "code", el.getCode(),
            "intitule", el.getIntitule(),
            "coefficient", el.getCoefficient(),
            "moduleIntitule", el.getModule().getIntitule(),
            "moduleCode", el.getModule().getCode(),
            "semestre", el.getModule().getSemestre(),
            "filiereCode", el.getModule().getFiliere().getCode(),
            "filiereIntitule", el.getModule().getFiliere().getIntitule()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/etudiants")
    public ResponseEntity<List<Map<String, Object>>> getEtudiants() {
        // Retourne tous les etudiants (simules avec role ENS pour la demo)
        List<User> etudiants = userRepository.findByRole(Role.ENS);
        List<Map<String, Object>> result = etudiants.stream()
            .filter(u -> !u.getEmail().startsWith("enseignant"))
            .map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "nom", u.getNom(),
                "prenom", u.getPrenom(),
                "email", u.getEmail()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/notes")
    public ResponseEntity<NoteDTO> saisirNote(
            @Valid @RequestBody NoteSaisieRequest request,
            Authentication auth) {
        return ResponseEntity.ok(noteService.saisirNote(request, auth.getName()));
    }

    @GetMapping("/notes/element/{elementId}")
    public ResponseEntity<List<NoteDTO>> getNotesByElement(@PathVariable Long elementId) {
        return ResponseEntity.ok(noteService.getNotesByElement(elementId));
    }

    @PostMapping("/absences")
    public ResponseEntity<Absence> declarerAbsence(
            @Valid @RequestBody AbsenceRequest request,
            Authentication auth) {
        return ResponseEntity.ok(absenceService.declarerAbsence(request, auth.getName()));
    }

    @GetMapping("/absences/element/{elementId}")
    public ResponseEntity<List<Absence>> getAbsencesByElement(@PathVariable Long elementId) {
        return ResponseEntity.ok(absenceService.getAbsencesByElement(elementId));
    }

    @GetMapping("/absences/mes-absences")
    public ResponseEntity<List<Map<String, Object>>> getMesAbsences(Authentication auth) {
        User enseignant = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<ElementModule> elements = elementModuleRepository.findByEnseignantId(enseignant.getId());

        List<Map<String, Object>> allAbsences = elements.stream()
            .flatMap(el -> absenceService.getAbsencesByElement(el.getId()).stream()
                .map(abs -> Map.<String, Object>of(
                    "id", abs.getId(),
                    "etudiantNom", abs.getEtudiant().getNom(),
                    "etudiantPrenom", abs.getEtudiant().getPrenom(),
                    "elementIntitule", el.getIntitule(),
                    "elementId", el.getId(),
                    "dateAbsence", abs.getDateAbsence().toString(),
                    "type", abs.getType().name()
                ))
            ).collect(Collectors.toList());

        return ResponseEntity.ok(allAbsences);
    }
}
