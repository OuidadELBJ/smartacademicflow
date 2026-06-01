package ma.ensias.smartacademicflow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.ensias.smartacademicflow.domain.enums.DecisionType;

@Data
public class DeliberationRequest {
    @NotNull
    private Long moduleId;

    @NotNull
    private Long etudiantId;

    @NotNull
    private DecisionType decision;

    private String remarques;
}
