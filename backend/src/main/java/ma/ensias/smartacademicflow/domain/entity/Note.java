package ma.ensias.smartacademicflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"etudiant_id", "element_module_id", "type_evaluation"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private User etudiant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "element_module_id", nullable = false)
    private ElementModule elementModule;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_evaluation", nullable = false)
    @Builder.Default
    private TypeEvaluation typeEvaluation = TypeEvaluation.EXAM;

    @Column(nullable = false)
    private Double valeur;

    @Column(name = "is_blocked_by_article39")
    @Builder.Default
    private boolean isBlockedByArticle39 = false;

    @Column(name = "motif_rachat")
    private String motifRachat;

    @Column(name = "is_rachete")
    @Builder.Default
    private boolean isRachete = false;

    @Column(name = "note_avant_rachat")
    private Double noteAvantRachat;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
