package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.Note;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.dto.NoteDTO;
import ma.ensias.smartacademicflow.dto.NoteSaisieRequest;
import ma.ensias.smartacademicflow.dto.RachatRequest;
import ma.ensias.smartacademicflow.exception.BusinessException;
import ma.ensias.smartacademicflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final UserRepository userRepository;
    private final AbsenceRepository absenceRepository;
    private final AuditService auditService;

    /**
     * Saisie d'une note par un enseignant.
     * Article 39 s'applique UNIQUEMENT sur les notes de type EXAM.
     */
    @Transactional
    public NoteDTO saisirNote(NoteSaisieRequest request, String enseignantEmail) {
        ElementModule element = elementModuleRepository.findById(request.getElementModuleId())
                .orElseThrow(() -> new BusinessException("Element de module introuvable"));

        if (element.getModule().getStatut() == ModuleStatut.CLOTURE) {
            throw new BusinessException("Le module est cloture. Aucune modification possible.");
        }

        User enseignant = userRepository.findByEmail(enseignantEmail)
                .orElseThrow(() -> new BusinessException("Enseignant non trouve"));

        if (!element.getEnseignant().getId().equals(enseignant.getId())) {
            throw new BusinessException("Vous n'etes pas affecte a cet element de module");
        }

        User etudiant = userRepository.findById(request.getEtudiantId())
                .orElseThrow(() -> new BusinessException("Etudiant non trouve"));

        // Chercher note existante par etudiant + element + type
        Note note = noteRepository.findByEtudiantIdAndElementModuleIdAndTypeEvaluation(
                request.getEtudiantId(), request.getElementModuleId(), request.getTypeEvaluation())
                .orElse(Note.builder()
                        .etudiant(etudiant)
                        .elementModule(element)
                        .typeEvaluation(request.getTypeEvaluation())
                        .build());

        // Article 39 : UNIQUEMENT pour EXAM
        if (note.isBlockedByArticle39() && request.getTypeEvaluation() == TypeEvaluation.EXAM) {
            throw new BusinessException("Cette note d'examen est verrouillee par l'Article 39 (absence injustifiee)");
        }

        String ancienneValeur = note.getValeur() != null ? String.valueOf(note.getValeur()) : "null";

        // Regle Article 39 : uniquement sur EXAM
        if (request.getTypeEvaluation() == TypeEvaluation.EXAM) {
            boolean hasAbsenceInjustifiee = absenceRepository.existsByEtudiantIdAndElementModuleIdAndType(
                    request.getEtudiantId(), request.getElementModuleId(), AbsenceType.INJUSTIFIEE);

            if (hasAbsenceInjustifiee) {
                note.setValeur(0.0);
                note.setBlockedByArticle39(true);
                auditService.log("ARTICLE_39_APPLIED", "Note", note.getId(),
                        ancienneValeur, "0.0", "Absence injustifiee - Note EXAM forcee a 0");
            } else {
                note.setValeur(request.getValeur());
            }
        } else {
            // TD, TP, PROJET : pas d'Article 39
            note.setValeur(request.getValeur());
        }

        Note savedNote = noteRepository.save(note);

        auditService.log("SAISIE_NOTE", "Note", savedNote.getId(),
                ancienneValeur, String.valueOf(savedNote.getValeur()),
                "Type: " + request.getTypeEvaluation().name());

        return mapToDTO(savedNote);
    }

    @Transactional
    public NoteDTO racheterNote(RachatRequest request, String rmEmail) {
        Note note = noteRepository.findById(request.getNoteId())
                .orElseThrow(() -> new BusinessException("Note introuvable"));

        if (note.isBlockedByArticle39()) {
            throw new BusinessException("Rachat impossible : note verrouillee par l'Article 39.");
        }

        if (note.getElementModule().getModule().getStatut() == ModuleStatut.CLOTURE) {
            throw new BusinessException("Le module est cloture. Aucune modification possible.");
        }

        String ancienneValeur = String.valueOf(note.getValeur());

        note.setNoteAvantRachat(note.getValeur());
        note.setValeur(request.getNouvelleValeur());
        note.setMotifRachat(request.getMotif());
        note.setRachete(true);

        Note savedNote = noteRepository.save(note);

        auditService.log("RACHAT_NOTE", "Note", savedNote.getId(),
                ancienneValeur, String.valueOf(request.getNouvelleValeur()), request.getMotif());

        return mapToDTO(savedNote);
    }

    public List<NoteDTO> getNotesByElement(Long elementModuleId) {
        return noteRepository.findByElementModuleId(elementModuleId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<NoteDTO> getNotesByElementAndType(Long elementModuleId, TypeEvaluation type) {
        return noteRepository.findByElementModuleIdAndTypeEvaluation(elementModuleId, type).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<NoteDTO> getNotesByEtudiant(Long etudiantId) {
        return noteRepository.findByEtudiantId(etudiantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private NoteDTO mapToDTO(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .etudiantId(note.getEtudiant().getId())
                .etudiantNom(note.getEtudiant().getNom())
                .etudiantPrenom(note.getEtudiant().getPrenom())
                .elementModuleId(note.getElementModule().getId())
                .elementModuleIntitule(note.getElementModule().getIntitule())
                .typeEvaluation(note.getTypeEvaluation())
                .valeur(note.getValeur())
                .isBlockedByArticle39(note.isBlockedByArticle39())
                .motifRachat(note.getMotifRachat())
                .isRachete(note.isRachete())
                .noteAvantRachat(note.getNoteAvantRachat())
                .build();
    }
}
