package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.Relance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RelanceRepository extends JpaRepository<Relance, Long> {
    List<Relance> findByEnseignantIdOrderByCreatedAtDesc(Long enseignantId);
    List<Relance> findByEnseignantIdAndLuFalseOrderByCreatedAtDesc(Long enseignantId);
    long countByEnseignantIdAndLuFalse(Long enseignantId);
}
