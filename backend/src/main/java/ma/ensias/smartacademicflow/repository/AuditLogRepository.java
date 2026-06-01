package ma.ensias.smartacademicflow.repository;

import ma.ensias.smartacademicflow.domain.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
    List<AuditLog> findByUserId(Long userId);
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
