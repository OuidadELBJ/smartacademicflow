package ma.ensias.smartacademicflow.controller;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Filiere;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.repository.ModuleRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import ma.ensias.smartacademicflow.service.FiliereService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cf")
@RequiredArgsConstructor
public class ChefFiliereController {

    private final FiliereService filiereService;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

    @GetMapping("/filieres")
    public ResponseEntity<List<Filiere>> getMesFilieres(Authentication auth) {
        User cf = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(filiereService.getFilieresByCF(cf.getId()));
    }

    @GetMapping("/filiere/{filiereId}/modules")
    public ResponseEntity<List<Module>> getModulesFiliere(@PathVariable Long filiereId) {
        return ResponseEntity.ok(moduleRepository.findByFiliereId(filiereId));
    }

    @PostMapping("/filiere/{filiereId}/valider-pv")
    public ResponseEntity<Map<String, String>> validerPV(
            @PathVariable Long filiereId,
            Authentication auth) {
        filiereService.validerPVSemestriel(filiereId, auth.getName());
        return ResponseEntity.ok(Map.of(
                "message", "PV Semestriel valide. Tous les modules sont desormais clotures."
        ));
    }
}
