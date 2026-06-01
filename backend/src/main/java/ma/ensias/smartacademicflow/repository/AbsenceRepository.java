package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.Absence;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;
import ma.ensias.smartacademicflow.domain.enums.JustificatifStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AbsenceRepository extends JpaRepository<Absence, Long> {
    List<Absence> findByEtudiantId(Long etudiantId);
    List<Absence> findByElementModuleId(Long elementModuleId);
    List<Absence> findByEtudiantIdAndElementModuleIdAndType(Long etudiantId, Long elementModuleId, AbsenceType type);
    List<Absence> findByJustificatifStatut(JustificatifStatut statut);
    boolean existsByEtudiantIdAndElementModuleIdAndType(Long etudiantId, Long elementModuleId, AbsenceType type);
}
