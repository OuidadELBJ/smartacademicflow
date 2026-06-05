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

import java.util.ArrayList;
import java.util.List;

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
        String pwd = passwordEncoder.encode("password123");

        // =============================================
        // STAFF - Enseignants
        // =============================================
        List<User> enseignants = new ArrayList<>();
        String[][] ensData = {
            {"enseignant1@ensias.ma", "BENALI", "Ahmed"},
            {"enseignant2@ensias.ma", "ELHASSOUNI", "Fatima"},
            {"enseignant3@ensias.ma", "MOULINE", "Karim"},
            {"enseignant4@ensias.ma", "SENHAJI", "Meryem"},
            {"enseignant5@ensias.ma", "ZIDANI", "Hassan"},
            {"enseignant6@ensias.ma", "LAHLOU", "Amine"},
            {"enseignant7@ensias.ma", "BERRADA", "Salma"},
            {"enseignant8@ensias.ma", "TAZI", "Youssef"},
            {"enseignant9@ensias.ma", "ALAMI", "Nadia"},
            {"enseignant10@ensias.ma", "FASSI", "Rachid"},
            {"enseignant11@ensias.ma", "BENKADDOUR", "Zineb"},
            {"enseignant12@ensias.ma", "OUAZZANI", "Mehdi"},
        };
        for (String[] e : ensData) {
            enseignants.add(userRepository.save(User.builder()
                .email(e[0]).password(pwd).nom(e[1]).prenom(e[2])
                .role(Role.ENS).isActive(true).build()));
        }

        // =============================================
        // STAFF - Responsables de Module
        // =============================================
        List<User> responsables = new ArrayList<>();
        String[][] rmData = {
            {"rm.ia@ensias.ma", "KHALIL", "Mohamed"},
            {"rm.bi@ensias.ma", "AMRANI", "Leila"},
            {"rm.gl@ensias.ma", "BENNANI", "Omar"},
            {"rm.gd@ensias.ma", "CHRAIBI", "Hajar"},
            {"rm.idf@ensias.ma", "SQALLI", "Karim"},
            {"rm.scl@ensias.ma", "MOUSSAOUI", "Sara"},
            {"rm.cyber@ensias.ma", "IDRISSI", "Tarik"},
            {"rm.d2s@ensias.ma", "FILALI", "Aicha"},
            {"rm.sse@ensias.ma", "HAJJI", "Anas"},
        };
        for (String[] r : rmData) {
            responsables.add(userRepository.save(User.builder()
                .email(r[0]).password(pwd).nom(r[1]).prenom(r[2])
                .role(Role.RM).isActive(true).build()));
        }

        // =============================================
        // STAFF - Chefs de Filiere
        // =============================================
        List<User> chefs = new ArrayList<>();
        String[][] cfData = {
            {"cf.2ia@ensias.ma", "ABOUTAJDINE", "Driss"},
            {"cf.bia@ensias.ma", "HACHIMI", "Saida"},
            {"cf.gd@ensias.ma", "BOUZIDI", "Rachid"},
            {"cf.gl@ensias.ma", "KETTANI", "Nadia"},
            {"cf.idf@ensias.ma", "BENKIRANE", "Younes"},
            {"cf.2scl@ensias.ma", "SLAOUI", "Fatima-Zahra"},
            {"cf.cyber@ensias.ma", "DAOUDI", "Abdelkrim"},
            {"cf.d2s@ensias.ma", "RAJI", "Souad"},
            {"cf.sse@ensias.ma", "ZEROUALI", "Hassan"},
        };
        for (String[] c : cfData) {
            chefs.add(userRepository.save(User.builder()
                .email(c[0]).password(pwd).nom(c[1]).prenom(c[2])
                .role(Role.CF).isActive(true).build()));
        }

        // Scolarite
        User sco = userRepository.save(User.builder()
            .email("scolarite@ensias.ma").password(pwd)
            .nom("ADMIN").prenom("Scolarite")
            .role(Role.SCO).isActive(true).build());

        // Compte demo general
        userRepository.save(User.builder()
            .email("responsable@ensias.ma").password(pwd)
            .nom("KHALIL").prenom("Mohamed")
            .role(Role.RM).isActive(true).build());
        userRepository.save(User.builder()
            .email("chef@ensias.ma").password(pwd)
            .nom("ABOUTAJDINE").prenom("Driss")
            .role(Role.CF).isActive(true).build());

        // =============================================
        // ETUDIANTS - 30 par filiere, repartis sur 3 annees
        // =============================================
        String[][] etudiantsNoms = {
            {"AARAB", "Youssef"}, {"ACHOUR", "Imane"}, {"ADNANE", "Mehdi"},
            {"AGOUMI", "Sara"}, {"AIT OMAR", "Hamza"}, {"ALAOUI", "Fatima"},
            {"AMGHAR", "Rachid"}, {"BAALI", "Khadija"}, {"BAJOURI", "Anas"},
            {"BELKADI", "Zineb"}, {"BELMAHI", "Omar"}, {"BENABDALLAH", "Nora"},
            {"BENHIMA", "Ayoub"}, {"BERQI", "Hajar"}, {"BOUAZZA", "Soufiane"},
            {"BOUHALI", "Meryem"}, {"CHAABI", "Walid"}, {"CHAFIK", "Sanaa"},
            {"DAOUDI", "Reda"}, {"DRIOUICH", "Amina"}, {"EL AMRANI", "Zakaria"},
            {"EL BOUZIDI", "Salma"}, {"EL IDRISSI", "Khalid"}, {"EL MAHDI", "Houda"},
            {"ENNAJI", "Saad"}, {"ERRAMI", "Laila"}, {"ETTAHRI", "Yassine"},
            {"FATHI", "Rim"}, {"GHALI", "Othmane"}, {"HAJJI", "Nisrine"},
            {"HASSANI", "Ali"}, {"HILALI", "Mariam"}, {"JABRI", "Ilias"},
            {"KADIRI", "Wafaa"}, {"KARAM", "Taha"}, {"LAABIDI", "Samira"},
            {"LAMRANI", "Adil"}, {"MAHFOUD", "Ghita"}, {"MAJIDI", "Mouad"},
            {"MERNISSI", "Dounia"}, {"NACHIT", "Bilal"}, {"NACIRI", "Asmaa"},
            {"OUALI", "Rayan"}, {"RAISSOUNI", "Kawtar"}, {"RHAZI", "Oussama"},
        };

        List<User> allEtudiants = new ArrayList<>();
        int etIdx = 0;
        for (int i = 0; i < etudiantsNoms.length; i++) {
            String email = "etudiant" + (i + 1) + "@ensias.ma";
            allEtudiants.add(userRepository.save(User.builder()
                .email(email).password(pwd)
                .nom(etudiantsNoms[i][0]).prenom(etudiantsNoms[i][1])
                .role(Role.ENS) // Etudiants simules
                .isActive(true).build()));
        }

        // =============================================
        // FILIERES
        // =============================================
        String[][] filieresData = {
            {"2IA", "Ingenierie de l'Intelligence Artificielle"},
            {"BI&A", "Business Intelligence & Analytics"},
            {"GD", "Genie de la Data"},
            {"GL", "Genie Logiciel"},
            {"IDF", "Ingenierie Digitale pour la Finance"},
            {"2SCL", "Smart Supply Chain & Logistics"},
            {"CSCC", "Cybersecurite, Cloud et Informatique Mobile"},
            {"D2S", "Data and Software Sciences"},
            {"SSE", "Smart System Engineering"},
        };

        List<Filiere> filieres = new ArrayList<>();
        for (int i = 0; i < filieresData.length; i++) {
            filieres.add(filiereRepository.save(Filiere.builder()
                .code(filieresData[i][0])
                .intitule(filieresData[i][1])
                .chefFiliere(chefs.get(i))
                .build()));
        }

        // =============================================
        // MODULES & ELEMENTS - Par filiere et semestre
        // Structure: 1A(S1,S2) / 2A(S3,S4) / 3A(S5,S6)
        // =============================================

        // --- GL (Genie Logiciel) - Filiere index 3 ---
        Filiere gl = filieres.get(3);
        User rmGL = responsables.get(2);

        // GL - 1A - S1
        Module glM1 = moduleRepository.save(Module.builder()
            .code("GL-S1-M1").intitule("Programmation Orientee Objet")
            .semestre("S1").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S1-M1-E1").intitule("Java Avance").coefficient(2.0)
            .module(glM1).enseignant(enseignants.get(0)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S1-M1-E2").intitule("Design Patterns").coefficient(1.5)
            .module(glM1).enseignant(enseignants.get(1)).build());

        Module glM2 = moduleRepository.save(Module.builder()
            .code("GL-S1-M2").intitule("Structures de Donnees & Algorithmes")
            .semestre("S1").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S1-M2-E1").intitule("Algorithmes Avances").coefficient(2.0)
            .module(glM2).enseignant(enseignants.get(2)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S1-M2-E2").intitule("Complexite & Optimisation").coefficient(1.5)
            .module(glM2).enseignant(enseignants.get(3)).build());

        // GL - 1A - S2
        Module glM3 = moduleRepository.save(Module.builder()
            .code("GL-S2-M1").intitule("Developpement Web Full-Stack")
            .semestre("S2").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S2-M1-E1").intitule("Spring Boot & Microservices").coefficient(2.0)
            .module(glM3).enseignant(enseignants.get(0)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S2-M1-E2").intitule("React / Angular").coefficient(1.5)
            .module(glM3).enseignant(enseignants.get(4)).build());

        Module glM4 = moduleRepository.save(Module.builder()
            .code("GL-S2-M2").intitule("Bases de Donnees Avancees")
            .semestre("S2").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S2-M2-E1").intitule("SQL & NoSQL").coefficient(2.0)
            .module(glM4).enseignant(enseignants.get(5)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S2-M2-E2").intitule("Administration BDD").coefficient(1.0)
            .module(glM4).enseignant(enseignants.get(6)).build());

        // GL - 2A - S3
        Module glM5 = moduleRepository.save(Module.builder()
            .code("GL-S3-M1").intitule("Architecture Logicielle")
            .semestre("S3").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S3-M1-E1").intitule("Clean Architecture").coefficient(2.0)
            .module(glM5).enseignant(enseignants.get(7)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S3-M1-E2").intitule("DevOps & CI/CD").coefficient(1.5)
            .module(glM5).enseignant(enseignants.get(8)).build());

        // GL - 2A - S4
        Module glM6 = moduleRepository.save(Module.builder()
            .code("GL-S4-M1").intitule("Genie Logiciel & Qualite")
            .semestre("S4").responsable(rmGL).filiere(gl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S4-M1-E1").intitule("Tests & TDD").coefficient(2.0)
            .module(glM6).enseignant(enseignants.get(9)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GL-S4-M1-E2").intitule("Methodes Agiles").coefficient(1.0)
            .module(glM6).enseignant(enseignants.get(10)).build());

        // --- 2IA (Intelligence Artificielle) - Filiere index 0 ---
        Filiere ia = filieres.get(0);
        User rmIA = responsables.get(0);

        Module iaM1 = moduleRepository.save(Module.builder()
            .code("2IA-S1-M1").intitule("Machine Learning")
            .semestre("S1").responsable(rmIA).filiere(ia).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S1-M1-E1").intitule("Apprentissage Supervise").coefficient(2.0)
            .module(iaM1).enseignant(enseignants.get(2)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S1-M1-E2").intitule("Apprentissage Non-Supervise").coefficient(1.5)
            .module(iaM1).enseignant(enseignants.get(3)).build());

        Module iaM2 = moduleRepository.save(Module.builder()
            .code("2IA-S1-M2").intitule("Deep Learning")
            .semestre("S1").responsable(rmIA).filiere(ia).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S1-M2-E1").intitule("Reseaux de Neurones CNN").coefficient(2.0)
            .module(iaM2).enseignant(enseignants.get(4)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S1-M2-E2").intitule("NLP & Transformers").coefficient(2.0)
            .module(iaM2).enseignant(enseignants.get(5)).build());

        Module iaM3 = moduleRepository.save(Module.builder()
            .code("2IA-S2-M1").intitule("Vision par Ordinateur")
            .semestre("S2").responsable(rmIA).filiere(ia).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S2-M1-E1").intitule("Traitement d'Images").coefficient(2.0)
            .module(iaM3).enseignant(enseignants.get(6)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2IA-S2-M1-E2").intitule("Detection & Segmentation").coefficient(1.5)
            .module(iaM3).enseignant(enseignants.get(7)).build());

        // --- BI&A (Business Intelligence) - Filiere index 1 ---
        Filiere bia = filieres.get(1);
        User rmBI = responsables.get(1);

        Module biM1 = moduleRepository.save(Module.builder()
            .code("BIA-S1-M1").intitule("Data Warehousing & ETL")
            .semestre("S1").responsable(rmBI).filiere(bia).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("BIA-S1-M1-E1").intitule("Modelisation Dimensionnelle").coefficient(2.0)
            .module(biM1).enseignant(enseignants.get(8)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("BIA-S1-M1-E2").intitule("ETL & Talend").coefficient(1.5)
            .module(biM1).enseignant(enseignants.get(9)).build());

        Module biM2 = moduleRepository.save(Module.builder()
            .code("BIA-S2-M1").intitule("Data Visualization & Reporting")
            .semestre("S2").responsable(rmBI).filiere(bia).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("BIA-S2-M1-E1").intitule("Power BI & Tableau").coefficient(2.0)
            .module(biM2).enseignant(enseignants.get(10)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("BIA-S2-M1-E2").intitule("Storytelling Data").coefficient(1.0)
            .module(biM2).enseignant(enseignants.get(11)).build());

        // --- CSCC (Cybersecurite) - Filiere index 6 ---
        Filiere cyber = filieres.get(6);
        User rmCyber = responsables.get(6);

        Module cyM1 = moduleRepository.save(Module.builder()
            .code("CSCC-S1-M1").intitule("Securite des Reseaux")
            .semestre("S1").responsable(rmCyber).filiere(cyber).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("CSCC-S1-M1-E1").intitule("Cryptographie Appliquee").coefficient(2.0)
            .module(cyM1).enseignant(enseignants.get(0)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("CSCC-S1-M1-E2").intitule("Firewall & IDS").coefficient(1.5)
            .module(cyM1).enseignant(enseignants.get(1)).build());

        Module cyM2 = moduleRepository.save(Module.builder()
            .code("CSCC-S2-M1").intitule("Cloud Computing & Securite")
            .semestre("S2").responsable(rmCyber).filiere(cyber).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("CSCC-S2-M1-E1").intitule("AWS / Azure Security").coefficient(2.0)
            .module(cyM2).enseignant(enseignants.get(2)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("CSCC-S2-M1-E2").intitule("Pentest & Ethical Hacking").coefficient(2.0)
            .module(cyM2).enseignant(enseignants.get(3)).build());

        // --- GD (Genie de la Data) - Filiere index 2 ---
        Filiere gd = filieres.get(2);
        User rmGD = responsables.get(3);

        Module gdM1 = moduleRepository.save(Module.builder()
            .code("GD-S1-M1").intitule("Big Data & Ecosysteme Hadoop")
            .semestre("S1").responsable(rmGD).filiere(gd).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GD-S1-M1-E1").intitule("Spark & MapReduce").coefficient(2.0)
            .module(gdM1).enseignant(enseignants.get(4)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("GD-S1-M1-E2").intitule("Data Lakes & Streaming").coefficient(1.5)
            .module(gdM1).enseignant(enseignants.get(5)).build());

        // --- IDF (Ingenierie Digitale Finance) - Filiere index 4 ---
        Filiere idf = filieres.get(4);
        User rmIDF = responsables.get(4);

        Module idfM1 = moduleRepository.save(Module.builder()
            .code("IDF-S1-M1").intitule("Finance Quantitative")
            .semestre("S1").responsable(rmIDF).filiere(idf).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("IDF-S1-M1-E1").intitule("Modelisation Financiere").coefficient(2.0)
            .module(idfM1).enseignant(enseignants.get(6)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("IDF-S1-M1-E2").intitule("Blockchain & FinTech").coefficient(1.5)
            .module(idfM1).enseignant(enseignants.get(7)).build());

        // --- 2SCL (Supply Chain) - Filiere index 5 ---
        Filiere scl = filieres.get(5);
        User rmSCL = responsables.get(5);

        Module sclM1 = moduleRepository.save(Module.builder()
            .code("2SCL-S1-M1").intitule("Optimisation Logistique")
            .semestre("S1").responsable(rmSCL).filiere(scl).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2SCL-S1-M1-E1").intitule("Recherche Operationnelle").coefficient(2.0)
            .module(sclM1).enseignant(enseignants.get(8)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("2SCL-S1-M1-E2").intitule("IoT & Supply Chain 4.0").coefficient(1.5)
            .module(sclM1).enseignant(enseignants.get(9)).build());

        // --- D2S (Data & Software Sciences) - Filiere index 7 ---
        Filiere d2s = filieres.get(7);
        User rmD2S = responsables.get(7);

        Module d2sM1 = moduleRepository.save(Module.builder()
            .code("D2S-S1-M1").intitule("Software Engineering Fundamentals")
            .semestre("S1").responsable(rmD2S).filiere(d2s).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("D2S-S1-M1-E1").intitule("Formal Methods").coefficient(2.0)
            .module(d2sM1).enseignant(enseignants.get(10)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("D2S-S1-M1-E2").intitule("Data Science with Python").coefficient(1.5)
            .module(d2sM1).enseignant(enseignants.get(11)).build());

        // --- SSE (Smart System Engineering) - Filiere index 8 ---
        Filiere sse = filieres.get(8);
        User rmSSE = responsables.get(8);

        Module sseM1 = moduleRepository.save(Module.builder()
            .code("SSE-S1-M1").intitule("Systemes Embarques Intelligents")
            .semestre("S1").responsable(rmSSE).filiere(sse).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("SSE-S1-M1-E1").intitule("FPGA & VHDL").coefficient(2.0)
            .module(sseM1).enseignant(enseignants.get(0)).build());
        elementModuleRepository.save(ElementModule.builder()
            .code("SSE-S1-M1-E2").intitule("Robotique & Automatique").coefficient(1.5)
            .module(sseM1).enseignant(enseignants.get(1)).build());

        log.info("=== DONNEES INITIALISEES AVEC SUCCES ===");
        log.info("Enseignants: {}", enseignants.size());
        log.info("Responsables Module: {}", responsables.size());
        log.info("Chefs de Filiere: {}", chefs.size());
        log.info("Etudiants: {}", allEtudiants.size());
        log.info("Filieres: {}", filieres.size());
        log.info("Structure: 1A(S1/S2), 2A(S3/S4), 3A(S5/S6-PFE)");
        log.info("=========================================");
    }
}
