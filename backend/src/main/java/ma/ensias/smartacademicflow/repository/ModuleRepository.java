package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByResponsableId(Long responsableId);
    List<Module> findByFiliereId(Long filiereId);
    List<Module> findByFiliereIdAndStatut(Long filiereId, ModuleStatut statut);

    @Query("SELECT m FROM Module m WHERE m.responsable.id = :rmId AND m.statut = :statut")
    List<Module> findByResponsableAndStatut(@Param("rmId") Long rmId, @Param("statut") ModuleStatut statut);
}
