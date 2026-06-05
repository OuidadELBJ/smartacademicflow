package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.domain.enums.Role;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.dto.AbsenceRequest;
import ma.ensias.smartacademicflow.dto.NoteDTO;
import ma.ensias.smartacademicflow.dto.NoteSaisieRequest;
import ma.ensias.smartacademicflow.repository.ElementModuleRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import ma.ensias.smartacademicflow.service.AbsenceService;
import ma.ensias.smartacademicflow.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
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
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMesElements(Authentication auth) {
        User enseignant = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<ElementModule> elements = elementModuleRepository.findByEnseignantId(enseignant.getId());

        List<Map<String, Object>> result = new ArrayList<>();
        for (ElementModule el : elements) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", el.getId());
            map.put("code", el.getCode());
            map.put("intitule", el.getIntitule());
            map.put("coefficient", el.getCoefficient());
            map.put("hasTd", el.isHasTd());
            map.put("hasTp", el.isHasTp());
            map.put("hasProjet", el.isHasProjet());
            map.put("moduleIntitule", el.getModule().getIntitule());
            map.put("moduleCode", el.getModule().getCode());
            map.put("semestre", el.getModule().getSemestre());
            map.put("filiereCode", el.getModule().getFiliere().getCode());
            map.put("filiereIntitule", el.getModule().getFiliere().getIntitule());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Retourne les etudiants filtres par filiere (basee sur le prefix email)
     */
    @GetMapping("/etudiants")
    public ResponseEntity<List<Map<String, Object>>> getEtudiants(
            @RequestParam(required = false) String filiere) {
        List<User> allUsers = userRepository.findByRole(Role.ENS);
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : allUsers) {
            // Exclure les enseignants (leur email commence par "enseignant")
            if (u.getEmail().startsWith("enseignant")) continue;

            // Filtrer par filiere si specifie (prefix email: gl.1@, 2ia.5@, etc.)
            if (filiere != null && !filiere.isEmpty()) {
                String emailPrefix = u.getEmail().split("\\.")[0].toLowerCase();
                if (!emailPrefix.equalsIgnoreCase(filiere)) continue;
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nom", u.getNom());
            map.put("prenom", u.getPrenom());
            map.put("email", u.getEmail());
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/notes")
    public ResponseEntity<NoteDTO> saisirNote(
            @Valid @RequestBody NoteSaisieRequest request,
            Authentication auth) {
        return ResponseEntity.ok(noteService.saisirNote(request, auth.getName()));
    }

    @GetMapping("/notes/element/{elementId}")
    public ResponseEntity<List<NoteDTO>> getNotesByElement(
            @PathVariable Long elementId,
            @RequestParam(required = false) TypeEvaluation type) {
        if (type != null) {
            return ResponseEntity.ok(noteService.getNotesByElementAndType(elementId, type));
        }
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
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getMesAbsences(Authentication auth) {
        User enseignant = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<ElementModule> elements = elementModuleRepository.findByEnseignantId(enseignant.getId());

        List<Map<String, Object>> allAbsences = new ArrayList<>();
        for (ElementModule el : elements) {
            List<Absence> absences = absenceService.getAbsencesByElement(el.getId());
            for (Absence abs : absences) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", abs.getId());
                map.put("etudiantNom", abs.getEtudiant().getNom());
                map.put("etudiantPrenom", abs.getEtudiant().getPrenom());
                map.put("elementIntitule", el.getIntitule());
                map.put("elementId", el.getId());
                map.put("dateAbsence", abs.getDateAbsence().toString());
                map.put("type", abs.getType().name());
                allAbsences.add(map);
            }
        }

        return ResponseEntity.ok(allAbsences);
    }
}
