package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.Note;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;
import ma.ensias.smartacademicflow.dto.AbsenceRequest;
import ma.ensias.smartacademicflow.exception.BusinessException;
import ma.ensias.smartacademicflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AbsenceService {

    private final AbsenceRepository absenceRepository;
    private final UserRepository userRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final AuditService auditService;

    /**
     * Declarer une absence.
     * Si INJUSTIFIEE : declenche automatiquement l'Article 39 sur la note existante.
     */
    @Transactional
    public Absence declarerAbsence(AbsenceRequest request, String enseignantEmail) {
        User etudiant = userRepository.findById(request.getEtudiantId())
                .orElseThrow(() -> new BusinessException("Etudiant non trouve"));

        ElementModule element = elementModuleRepository.findById(request.getElementModuleId())
                .orElseThrow(() -> new BusinessException("Element de module non trouve"));

        // Verifier que l'enseignant est affecte
        User enseignant = userRepository.findByEmail(enseignantEmail)
                .orElseThrow(() -> new BusinessException("Enseignant non trouve"));

        if (!element.getEnseignant().getId().equals(enseignant.getId())) {
            throw new BusinessException("Vous n'etes pas affecte a cet element");
        }

        Absence absence = Absence.builder()
                .etudiant(etudiant)
                .elementModule(element)
                .dateAbsence(request.getDateAbsence())
                .type(request.getType())
                .build();

        Absence savedAbsence = absenceRepository.save(absence);

        // --- ARTICLE 39 : Si injustifiee, bloquer la note ---
        if (request.getType() == AbsenceType.INJUSTIFIEE) {
            applyArticle39(etudiant.getId(), element.getId());
        }

        auditService.log("DECLARATION_ABSENCE", "Absence", savedAbsence.getId(),
                null, request.getType().name(),
                "Absence " + request.getType().name() + " declaree pour etudiant " + etudiant.getNom());

        return savedAbsence;
    }

    /**
     * Application de l'Article 39 : force la note a 0 et verrouille
     */
    private void applyArticle39(Long etudiantId, Long elementModuleId) {
        Optional<Note> noteOpt = noteRepository.findByEtudiantIdAndElementModuleId(etudiantId, elementModuleId);

        if (noteOpt.isPresent()) {
            Note note = noteOpt.get();
            String ancienneValeur = String.valueOf(note.getValeur());
            note.setValeur(0.0);
            note.setBlockedByArticle39(true);
            noteRepository.save(note);

            auditService.log("ARTICLE_39_APPLIED", "Note", note.getId(),
                    ancienneValeur, "0.0", "Application automatique Article 39 suite absence injustifiee");
        }
        // Si pas encore de note, le blocage sera applique lors de la saisie
    }

    public List<Absence> getAbsencesByElement(Long elementModuleId) {
        return absenceRepository.findByElementModuleId(elementModuleId);
    }

    public List<Absence> getAbsencesByEtudiant(Long etudiantId) {
        return absenceRepository.findByEtudiantId(etudiantId);
    }
}
