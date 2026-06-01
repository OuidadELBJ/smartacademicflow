package ma.ensias.smartacademicflow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;

import java.time.LocalDate;

@Data
public class AbsenceRequest {
    @NotNull
    private Long etudiantId;

    @NotNull
    private Long elementModuleId;

    @NotNull
    private LocalDate dateAbsence;

    @NotNull
    private AbsenceType type;
}
