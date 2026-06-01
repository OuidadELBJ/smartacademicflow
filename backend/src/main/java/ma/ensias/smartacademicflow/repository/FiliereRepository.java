package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.Filiere;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FiliereRepository extends JpaRepository<Filiere, Long> {
    Optional<Filiere> findByCode(String code);
    List<Filiere> findByChefFiliereId(Long chefFiliereId);
}
