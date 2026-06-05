package ma.ensias.smartacademicflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NoteDTO {
    private Long id;
    private Long etudiantId;
    private String etudiantNom;
    private String etudiantPrenom;
    private Long elementModuleId;
    private String elementModuleIntitule;
    private TypeEvaluation typeEvaluation;
    private Double valeur;
    private boolean isBlockedByArticle39;
    private String motifRachat;
    private boolean isRachete;
    private Double noteAvantRachat;
}
