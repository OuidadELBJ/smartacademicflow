package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.dto.AbsenceRequest;
import ma.ensias.smartacademicflow.dto.NoteDTO;
import ma.ensias.smartacademicflow.dto.NoteSaisieRequest;
import ma.ensias.smartacademicflow.repository.ElementModuleRepository;
import ma.ensias.smartacademicflow.service.AbsenceService;
import ma.ensias.smartacademicflow.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/enseignant")
@RequiredArgsConstructor
public class EnseignantController {

    private final NoteService noteService;
    private final AbsenceService absenceService;
    private final ElementModuleRepository elementModuleRepository;

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

    @GetMapping("/elements")
    public ResponseEntity<List<ElementModule>> getMesElements(Authentication auth) {
        var user = auth.getName();
        // On recupere via le repository
        return ResponseEntity.ok(elementModuleRepository.findByEnseignantId(
                Long.parseLong(auth.getCredentials() != null ? auth.getCredentials().toString() : "0")
        ));
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
}
