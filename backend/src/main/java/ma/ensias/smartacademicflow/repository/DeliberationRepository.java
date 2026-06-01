package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.DeliberationModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliberationRepository extends JpaRepository<DeliberationModule, Long> {
    List<DeliberationModule> findByModuleId(Long moduleId);
    Optional<DeliberationModule> findByModuleIdAndEtudiantId(Long moduleId, Long etudiantId);
    List<DeliberationModule> findByEtudiantId(Long etudiantId);
}
