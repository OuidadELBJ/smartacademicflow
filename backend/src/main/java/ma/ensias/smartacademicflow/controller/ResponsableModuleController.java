package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.DeliberationModule;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.dto.DashboardDTO;
import ma.ensias.smartacademicflow.dto.DeliberationRequest;
import ma.ensias.smartacademicflow.dto.NoteDTO;
import ma.ensias.smartacademicflow.dto.RachatRequest;
import ma.ensias.smartacademicflow.repository.UserRepository;
import ma.ensias.smartacademicflow.service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/rm")
@RequiredArgsConstructor
public class ResponsableModuleController {

    private final DashboardService dashboardService;
    private final NoteService noteService;
    private final DeliberationService deliberationService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard(Authentication auth) {
        User rm = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(dashboardService.getDashboardRM(rm.getId()));
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

    @GetMapping("/deliberations/module/{moduleId}")
    public ResponseEntity<List<DeliberationModule>> getDeliberations(@PathVariable Long moduleId) {
        return ResponseEntity.ok(deliberationService.getDeliberationsByModule(moduleId));
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
