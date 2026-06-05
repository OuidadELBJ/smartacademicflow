package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.Note;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByElementModuleId(Long elementModuleId);
    List<Note> findByElementModuleIdAndTypeEvaluation(Long elementModuleId, TypeEvaluation typeEvaluation);
    List<Note> findByEtudiantId(Long etudiantId);
    Optional<Note> findByEtudiantIdAndElementModuleId(Long etudiantId, Long elementModuleId);
    Optional<Note> findByEtudiantIdAndElementModuleIdAndTypeEvaluation(Long etudiantId, Long elementModuleId, TypeEvaluation typeEvaluation);

    @Query("SELECT n FROM Note n WHERE n.elementModule.module.id = :moduleId AND n.etudiant.id = :etudiantId")
    List<Note> findByModuleAndEtudiant(@Param("moduleId") Long moduleId, @Param("etudiantId") Long etudiantId);

    @Query("SELECT AVG(n.valeur) FROM Note n WHERE n.elementModule.module.id = :moduleId AND n.etudiant.id = :etudiantId")
    Optional<Double> calculateMoyenneModule(@Param("moduleId") Long moduleId, @Param("etudiantId") Long etudiantId);

    @Query("SELECT COUNT(n) FROM Note n WHERE n.elementModule.id = :elementId")
    long countByElementModule(@Param("elementId") Long elementId);
}
