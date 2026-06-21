package ma.ensias.smartacademicflow.service;

import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.Note;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.StringWriter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final NoteRepository noteRepository;

    /**
     * Export CSV au format Apogee.
     * Une seule ligne par etudiant avec la note EXAM uniquement.
     *
     * Resultat :
     * - ADM : note >= 12 (module valide)
     * - RATJ : note < 12 (non admis, va au rattrapage)
     * - DEF : absence injustifiee (Article 39)
     */
    @Transactional(readOnly = true)
    public String exportApogeeCSV(Long elementModuleId) {
        // Exporter uniquement les notes d'EXAMEN (une par etudiant)
        List<Note> notes = noteRepository.findByElementModuleIdAndTypeEvaluation(
                elementModuleId, TypeEvaluation.EXAM);

        StringWriter stringWriter = new StringWriter();
        try (CSVWriter writer = new CSVWriter(stringWriter, ';',
                CSVWriter.NO_QUOTE_CHARACTER,
                CSVWriter.DEFAULT_ESCAPE_CHARACTER,
                CSVWriter.DEFAULT_LINE_END)) {

            // Header Apogee
            writer.writeNext(new String[]{
                "COD_ETU", "NOM", "PRENOM", "NOTE", "BAREME", "RES"
            });

            for (Note note : notes) {
                String resultat;
                if (note.isBlockedByArticle39()) {
                    resultat = "DEF";  // Defaillant (absence injustifiee)
                } else if (note.getValeur() >= 12.0) {
                    resultat = "ADM";  // Admis (module valide)
                } else {
                    resultat = "RATJ"; // Non admis, rattrapage
                }

                writer.writeNext(new String[]{
                    String.valueOf(note.getEtudiant().getId()),
                    note.getEtudiant().getNom(),
                    note.getEtudiant().getPrenom(),
                    String.format("%.2f", note.getValeur()),
                    "20",
                    resultat
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur generation CSV", e);
        }

        return stringWriter.toString();
    }
}
