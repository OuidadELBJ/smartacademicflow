package ma.ensias.smartacademicflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardDTO {
    private int totalModules;
    private int modulesEnCours;
    private int modulesClotures;
    private int totalElements;
    private int elementsAvecNotes;
    private int elementsEnRetard;
    private double progressionGlobale;
    private List<ElementProgressDTO> elementsProgress;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ElementProgressDTO {
        private Long elementId;
        private String elementIntitule;
        private String enseignantNom;
        private long notesEnregistrees;
        private long totalEtudiants;
        private double progression;
        private boolean enRetard;
    }
}
