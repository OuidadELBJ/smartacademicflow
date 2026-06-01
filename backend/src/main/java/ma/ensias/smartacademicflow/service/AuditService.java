package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.AuditLog;
import ma.ensias.smartacademicflow.domain.entity.User;
import ma.ensias.smartacademicflow.repository.AuditLogRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public void log(String action, String entityType, Long entityId,
                    String ancienneValeur, String nouvelleValeur, String motif) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouve pour audit"));

        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .ancienneValeur(ancienneValeur)
                .nouvelleValeur(nouvelleValeur)
                .motif(motif)
                .build();

        auditLogRepository.save(auditLog);
    }

    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Page<AuditLog> getAuditLogsForEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
    }
}
