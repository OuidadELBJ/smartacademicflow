package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.entity.Note;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.repository.ElementModuleRepository;
import ma.ensias.smartacademicflow.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service de calcul des notes academiques.
 *
 * Regles implementees :
 * - Note Module = moyenne ponderee des notes elements (coefficient)
 * - Validation module : note module >= 12
 * - Rattrapage :
 *   - Si note module < 12 : rattrapage dans les elements ou note element < 12
 *   - Si note module >= 12 (mais non valide pour autre raison) : rattrapage dans les elements ou note < 5
 * - Apres rattrapage :
 *   - Note Element = Max(Note Examen session normale, Note Rattrapage)
 *   - Note Module = Max(Note Module avant rattrapage, Min(Note Module apres rattrapage, 12))
 * - Rachat : notes element entre [10, 11.75] (ecart < 2 pts de la validation a 12)
 */
@Service
@RequiredArgsConstructor
public class NoteCalculService {

    private final NoteRepository noteRepository;
    private final ElementModuleRepository elementModuleRepository;

    /**
     * Calcule la note d'un element pour un etudiant (note EXAM uniquement pour simplifier).
     * Si TD/TP/Projet existent, on fait la moyenne ponderee.
     */
    @Transactional(readOnly = true)
    public double calculerNoteElement(Long elementModuleId, Long etudiantId) {
        List<Note> notes = noteRepository.findByEtudiantId(etudiantId).stream()
                .filter(n -> n.getElementModule().getId().equals(elementModuleId))
                .collect(Collectors.toList());

        if (notes.isEmpty()) return 0.0;

        Double noteExam = null, noteTd = null, noteTp = null, noteProjet = null;
        for (Note n : notes) {
            switch (n.getTypeEvaluation()) {
                case EXAM -> noteExam = n.getValeur();
                case TD -> noteTd = n.getValeur();
                case TP -> noteTp = n.getValeur();
                case PROJET -> noteProjet = n.getValeur();
            }
        }

        // Ponderation : Exam x2, TD x1, TP x1, Projet x1.5
        double sum = 0;
        double totalCoeff = 0;
        if (noteExam != null) { sum += noteExam * 2; totalCoeff += 2; }
        if (noteTd != null) { sum += noteTd * 1; totalCoeff += 1; }
        if (noteTp != null) { sum += noteTp * 1; totalCoeff += 1; }
        if (noteProjet != null) { sum += noteProjet * 1.5; totalCoeff += 1.5; }

        return totalCoeff > 0 ? Math.round(sum / totalCoeff * 100.0) / 100.0 : 0.0;
    }

    /**
     * Calcule la note d'un module pour un etudiant.
     * Note Module = moyenne ponderee des notes elements (par coefficient element).
     */
    @Transactional(readOnly = true)
    public double calculerNoteModule(Long moduleId, Long etudiantId) {
        List<ElementModule> elements = elementModuleRepository.findByModuleId(moduleId);
        if (elements.isEmpty()) return 0.0;

        double sum = 0;
        double totalCoeff = 0;

        for (ElementModule el : elements) {
            double noteElement = calculerNoteElement(el.getId(), etudiantId);
            if (noteElement > 0) {
                sum += noteElement * el.getCoefficient();
                totalCoeff += el.getCoefficient();
            }
        }

        return totalCoeff > 0 ? Math.round(sum / totalCoeff * 100.0) / 100.0 : 0.0;
    }

    /**
     * Determine si un module est valide pour un etudiant.
     * Validation : note module >= 12
     */
    public boolean isModuleValide(double noteModule) {
        return noteModule >= 12.0;
    }

    /**
     * Determine les elements a rattraper pour un etudiant dans un module.
     *
     * Regles :
     * - Si note module < 12 : rattrapage dans les elements ou note element < 12
     * - Si note module >= 12 : rattrapage dans les elements ou note element < 5
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getElementsARattraper(Long moduleId, Long etudiantId) {
        double noteModule = calculerNoteModule(moduleId, etudiantId);
        List<ElementModule> elements = elementModuleRepository.findByModuleId(moduleId);

        double seuil = noteModule < 12.0 ? 12.0 : 5.0;

        List<Map<String, Object>> result = new ArrayList<>();
        for (ElementModule el : elements) {
            double noteElement = calculerNoteElement(el.getId(), etudiantId);
            if (noteElement < seuil && noteElement > 0) {
                Map<String, Object> map = new HashMap<>();
                map.put("elementId", el.getId());
                map.put("elementCode", el.getCode());
                map.put("elementIntitule", el.getIntitule());
                map.put("noteElement", noteElement);
                map.put("seuil", seuil);
                map.put("ecart", Math.round((seuil - noteElement) * 100.0) / 100.0);
                result.add(map);
            }
        }
        return result;
    }

    /**
     * Determine si un etudiant doit aller au rattrapage pour un module.
     */
    @Transactional(readOnly = true)
    public boolean doitRattraper(Long moduleId, Long etudiantId) {
        double noteModule = calculerNoteModule(moduleId, etudiantId);
        if (noteModule >= 12.0) return false; // Module valide

        // Si note module < 12, verifier s'il y a des elements < 12
        List<ElementModule> elements = elementModuleRepository.findByModuleId(moduleId);
        for (ElementModule el : elements) {
            double noteElement = calculerNoteElement(el.getId(), etudiantId);
            if (noteElement > 0 && noteElement < 12.0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calcule la note module apres rattrapage.
     * Note Element = Max(Note Examen session normale, Note Rattrapage)
     * Note Module = Max(Note Module avant rattrapage, Min(Note Module apres rattrapage, 12))
     */
    public double calculerNoteModuleApresRattrapage(double noteModuleAvant, double noteModuleApres) {
        return Math.max(noteModuleAvant, Math.min(noteModuleApres, 12.0));
    }

    /**
     * Calcule la note element apres rattrapage.
     * Note Element = Max(Note Examen session normale, Note Rattrapage)
     */
    public double calculerNoteElementApresRattrapage(double noteExamNormale, double noteRattrapage) {
        return Math.max(noteExamNormale, noteRattrapage);
    }

    /**
     * Determine si une note element est eligible au rachat.
     * Rachat : note element entre [10, 11.75] (a moins de 2 pts de 12).
     */
    public boolean isEligibleRachat(double noteElement) {
        return noteElement >= 10.0 && noteElement < 12.0;
    }

    /**
     * Ecart par rapport a la validation (12).
     */
    public double ecartValidation(double noteElement) {
        return Math.round((12.0 - noteElement) * 100.0) / 100.0;
    }
}
