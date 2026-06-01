package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ElementModuleRepository extends JpaRepository<ElementModule, Long> {
    List<ElementModule> findByModuleId(Long moduleId);
    List<ElementModule> findByEnseignantId(Long enseignantId);

    @Query("SELECT em FROM ElementModule em WHERE em.module.id = :moduleId AND em.enseignant.id = :enseignantId")
    List<ElementModule> findByModuleAndEnseignant(@Param("moduleId") Long moduleId, @Param("enseignantId") Long enseignantId);
}
