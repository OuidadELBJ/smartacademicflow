package ma.ensias.smartacademicflow.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ensias.smartacademicflow.domain.entity.*;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.Role;
import ma.ensias.smartacademicflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Base deja initialisee, skip DataLoader");
            return;
        }

        log.info("Initialisation des donnees de demonstration...");

        // --- Utilisateurs ---
        User ens1 = userRepository.save(User.builder()
                .email("enseignant1@ensias.ma")
                .password(passwordEncoder.encode("password123"))
                .nom("BENALI").prenom("Ahmed")
                .role(Role.ENS).isActive(true).build());

        User ens2 = userRepository.save(User.builder()
                .email("enseignant2@ensias.ma")
                .password(passwordEncoder.encode("password123"))
                .nom("ELHASSOUNI").prenom("Fatima")
                .role(Role.ENS).isActive(true).build());

        User rm = userRepository.save(User.builder()
                .email("responsable@ensias.ma")
                .password(passwordEncoder.encode("password123"))
                .nom("KHALIL").prenom("Mohamed")
                .role(Role.RM).isActive(true).build());

        User cf = userRepository.save(User.builder()
                .email("chef@ensias.ma")
                .password(passwordEncoder.encode("password123"))
                .nom("AMRANI").prenom("Sara")
                .role(Role.CF).isActive(true).build());

        User sco = userRepository.save(User.builder()
                .email("scolarite@ensias.ma")
                .password(passwordEncoder.encode("password123"))
                .nom("ADMIN").prenom("Scolarite")
                .role(Role.SCO).isActive(true).build());

        // Etudiants (simules comme users)
        for (int i = 1; i <= 5; i++) {
            userRepository.save(User.builder()
                    .email("etudiant" + i + "@ensias.ma")
                    .password(passwordEncoder.encode("password123"))
                    .nom("ETUDIANT_" + i).prenom("Prenom_" + i)
                    .role(Role.ENS) // Simplifie
                    .isActive(true).build());
        }

        // --- Filiere ---
        Filiere filiere = filiereRepository.save(Filiere.builder()
                .code("GL")
                .intitule("Genie Logiciel")
                .chefFiliere(cf).build());

        // --- Module ---
        Module module = moduleRepository.save(Module.builder()
                .code("GL-M1")
                .intitule("Programmation Avancee")
                .semestre("S1")
                .responsable(rm)
                .filiere(filiere).build());

        // --- Elements Module ---
        elementModuleRepository.save(ElementModule.builder()
                .code("GL-M1-E1")
                .intitule("Java Avance")
                .coefficient(2.0)
                .module(module)
                .enseignant(ens1).build());

        elementModuleRepository.save(ElementModule.builder()
                .code("GL-M1-E2")
                .intitule("Design Patterns")
                .coefficient(1.5)
                .module(module)
                .enseignant(ens2).build());

        log.info("Donnees de demonstration initialisees avec succes");
    }
}
