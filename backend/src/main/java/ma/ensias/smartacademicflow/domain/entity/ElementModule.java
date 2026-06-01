package ma.ensias.smartacademicflow.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "elements_module")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ElementModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String intitule;

    @Column(nullable = false)
    private Double coefficient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enseignant_id", nullable = false)
    private User enseignant;

    @OneToMany(mappedBy = "elementModule", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Note> notes = new ArrayList<>();
}
