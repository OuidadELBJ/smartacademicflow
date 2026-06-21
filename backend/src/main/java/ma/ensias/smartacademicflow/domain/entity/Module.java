package ma.ensias.smartacademicflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String intitule;

    @Column(nullable = false)
    private String semestre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ModuleStatut statut = ModuleStatut.EN_COURS;

    @Column(name = "date_transmission_cf")
    private java.time.LocalDateTime dateTransmissionCF;

    @Column(name = "date_transmission_sco")
    private java.time.LocalDateTime dateTransmissionSCO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id", nullable = false)
    private User responsable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", nullable = false)
    private Filiere filiere;

    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ElementModule> elements = new ArrayList<>();
}
