package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Filiere;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.exception.BusinessException;
import ma.ensias.smartacademicflow.repository.FiliereRepository;
import ma.ensias.smartacademicflow.repository.ModuleRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FiliereService {

    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    /**
     * Validation du PV Semestriel par le Chef de Filiere.
     * Verrouille tous les modules de la filiere (statut -> CLOTURE).
     */
    @Transactional
    public void validerPVSemestriel(Long filiereId, String cfEmail) {
        Filiere filiere = filiereRepository.findById(filiereId)
                .orElseThrow(() -> new BusinessException("Filiere introuvable"));

        // Verifier que c'est bien le chef de filiere
        var cf = userRepository.findByEmail(cfEmail)
                .orElseThrow(() -> new BusinessException("Chef de filiere non trouve"));

        if (filiere.getChefFiliere() == null || !filiere.getChefFiliere().getId().equals(cf.getId())) {
            throw new BusinessException("Vous n'etes pas le chef de cette filiere");
        }

        List<Module> modules = moduleRepository.findByFiliereId(filiereId);

        for (Module module : modules) {
            module.setStatut(ModuleStatut.CLOTURE);
            moduleRepository.save(module);
        }

        auditService.log("VALIDATION_PV_SEMESTRIEL", "Filiere", filiereId,
                "EN_COURS", "CLOTURE",
                "PV Semestriel valide - Tous les modules clotures par " + cf.getNom());
    }

    public List<Filiere> getFilieresByCF(Long cfId) {
        return filiereRepository.findByChefFiliereId(cfId);
    }

    public Filiere getFiliereById(Long id) {
        return filiereRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Filiere introuvable"));
    }
}
