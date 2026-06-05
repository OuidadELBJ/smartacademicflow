package ma.ensias.smartacademicflow.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;

@Data
public class NoteSaisieRequest {
    @NotNull
    private Long etudiantId;

    @NotNull
    private Long elementModuleId;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "20.0")
    private Double valeur;

    @NotNull
    private TypeEvaluation typeEvaluation;
}
