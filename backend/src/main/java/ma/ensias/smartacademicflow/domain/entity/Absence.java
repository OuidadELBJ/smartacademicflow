package ma.ensias.smartacademicflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;
import ma.ensias.smartacademicflow.domain.enums.JustificatifStatut;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "absences")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private User etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "element_module_id", nullable = false)
    private ElementModule elementModule;

    @Column(name = "date_absence", nullable = false)
    private LocalDate dateAbsence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AbsenceType type = AbsenceType.INJUSTIFIEE;

    @Enumerated(EnumType.STRING)
    @Column(name = "justificatif_statut")
    @Builder.Default
    private JustificatifStatut justificatifStatut = JustificatifStatut.EN_ATTENTE;

    @Column(name = "justificatif_path")
    private String justificatifPath;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
