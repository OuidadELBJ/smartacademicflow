package ma.ensias.smartacademicflow.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RachatRequest {
    @NotNull
    private Long noteId;

    @NotNull
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "20.0")
    private Double nouvelleValeur;

    @NotBlank(message = "Le motif de rachat est obligatoire")
    private String motif;
}
