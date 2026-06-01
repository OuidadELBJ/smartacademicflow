package ma.ensias.smartacademicflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Async
    public void sendRelanceEmail(String to, String enseignantNom, String moduleIntitule, String elementIntitule) {
        if (mailSender == null) {
            log.warn("Mail sender non configure - Relance simulee pour {} ({})", enseignantNom, to);
            log.info("Relance [SIMULATION] : Element '{}' du module '{}' en retard", elementIntitule, moduleIntitule);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("[SmartAcademicFlow] Relance - Saisie des notes en retard");
            message.setText(String.format(
                    "Bonjour %s,\n\n" +
                    "La saisie des notes pour l'element \"%s\" du module \"%s\" est en retard.\n\n" +
                    "Merci de proceder a la saisie dans les plus brefs delais.\n\n" +
                    "Cordialement,\n" +
                    "SmartAcademicFlow - Plateforme Academique",
                    enseignantNom, elementIntitule, moduleIntitule
            ));
            message.setFrom("noreply@ensias.ma");

            mailSender.send(message);
            log.info("Relance envoyee a {} pour element {}", to, elementIntitule);
        } catch (Exception e) {
            log.error("Erreur envoi email relance a {}: {}", to, e.getMessage());
        }
    }
}
