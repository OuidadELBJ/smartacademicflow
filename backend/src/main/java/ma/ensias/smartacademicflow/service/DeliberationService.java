package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.DeliberationModule;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.dto.DeliberationRequest;
import ma.ensias.smartacademicflow.exception.BusinessException;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliberationService {

    private final DeliberationRepository deliberationRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final AuditService auditService;

    @Transactional
    public DeliberationModule deliberer(DeliberationRequest request, String rmEmail) {
        Module module = moduleRepository.findById(request.getModuleId())
                .orElseThrow(() -> new BusinessException("Module introuvable"));

        if (module.getStatut() == ModuleStatut.CLOTURE) {
            throw new BusinessException("Module cloture, deliberation impossible");
        }

        User rm = userRepository.findByEmail(rmEmail)
                .orElseThrow(() -> new BusinessException("Responsable non trouve"));

        if (!module.getResponsable().getId().equals(rm.getId())) {
            throw new BusinessException("Vous n'etes pas responsable de ce module");
        }

        User etudiant = userRepository.findById(request.getEtudiantId())
                .orElseThrow(() -> new BusinessException("Etudiant non trouve"));

        // Calculer la moyenne
        Double moyenne = noteRepository.calculateMoyenneModule(request.getModuleId(), request.getEtudiantId())
                .orElse(0.0);

        DeliberationModule deliberation = deliberationRepository
                .findByModuleIdAndEtudiantId(request.getModuleId(), request.getEtudiantId())
                .orElse(new DeliberationModule());

        deliberation.setModule(module);
        deliberation.setEtudiant(etudiant);
        deliberation.setMoyenne(moyenne);
        deliberation.setDecision(request.getDecision());
        deliberation.setRemarques(request.getRemarques());
        deliberation.setDeliberePar(rm);

        DeliberationModule saved = deliberationRepository.save(deliberation);

        auditService.log("DELIBERATION", "DeliberationModule", saved.getId(),
                null, request.getDecision().name(),
                "Deliberation pour " + etudiant.getNom() + " - Moyenne: " + moyenne);

        return saved;
    }

    public List<DeliberationModule> getDeliberationsByModule(Long moduleId) {
        return deliberationRepository.findByModuleId(moduleId);
    }
}
