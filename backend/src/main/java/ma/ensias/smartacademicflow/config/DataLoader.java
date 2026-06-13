package ma.ensias.smartacademicflow.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.ensias.smartacademicflow.domain.entity.*;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.AbsenceType;
import ma.ensias.smartacademicflow.domain.enums.JustificatifStatut;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.domain.enums.Role;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FiliereRepository filiereRepository;
    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final AbsenceRepository absenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Base deja initialisee, skip DataLoader");
            return;
        }

        log.info("Initialisation des donnees ENSIAS...");
        String pwd = passwordEncoder.encode("password123");

        // =============================================
        // ENSEIGNANTS (12)
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
        // RESPONSABLES DE MODULE (9)
        // =============================================
        List<User> responsables = new ArrayList<>();
        String[][] rmData = {
            {"rm.2ia@ensias.ma", "KHALIL", "Mohamed"},
            {"rm.bia@ensias.ma", "AMRANI", "Leila"},
            {"rm.gd@ensias.ma", "CHRAIBI", "Hajar"},
            {"responsable@ensias.ma", "BENNANI", "Omar"},
            {"rm.idf@ensias.ma", "SQALLI", "Karim"},
            {"rm.2scl@ensias.ma", "MOUSSAOUI", "Sara"},
            {"rm.cscc@ensias.ma", "IDRISSI", "Tarik"},
            {"rm.d2s@ensias.ma", "FILALI", "Aicha"},
            {"rm.sse@ensias.ma", "HAJJI", "Anas"},
        };
        for (String[] r : rmData) {
            responsables.add(userRepository.save(User.builder()
                .email(r[0]).password(pwd).nom(r[1]).prenom(r[2])
                .role(Role.RM).isActive(true).build()));
        }

        // =============================================
        // CHEFS DE FILIERE (9)
        // =============================================
        List<User> chefs = new ArrayList<>();
        String[][] cfData = {
            {"cf.2ia@ensias.ma", "ABOUTAJDINE", "Driss"},
            {"cf.bia@ensias.ma", "HACHIMI", "Saida"},
            {"cf.gd@ensias.ma", "BOUZIDI", "Rachid"},
            {"cf.gl@ensias.ma", "KETTANI", "Nadia"},
            {"cf.idf@ensias.ma", "BENKIRANE", "Younes"},
            {"cf.2scl@ensias.ma", "SLAOUI", "Fatima-Zahra"},
            {"cf.cscc@ensias.ma", "DAOUDI", "Abdelkrim"},
            {"cf.d2s@ensias.ma", "RAJI", "Souad"},
            {"cf.sse@ensias.ma", "ZEROUALI", "Hassan"},
        };
        for (String[] c : cfData) {
            chefs.add(userRepository.save(User.builder()
                .email(c[0]).password(pwd).nom(c[1]).prenom(c[2])
                .role(Role.CF).isActive(true).build()));
        }

        // Scolarite + comptes demo
        userRepository.save(User.builder().email("scolarite@ensias.ma").password(pwd).nom("ADMIN").prenom("Scolarite").role(Role.SCO).isActive(true).build());
        User chefDemo = userRepository.save(User.builder().email("chef@ensias.ma").password(pwd).nom("ABOUTAJDINE").prenom("Driss").role(Role.CF).isActive(true).build());

        // =============================================
        // ETUDIANTS PAR FILIERE
        // =============================================

        // --- 2IA ---
        String[][] etu2IA = {
            {"AIT HAMMADI", "ABDELLATIF"}, {"ARDIF", "MOHAMED"}, {"ASSIS", "AYOUB"},
            {"BARKOUKI", "OUSSAMA"}, {"EL ANSARI", "BADER"}, {"EL BIARI", "ABDELHAK"},
            {"EL QARAOUI", "AMINE"}, {"ER-RACHIDY", "NAJWA"}, {"ESSAHEL", "RIM"},
            {"EZZAAM", "CHAIMAA"}, {"MAAZOUZI", "SABAH"}, {"MOUDNI", "AHMAD"},
            {"OHSSINE", "EL-HOUSSAINE"}, {"OU-EL-FAQUIR", "IMRANE"}, {"OUTLAOUAIT", "EL HASSAN"},
            {"TALIH", "AIDA"}, {"YACHOUTI", "YOUNESS"}, {"ZNIBER", "ALAA"},
            {"ZOURANE", "REDA"}, {"ANECHAD", "AMINA"}, {"AZZAL", "ABDELLAH"},
            {"BAHLOULI", "ISMAHANE"}, {"BELCHITI", "MEHDI"}, {"BENAMMI", "GHITA"},
            {"BENHAMMI", "RANYA"}, {"BENOMARAT", "ASMAA"}, {"BENTAHAR", "ANAS"},
            {"BOUALAOUI", "KHAWLA"}, {"DAOUDI", "MERYAM"}, {"DEHBI", "ZAKARIAE"},
            {"EL IDRISSI", "MOHAMED AMINE"}, {"EL QOUR", "ILYASS"}, {"EL YOUSSOUFI", "OMAR"},
            {"ENNAHLI", "NISRINE"}, {"ERRAHMANI", "NOSSAIR"}, {"IDELAAMEUR", "HAFSSA"},
            {"JARAH", "AYMANE"}, {"KACHICHE", "CHAYMAE"}, {"KAICHOUH", "YOUSSEF"},
            {"KAMMAS", "CHAIMAA"}, {"LEMKHENTER", "KARIMA"}, {"MOUFIDI", "AMINE"},
            {"MOUMNI", "HAJAR"}, {"NID-BAHDOU", "FATIMA"}, {"OUATITI", "YOUSSEF ESSEDDIQ"},
            {"RAMI", "ABDELLAH"}, {"TIJANE", "AHMED"}, {"TILOUT", "IKRAM"},
        };
        createEtudiants(etu2IA, "2ia", pwd);

        // --- GL ---
        String[][] etuGL = {
            {"AABANE", "ABDERRAHIM"}, {"AARAB", "OUSSAMA"}, {"ABED", "ABIR"},
            {"ABOUALI", "ANAS"}, {"ACHEMLAL", "HATIM"}, {"AIT LHAJ", "WALID"},
            {"AJA", "OTHMANE"}, {"AJABRI", "HIBA"}, {"AMRANI", "YASSINE"},
            {"ANAM", "AYMANE"}, {"ANFAR", "ASMAA"}, {"ASSELMAN", "MAROUAN"},
            {"BARKANI", "ISMAIL"}, {"BELARBI", "ASAAD"}, {"BENET.TALEB", "AMINE"},
            {"BENIMMAR", "MARYAM"}, {"BENTAZAR", "RIHAB"}, {"BOUCHERIT", "HAMZA"},
            {"BOUGTIB", "HAFSA"}, {"BOUHANDIRA", "HAFSA"}, {"BOUSSOAB", "HIBA"},
            {"BOUZIANE", "ILYAS"}, {"CHICHI", "AMINE"}, {"CHQIR", "SAMIA"},
            {"DALIL", "WAFA"}, {"DERROUICH", "JAOUHAR"}, {"DOUSLIMI", "YASSIR"},
            {"EDDAGHAL", "MOHAMMED"}, {"EL ABOUDI", "SAID"}, {"EL ARFAOUI", "IKRAME"},
            {"EL AZHAR", "ASMAA"}, {"EL BIACHE", "HOUDA"}, {"EL FAKHORI", "FOUAD"},
            {"EL HAFI", "ABDESSAMAD"}, {"EL MARRAKI", "YASSINE"}, {"EL MOUSS", "AYMAN"},
            {"ELMASBAHY", "IDRISS"}, {"EZZARMOU", "KAMAL"}, {"EZ-ZNAFRY", "YASSIR"},
            {"FAKHIR", "AHMED"}, {"HAJAZI", "SOUFIANE"}, {"HEGGOUR", "ABDELJALIL"},
            {"HILMI", "IMANE"}, {"JAMAI", "MOHAMMED AMINE"}, {"KOTBI", "ABDERRAHMANE"},
            {"LACHIRI", "ANASS"}, {"LAHNINE", "FATIMA-EZZAHRA"}, {"LAMYAGHRI", "SALMA"},
            {"LHAJOUI", "IKRAM"}, {"LHEND", "AYMAN"}, {"LOUAFI", "NOUREDDINE"},
            {"LOUKILI", "IKHLASS"}, {"MAADANI", "KHALIL"}, {"MOUFAKKIR", "ZOHAIR"},
            {"MOUHIM", "HANANE"}, {"OUDAOUD", "EL MEHDI"}, {"OUMOUDID", "OTHMANE"},
            {"OUTTALEB", "MOHAMMED"}, {"QATAB", "SALAH-EDDINE"}, {"RACHID", "ASMA"},
            {"RAMI", "ANASS"}, {"REZZAK", "SOUFIANE"}, {"RIDDA", "ABDELGHANI"},
            {"SAOUDI", "MEHDI"}, {"SEFIAT", "AHMED AMINE"}, {"SIRAJ EDDINE", "YOUSSEF"},
            {"SOUIYAH", "ANISS"}, {"TABBOUCHY", "MERYEM"}, {"TALBI", "HICHAM"},
            {"TALHAOUI", "MOUAD"}, {"TAMTAOUI", "ABDELWADOUD"}, {"TAZI", "RIDA"},
            {"TENNIA", "YOUSSEF"}, {"TNIFASS", "MEHDI"}, {"TOUATI", "HANAE"},
            {"AARABA", "ABDALLAH"}, {"ABID", "SOUKAYNA"}, {"ADREF", "BRAHIM"},
        };
        createEtudiants(etuGL, "gl", pwd);

        // --- IDF ---
        String[][] etuIDF = {
            {"ABOUHADID", "YASSINE"}, {"ACHAG", "NADA"}, {"AKHSAS", "OTHMANE"},
            {"AZEROUAL", "SALAH EDDINE"}, {"BAHLAS", "RIHAB"}, {"BALLITO", "HAMZA"},
            {"BEN SAKA", "IBTISSAM"}, {"BENSAGHIRI", "MERYEM"}, {"BOUTOUAR", "YASSINE"},
            {"EL AITAR", "SAFAE"}, {"ERRAHMOUNI LAKMYTI", "IKRAM"}, {"HASKA", "HIBA"},
            {"HIBAT ALLAH", "AMINE"}, {"HILI", "IMAD"}, {"JARMOUNI", "MANAL"},
            {"LAHSSINI", "ABDERRAHIM"}, {"LEBBOUNI", "KAWTAR"}, {"MASSAOUDI", "LOUBNA"},
            {"NAKHLI", "HIBA"}, {"OUAKIL", "HAJAR"}, {"SADIR", "SAAD"},
            {"SALEK", "HAMZA"}, {"TAHRAOUI", "GHIZLANE"},
        };
        createEtudiants(etuIDF, "idf", pwd);

        // --- CSCC (SSI) ---
        String[][] etuCyber = {
            {"ADDAD", "CHAOUKI"}, {"ADNI", "FAHD"}, {"ALLALI", "OUSSAMA"},
            {"AMEKHROUB", "ZAKARIYAA"}, {"AMJOUN", "HAMZA"}, {"ASSELMAN", "MARIEM"},
            {"BELLAZRAK", "DIYAA-EDDINE"}, {"BELLEFKIH", "HAJAR"}, {"BOUSSHINE", "IMANE"},
            {"BRAHMI", "REDOUANE"}, {"CHEIKH", "MOHAMMED NABIL"}, {"DERBOUGUY", "ACHRAF"},
            {"EL BAGBAGUI", "SALMA"}, {"EL FAIDI", "HAMZA"}, {"EL KATI", "NAHID"},
            {"ESSOUFI", "HOUSSAM EDDINE"}, {"HAJJI", "ZINEB"}, {"HILALI NAJM", "GHITA"},
            {"HOUMMANE", "ZINEB"}, {"HOUNAOUI", "ANISSE"}, {"KANIBOU", "NOURA"},
            {"KHALLOUF", "FAYCAL"}, {"L'HICHOU", "ANAS"}, {"MABROUK", "MOHAMED ILYAS"},
            {"QAZDAR", "OUSSAMA"}, {"SAKAT", "MOHAMED OUSSAMA"}, {"SOUNA", "ANASS"},
            {"AHAMRI", "SOUFYAN"}, {"ALAMI", "OUMAIMA"}, {"ASSRI", "ZOHAIR"},
            {"BELLAKBIL", "ISMAIL"}, {"BELMAMOUNE", "OUMAIMA"}, {"BENLKHDIM", "AZHAR"},
            {"BENNANI", "AHMED"}, {"CHERROU", "OUMAIMA"}, {"DAHMOUN", "LAHCEN"},
            {"DIAI", "AYMAN"}, {"EL AAKIL", "HAMZA"}, {"EL BERNOUSSI", "ALI"},
            {"EL HADDADI", "RAYHANA"}, {"EL JADDAOUI", "MOHAMED"}, {"EL MANITI", "MOHAMMED"},
            {"EL MESKINE", "HANANE"}, {"EL YOUBI", "OUMAIMA"}, {"EL-ASRI", "LOUBNA"},
            {"ES-SBAIY", "OUMAIMA"}, {"FELLAQ", "HAMZA"}, {"FIHR", "OUMAIMA"},
            {"HAMROUD", "SALMA"}, {"ICHIOUI", "YOUSSEF"}, {"JEBARI", "BOUTAINA"},
            {"LOUKAH", "MOHAMMED-AYMANE"}, {"MAHZOULI", "ZAKARIA"}, {"MAKLOUL", "YASSIR"},
            {"MEHDAOUI", "ADNANE"}, {"RAJOUL", "ABDELJALIL"}, {"SADIR", "MEHDI"},
            {"SALEK", "ZAKARIA"}, {"SEAGHI", "SOUFIANE"}, {"THAMINE", "KHADIJA"},
        };
        createEtudiants(etuCyber, "cscc", pwd);

        // --- SSE (ISEM) ---
        String[][] etuSSE = {
            {"AICHI", "RANIA"}, {"AMAADOUR", "SOUFIANE"}, {"BANIABAZ", "AMINA"},
            {"BEN BRAHIM", "ABDELKARIM"}, {"BERHOUMI", "WALID"}, {"BOUANANE", "KARIM"},
            {"CHRIFI ALAOUI", "AMINE"}, {"DAHBI", "ABDELMALEK"}, {"EL AREF", "HAYTHAM"},
            {"EL HARI", "CHADI"}, {"EL HLAFI", "MOHAMED"}, {"EL IDRISSI", "ILYAS"},
            {"EL MARDI", "IMANE"}, {"HABACHI", "NOURA"}, {"HAMCHA", "CHAIMA"},
            {"HAMEDOUN", "ZAKARIAE"}, {"HIMANE", "CHAIMAE"}, {"JARMOUNI", "ABDERRAHMANE"},
            {"KBIBCHI", "OUMAYMA"}, {"LAHLAL", "HAMZA"}, {"LAKHZINE", "IBRAHIM"},
            {"LAMNAOUAR", "BRAHIM"}, {"MAMOR", "MOHAMED"}, {"MEFTOUH", "OUMAIMA"},
            {"MOUACHI", "NABIL"}, {"MOUMOU", "CHAIMAE"}, {"RAHMOUNI", "MERYEM"},
            {"SABER", "ZAKARIA"}, {"SENHI", "HAFSA"}, {"SIFI", "AMINA"},
            {"ABA HADDOU", "AYOUB"}, {"ALLAL", "JAMAL"}, {"AOUANE", "SOUFIANE"},
            {"EL HAJJOUJI", "BADR-EDDINE"}, {"ELKHADER", "SARA"}, {"HACHOUCHE", "AMINE"},
            {"HATIM", "HAMZA"}, {"HEFHAF", "WALID"}, {"JAMALI", "HATIM"},
            {"KAMZON", "NOUREDDINE"}, {"KEBBOU", "MAIMOUNA"}, {"LEMRABET", "NAJLAE"},
            {"MANFALOUTI", "MARYAM"}, {"NABIL", "ANOUAR"}, {"NAJI", "MOUNCEF"},
            {"OUAHCHI", "HOUSSAM EDDINE"}, {"OURBAT", "FATIMA"}, {"SADIK", "ABBES"},
            {"YAGOUBI", "IKRAM"},
        };
        createEtudiants(etuSSE, "sse", pwd);

        // --- D2S (IWIM) ---
        String[][] etuD2S = {
            {"AL-KOURAICHI", "ANAS"}, {"ALLAM", "HOUDA"}, {"ANADI", "JABRAN"},
            {"AQRCHAL", "EL-MEHDI"}, {"AZHOUNE", "EL MEHDI"}, {"BEN TAMER", "NABIL"},
            {"BENOMAR", "YASMINE"}, {"BENYAS", "AYOUB"}, {"BERRACHDI", "MOHAMED"},
            {"BLOULA", "HAJAR"}, {"BOUALAOUI", "BOUCHRA"}, {"BOUHRAOUA", "ISSAM"},
            {"BOUKHAIMA", "HAJAR"}, {"BOUKHEROUAA", "TAHA"}, {"BOUTAHIRI", "SOUFIANE"},
            {"CHAFOUA", "SAID"}, {"CHERIF", "YOUSRA"}, {"CHOUBARI", "KAWTAR"},
            {"DOUMIRI", "ZINEB"}, {"DRIOUECH", "AFAF"}, {"EL AOUARAK", "ASMAE"},
            {"EL MADINI", "ZINEB"}, {"EL-ASRI", "NEZHA"}, {"ELBRAHLI", "IKRAM"},
            {"ER-GAIBI", "YASIN"}, {"EZZAIM", "ADNANE"}, {"GAADI", "ASMAE"},
            {"HAMID", "HIBA"}, {"HARCHI", "OUSSAMA"}, {"JAAFAR", "ABDELHAMID"},
            {"AABBAD", "MERIEM"}, {"AIT BAHADDOU", "AYOUB"}, {"BAOUZ", "MEHDI"},
            {"BAYI", "SOUKAYNA"}, {"BEJJAJI", "AYOUB"}, {"BELLIHI", "ISMAIL"},
            {"BEN ZAGGAGH", "AMINE"}, {"BENBRIQA", "HICHAM"}, {"BENHLIMA", "FAKIR"},
            {"BENSAID", "KHADIJA"}, {"BEZZOUR", "REDA"}, {"BIHAN", "CHAIMAA"},
            {"BILAL", "ZAKARIA"}, {"BOUADDI", "ISMAIL"}, {"BOUARAFA", "ANAS"},
        };
        createEtudiants(etuD2S, "d2s", pwd);

        // --- 2SCL (IeL) ---
        String[][] etu2SCL = {
            {"BAHA", "KHADIJA"}, {"BELAIZI", "NASSIMA"}, {"BENADDI", "HASSNA"},
            {"BENHAMMOU", "FATIMA ZAHRA"}, {"BOUMLIK", "AYOUB"}, {"DEKKAN", "NOUHAILA"},
            {"EL ABBASSY", "MERYEM"}, {"EL GANNOUNI", "HAMZA"}, {"EL GHAZAZ", "BASSMA"},
            {"EL OUAFI", "YOUNES"}, {"ELBARHMI", "MOHAMED"}, {"ELKADIRI", "ILYASSE"},
            {"ENNEIYMY", "JAMAL"}, {"HAYAOUI", "ABDELHAKIM"}, {"IKRIMAH", "ZAKARIA"},
            {"JAMIL", "YASSINE"}, {"KASRAOUI", "AHMED"}, {"KERDOUD", "MOHAMMED"},
            {"LAACHRATE", "MARYAME"}, {"LABRAIDI", "IMADE"}, {"OUARDI", "IMANE"},
            {"SKALLI-HOUSSAINI", "HAJAR"}, {"TIBESSE", "MOHAMMED ISLAM"},
            {"AGOURRAM", "HAJAR"}, {"AIT MOUMEN", "YOUSSEF"}, {"AIT OUFKKIR", "CHAIMAE"},
            {"BELKOUFA", "OMAR"}, {"BERDAI", "YOUSRA"}, {"BOUALI", "NASSIM"},
            {"BOUANAN", "HIND"}, {"CHBOUKI", "RIME"}, {"EL GHALMI", "AYOUB"},
            {"EL OSROUTI", "OUIAM"}, {"ELKOUKHOU", "ABDELILAH"}, {"EL-MSIEH", "ACHRAF"},
            {"ER-RAFAY", "FATIMA-EZZAHRA"}, {"GUARRET", "CHAYMAE"}, {"HAJLI", "KAOUTAR"},
            {"KAZI", "OUMAIMA"}, {"LAAZIRI", "NIHAL"}, {"LACHHAB", "BASMA"},
            {"LAHMAMSI", "ANAS"}, {"LEBBAR", "ANAS"}, {"LEGHMARI", "HAMZA"},
            {"LOUGHZALI", "SAAD EDDINE"}, {"MANGACHE", "AMINE"}, {"MOUALI", "OUMAIMA"},
            {"OIRDIGHI", "HAMZA"}, {"SAADI", "NADA"}, {"SADIKI", "YOUSSEF"},
            {"TAOUICH", "HAFSA"}, {"ZAHI", "NIZAR"}, {"ZAHIR", "ABDELHADI"},
        };
        createEtudiants(etu2SCL, "2scl", pwd);

        // --- BI&A / GD ---
        String[][] etuBIA = {
            {"ABDELALIM", "ZINEB"}, {"ABOULKACEM", "BADR-EDDINE"}, {"AIT OUAZIZ", "HOUSSAM"},
            {"AL HAMMOUTI", "FATIMA"}, {"ASFIRI", "ABDELHALIM"}, {"ASSAITAL", "MOUAD"},
            {"AZROUR", "ABDESSAMAD"}, {"BASRI", "YOUSSEF"}, {"BENDER", "MONCEF"},
            {"BENHIMA", "ANASS"}, {"BOUCHDAK", "KAOUTAR"}, {"BOUHAMIDI EL ALAOUI", "KAOUTAR"},
            {"BOURAYA", "WALID"}, {"BOURJILAT", "WAFAE"}, {"EL AM", "MAJDA"},
            {"EL MALKI", "ABDENNOUR"}, {"EL MAMOUN", "MOHAMED"}, {"EL-FATIH", "ZIAD"},
            {"EZ-ZAYANY", "HAMZA"}, {"HARROUD", "ZIYAD"}, {"JANATI IDRISSI", "MARIAM"},
            {"OUTALEB", "ABDERAHMANE"}, {"REBBAJ", "CHAMSSEDDINE"}, {"RKAISSI", "YOUSSEF"},
            {"SAAOUDI", "ANAS"}, {"SAIDI", "YASMINE"}, {"SALEHI", "HAFSA"},
            {"SANAD", "MOHAMED"}, {"TAOULI", "OUSSAMA"}, {"TOUJI", "OUMAYMA"},
            {"ZRHARI", "ZINEB"},
        };
        createEtudiants(etuBIA, "bia", pwd);

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
            Filiere filiere = filiereRepository.save(Filiere.builder()
                .code(filieresData[i][0])
                .intitule(filieresData[i][1])
                .chefFiliere(chefs.get(i))
                .build());
            filieres.add(filiere);
            // Also link the GL filiere to the demo chef@ensias.ma account
            if (filieresData[i][0].equals("GL")) {
                filiere.setChefFiliere(chefDemo);
                filiereRepository.save(filiere);
            }
        }

        // =============================================
        // MODULES PAR FILIERE (1A: S1/S2, 2A: S3/S4, 3A: S5/S6)
        // =============================================
        createModulesGL(filieres.get(3), responsables.get(3), enseignants);
        createModules2IA(filieres.get(0), responsables.get(0), enseignants);
        createModulesBIA(filieres.get(1), responsables.get(1), enseignants);
        createModulesGD(filieres.get(2), responsables.get(2), enseignants);
        createModulesIDF(filieres.get(4), responsables.get(4), enseignants);
        createModules2SCL(filieres.get(5), responsables.get(5), enseignants);
        createModulesCyber(filieres.get(6), responsables.get(6), enseignants);
        createModulesD2S(filieres.get(7), responsables.get(7), enseignants);
        createModulesSSE(filieres.get(8), responsables.get(8), enseignants);

        // Pre-remplir notes pour TOUTES les filieres (laisser 5 derniers par filiere pour demo)
        log.info("Pre-remplissage des notes pour toutes les filieres...");
        prefillAllNotes();

        // Pre-remplir des absences pour la demo scolarite
        log.info("Creation des absences de demo...");
        prefillAbsences(filieres);

        // Transmettre quelques modules au CF et a la scolarite pour la demo
        log.info("Transmission de modules pour la demo CF/SCO...");
        prefillTransmissions(filieres);

        log.info("=== DONNEES ENSIAS INITIALISEES ===");
        log.info("Filieres: 9 | Enseignants: 12 | RM: 9 | CF: 9");
        log.info("Etudiants: 400+ | Notes pre-remplies (5 derniers/filiere libres pour demo)");
        log.info("Absences: 15+ | Modules transmis CF/SCO pour demo scolarite");
        log.info("====================================");
    }

    private void createEtudiants(String[][] data, String prefix, String pwd) {
        for (int i = 0; i < data.length; i++) {
            userRepository.save(User.builder()
                .email(prefix + "." + (i + 1) + "@ensias.ma")
                .password(pwd)
                .nom(data[i][0]).prenom(data[i][1])
                .role(Role.ENS).isActive(true).build());
        }
    }

    private void createModulesGL(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("GL-S1-M1").intitule("Programmation Orientee Objet").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S1-M1-E1").intitule("Java Avance").coefficient(2.0).hasTd(true).hasTp(true).hasProjet(true).module(m1).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S1-M1-E2").intitule("Design Patterns").coefficient(1.5).hasTd(true).hasTp(false).hasProjet(true).module(m1).enseignant(ens.get(1)).build());
        Module m2 = moduleRepository.save(Module.builder().code("GL-S1-M2").intitule("Structures de Donnees & Algorithmes").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S1-M2-E1").intitule("Algorithmes Avances").coefficient(2.0).hasTd(true).hasTp(false).hasProjet(false).module(m2).enseignant(ens.get(2)).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S1-M2-E2").intitule("Complexite & Optimisation").coefficient(1.5).hasTd(true).hasTp(false).hasProjet(false).module(m2).enseignant(ens.get(3)).build());
        Module m3 = moduleRepository.save(Module.builder().code("GL-S2-M1").intitule("Developpement Web Full-Stack").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S2-M1-E1").intitule("Spring Boot & Microservices").coefficient(2.0).hasTd(true).hasTp(true).hasProjet(true).module(m3).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S2-M1-E2").intitule("React / Angular").coefficient(1.5).hasTd(false).hasTp(true).hasProjet(true).module(m3).enseignant(ens.get(4)).build());
        Module m4 = moduleRepository.save(Module.builder().code("GL-S3-M1").intitule("Architecture Logicielle").semestre("S3").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S3-M1-E1").intitule("Clean Architecture").coefficient(2.0).hasTd(true).hasTp(false).hasProjet(true).module(m4).enseignant(ens.get(7)).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S3-M1-E2").intitule("DevOps & CI/CD").coefficient(1.5).hasTd(false).hasTp(true).hasProjet(true).module(m4).enseignant(ens.get(8)).build());
        Module m5 = moduleRepository.save(Module.builder().code("GL-S4-M1").intitule("Genie Logiciel & Qualite").semestre("S4").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S4-M1-E1").intitule("Tests & TDD").coefficient(2.0).hasTd(true).hasTp(true).hasProjet(false).module(m5).enseignant(ens.get(9)).build());
        elementModuleRepository.save(ElementModule.builder().code("GL-S4-M1-E2").intitule("Methodes Agiles").coefficient(1.0).hasTd(false).hasTp(false).hasProjet(true).module(m5).enseignant(ens.get(10)).build());

        // Notes pre-remplies via prefillAllNotes() apres toutes les filieres
    }

    private void createModules2IA(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("2IA-S1-M1").intitule("Machine Learning").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S1-M1-E1").intitule("Apprentissage Supervise").coefficient(2.0).module(m1).enseignant(ens.get(2)).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S1-M1-E2").intitule("Apprentissage Non-Supervise").coefficient(1.5).module(m1).enseignant(ens.get(3)).build());
        Module m2 = moduleRepository.save(Module.builder().code("2IA-S1-M2").intitule("Deep Learning").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S1-M2-E1").intitule("CNN & Reseaux Profonds").coefficient(2.0).module(m2).enseignant(ens.get(4)).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S1-M2-E2").intitule("NLP & Transformers").coefficient(2.0).module(m2).enseignant(ens.get(5)).build());
        Module m3 = moduleRepository.save(Module.builder().code("2IA-S2-M1").intitule("Vision par Ordinateur").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S2-M1-E1").intitule("Traitement d'Images").coefficient(2.0).module(m3).enseignant(ens.get(6)).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S2-M1-E2").intitule("Detection & Segmentation").coefficient(1.5).module(m3).enseignant(ens.get(7)).build());
        Module m4 = moduleRepository.save(Module.builder().code("2IA-S3-M1").intitule("Reinforcement Learning").semestre("S3").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S3-M1-E1").intitule("Q-Learning & Policy Gradient").coefficient(2.0).module(m4).enseignant(ens.get(8)).build());
        elementModuleRepository.save(ElementModule.builder().code("2IA-S3-M1-E2").intitule("Multi-Agent Systems").coefficient(1.5).module(m4).enseignant(ens.get(9)).build());
    }

    private void createModulesBIA(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("BIA-S1-M1").intitule("Data Warehousing & ETL").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S1-M1-E1").intitule("Modelisation Dimensionnelle").coefficient(2.0).module(m1).enseignant(ens.get(8)).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S1-M1-E2").intitule("ETL & Talend").coefficient(1.5).module(m1).enseignant(ens.get(9)).build());
        Module m2 = moduleRepository.save(Module.builder().code("BIA-S2-M1").intitule("Data Visualization").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S2-M1-E1").intitule("Power BI & Tableau").coefficient(2.0).module(m2).enseignant(ens.get(10)).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S2-M1-E2").intitule("Storytelling Data").coefficient(1.0).module(m2).enseignant(ens.get(11)).build());
        Module m3 = moduleRepository.save(Module.builder().code("BIA-S3-M1").intitule("Big Data Analytics").semestre("S3").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S3-M1-E1").intitule("Spark & Hadoop").coefficient(2.0).module(m3).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("BIA-S3-M1-E2").intitule("Data Mining").coefficient(1.5).module(m3).enseignant(ens.get(1)).build());
    }

    private void createModulesGD(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("GD-S1-M1").intitule("Big Data & Ecosysteme Hadoop").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GD-S1-M1-E1").intitule("Spark & MapReduce").coefficient(2.0).module(m1).enseignant(ens.get(4)).build());
        elementModuleRepository.save(ElementModule.builder().code("GD-S1-M1-E2").intitule("Data Lakes & Streaming").coefficient(1.5).module(m1).enseignant(ens.get(5)).build());
        Module m2 = moduleRepository.save(Module.builder().code("GD-S2-M1").intitule("Data Engineering").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("GD-S2-M1-E1").intitule("Pipelines & Airflow").coefficient(2.0).module(m2).enseignant(ens.get(6)).build());
        elementModuleRepository.save(ElementModule.builder().code("GD-S2-M1-E2").intitule("MLOps").coefficient(1.5).module(m2).enseignant(ens.get(7)).build());
    }

    private void createModulesIDF(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("IDF-S1-M1").intitule("Finance Quantitative").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("IDF-S1-M1-E1").intitule("Modelisation Financiere").coefficient(2.0).module(m1).enseignant(ens.get(6)).build());
        elementModuleRepository.save(ElementModule.builder().code("IDF-S1-M1-E2").intitule("Blockchain & FinTech").coefficient(1.5).module(m1).enseignant(ens.get(7)).build());
        Module m2 = moduleRepository.save(Module.builder().code("IDF-S2-M1").intitule("Risk Management").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("IDF-S2-M1-E1").intitule("Credit Scoring & ML").coefficient(2.0).module(m2).enseignant(ens.get(8)).build());
        elementModuleRepository.save(ElementModule.builder().code("IDF-S2-M1-E2").intitule("Compliance & RegTech").coefficient(1.5).module(m2).enseignant(ens.get(9)).build());
    }

    private void createModules2SCL(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("2SCL-S1-M1").intitule("Optimisation Logistique").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2SCL-S1-M1-E1").intitule("Recherche Operationnelle").coefficient(2.0).module(m1).enseignant(ens.get(8)).build());
        elementModuleRepository.save(ElementModule.builder().code("2SCL-S1-M1-E2").intitule("IoT & Supply Chain 4.0").coefficient(1.5).module(m1).enseignant(ens.get(9)).build());
        Module m2 = moduleRepository.save(Module.builder().code("2SCL-S2-M1").intitule("Transport & Distribution").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("2SCL-S2-M1-E1").intitule("Planification & Ordonnancement").coefficient(2.0).module(m2).enseignant(ens.get(10)).build());
        elementModuleRepository.save(ElementModule.builder().code("2SCL-S2-M1-E2").intitule("Simulation & Jumeau Numerique").coefficient(1.5).module(m2).enseignant(ens.get(11)).build());
    }

    private void createModulesCyber(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("CSCC-S1-M1").intitule("Securite des Reseaux").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S1-M1-E1").intitule("Cryptographie Appliquee").coefficient(2.0).module(m1).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S1-M1-E2").intitule("Firewall & IDS/IPS").coefficient(1.5).module(m1).enseignant(ens.get(1)).build());
        Module m2 = moduleRepository.save(Module.builder().code("CSCC-S2-M1").intitule("Cloud & Securite").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S2-M1-E1").intitule("AWS / Azure Security").coefficient(2.0).module(m2).enseignant(ens.get(2)).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S2-M1-E2").intitule("Pentest & Ethical Hacking").coefficient(2.0).module(m2).enseignant(ens.get(3)).build());
        Module m3 = moduleRepository.save(Module.builder().code("CSCC-S3-M1").intitule("Forensic & Incident Response").semestre("S3").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S3-M1-E1").intitule("Analyse Forensique").coefficient(2.0).module(m3).enseignant(ens.get(4)).build());
        elementModuleRepository.save(ElementModule.builder().code("CSCC-S3-M1-E2").intitule("SIEM & SOC").coefficient(1.5).module(m3).enseignant(ens.get(5)).build());
    }

    private void createModulesD2S(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("D2S-S1-M1").intitule("Software Engineering").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("D2S-S1-M1-E1").intitule("Formal Methods").coefficient(2.0).module(m1).enseignant(ens.get(10)).build());
        elementModuleRepository.save(ElementModule.builder().code("D2S-S1-M1-E2").intitule("Data Science with Python").coefficient(1.5).module(m1).enseignant(ens.get(11)).build());
        Module m2 = moduleRepository.save(Module.builder().code("D2S-S2-M1").intitule("Cloud Native Development").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("D2S-S2-M1-E1").intitule("Kubernetes & Docker").coefficient(2.0).module(m2).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("D2S-S2-M1-E2").intitule("Serverless & API Gateway").coefficient(1.5).module(m2).enseignant(ens.get(1)).build());
    }

    private void createModulesSSE(Filiere f, User rm, List<User> ens) {
        Module m1 = moduleRepository.save(Module.builder().code("SSE-S1-M1").intitule("Systemes Embarques Intelligents").semestre("S1").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("SSE-S1-M1-E1").intitule("FPGA & VHDL").coefficient(2.0).hasTd(false).hasTp(true).hasProjet(true).module(m1).enseignant(ens.get(0)).build());
        elementModuleRepository.save(ElementModule.builder().code("SSE-S1-M1-E2").intitule("Robotique & Automatique").coefficient(1.5).hasTd(true).hasTp(true).hasProjet(false).module(m1).enseignant(ens.get(1)).build());
        Module m2 = moduleRepository.save(Module.builder().code("SSE-S2-M1").intitule("IoT & Edge Computing").semestre("S2").responsable(rm).filiere(f).build());
        elementModuleRepository.save(ElementModule.builder().code("SSE-S2-M1-E1").intitule("Protocoles IoT (MQTT, CoAP)").coefficient(2.0).hasTd(true).hasTp(true).hasProjet(false).module(m2).enseignant(ens.get(2)).build());
        elementModuleRepository.save(ElementModule.builder().code("SSE-S2-M1-E2").intitule("Edge AI & TinyML").coefficient(1.5).hasTd(false).hasTp(true).hasProjet(true).module(m2).enseignant(ens.get(3)).build());
    }

    /**
     * Pre-remplit des notes avec progression VARIABLE par element.
     * Certains elements auront 100%, d'autres 50%, 77%, 30%, etc.
     * Cela donne un dashboard RM realiste avec des progressions variees.
     */
    private void prefillAllNotes() {
        String[] filierePrefixes = {"gl", "2ia", "bia", "idf", "cscc", "sse", "d2s", "2scl"};
        List<ElementModule> allElements = elementModuleRepository.findAll();
        java.util.Random random = new java.util.Random(42);

        // Progressions variees a appliquer aux elements (en % d'etudiants remplis)
        double[] progressions = {1.0, 0.92, 0.77, 0.50, 0.65, 0.88, 0.30, 0.95, 0.70, 0.83, 0.45, 0.60};
        int progIndex = 0;

        for (String prefix : filierePrefixes) {
            List<User> filiereEtudiants = userRepository.findByRole(Role.ENS).stream()
                .filter(u -> u.getEmail().startsWith(prefix + "."))
                .collect(java.util.stream.Collectors.toList());

            if (filiereEtudiants.isEmpty()) continue;

            String filiereCodeUpper = prefix.toUpperCase();
            if (prefix.equals("bia")) filiereCodeUpper = "BIA";
            if (prefix.equals("2ia")) filiereCodeUpper = "2IA";
            if (prefix.equals("2scl")) filiereCodeUpper = "2SCL";
            if (prefix.equals("cscc")) filiereCodeUpper = "CSCC";
            if (prefix.equals("d2s")) filiereCodeUpper = "D2S";
            if (prefix.equals("sse")) filiereCodeUpper = "SSE";
            if (prefix.equals("idf")) filiereCodeUpper = "IDF";

            final String codePrefix = filiereCodeUpper;
            List<ElementModule> filiereElements = allElements.stream()
                .filter(el -> el.getCode().startsWith(codePrefix))
                .collect(java.util.stream.Collectors.toList());

            if (filiereElements.isEmpty()) continue;

            for (ElementModule el : filiereElements) {
                // Chaque element a une progression differente
                double prog = progressions[progIndex % progressions.length];
                progIndex++;

                int limit = (int) Math.round(filiereEtudiants.size() * prog);
                limit = Math.min(limit, filiereEtudiants.size());

                for (int i = 0; i < limit; i++) {
                    User etu = filiereEtudiants.get(i);

                    // Note EXAM : entre 5 et 19, distribution realiste
                    double examNote = 5.0 + random.nextDouble() * 14.0;
                    examNote = Math.round(examNote * 4) / 4.0;
                    noteRepository.save(Note.builder()
                        .etudiant(etu).elementModule(el)
                        .typeEvaluation(TypeEvaluation.EXAM)
                        .valeur(examNote).build());

                    // Note TD (si dispo) : entre 10 et 20
                    if (el.isHasTd()) {
                        double tdNote = 10.0 + random.nextDouble() * 10.0;
                        tdNote = Math.round(tdNote * 4) / 4.0;
                        noteRepository.save(Note.builder()
                            .etudiant(etu).elementModule(el)
                            .typeEvaluation(TypeEvaluation.TD)
                            .valeur(tdNote).build());
                    }

                    // Note TP (si dispo) : entre 8 et 19
                    if (el.isHasTp()) {
                        double tpNote = 8.0 + random.nextDouble() * 11.0;
                        tpNote = Math.round(tpNote * 4) / 4.0;
                        noteRepository.save(Note.builder()
                            .etudiant(etu).elementModule(el)
                            .typeEvaluation(TypeEvaluation.TP)
                            .valeur(tpNote).build());
                    }

                    // Note PROJET (si dispo) : entre 12 et 20
                    if (el.isHasProjet()) {
                        double projetNote = 12.0 + random.nextDouble() * 8.0;
                        projetNote = Math.round(projetNote * 4) / 4.0;
                        noteRepository.save(Note.builder()
                            .etudiant(etu).elementModule(el)
                            .typeEvaluation(TypeEvaluation.PROJET)
                            .valeur(projetNote).build());
                    }
                }
            }
            log.info("  {} : {} etudiants, {} elements (progressions variees)",
                prefix, filiereEtudiants.size(), filiereElements.size());
        }
    }

    /**
     * Cree des absences de demo pour la page scolarite
     */
    private void prefillAbsences(List<Filiere> filieres) {
        java.util.Random random = new java.util.Random(123);
        List<ElementModule> allElements = elementModuleRepository.findAll();

        String[] filierePrefixes = {"gl", "2ia", "bia", "cscc"};
        LocalDate[] dates = {
            LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 20),
            LocalDate.of(2025, 2, 3), LocalDate.of(2025, 2, 10),
            LocalDate.of(2025, 2, 18), LocalDate.of(2025, 3, 5),
            LocalDate.of(2025, 3, 12), LocalDate.of(2025, 3, 20),
        };

        int absCount = 0;
        for (String prefix : filierePrefixes) {
            List<User> etudiants = userRepository.findByRole(Role.ENS).stream()
                .filter(u -> u.getEmail().startsWith(prefix + "."))
                .collect(Collectors.toList());

            if (etudiants.isEmpty()) continue;

            String codePrefix = prefix.toUpperCase();
            if (prefix.equals("2ia")) codePrefix = "2IA";
            if (prefix.equals("bia")) codePrefix = "BIA";
            if (prefix.equals("cscc")) codePrefix = "CSCC";

            final String cp = codePrefix;
            List<ElementModule> filiereElements = allElements.stream()
                .filter(el -> el.getCode().startsWith(cp))
                .collect(Collectors.toList());

            if (filiereElements.isEmpty()) continue;

            // Creer 3-5 absences par filiere
            int nbAbsences = 3 + random.nextInt(3);
            for (int i = 0; i < nbAbsences && i < etudiants.size(); i++) {
                User etu = etudiants.get(i);
                ElementModule el = filiereElements.get(random.nextInt(filiereElements.size()));
                LocalDate date = dates[random.nextInt(dates.length)];

                // Alterner entre justifiee/injustifiee et statuts
                AbsenceType type = (i % 3 == 0) ? AbsenceType.JUSTIFIEE : AbsenceType.INJUSTIFIEE;
                JustificatifStatut statut = JustificatifStatut.EN_ATTENTE;
                if (i % 4 == 1) statut = JustificatifStatut.VALIDE;
                if (i % 4 == 2) statut = JustificatifStatut.REJETE;

                absenceRepository.save(Absence.builder()
                    .etudiant(etu)
                    .elementModule(el)
                    .dateAbsence(date)
                    .type(type)
                    .justificatifStatut(statut)
                    .build());
                absCount++;
            }
        }
        log.info("  {} absences creees", absCount);
    }

    /**
     * Transmet quelques modules au CF et a la scolarite pour la demo
     */
    private void prefillTransmissions(List<Filiere> filieres) {
        // Transmettre les 2 premiers modules de GL au CF
        List<Module> glModules = moduleRepository.findByFiliereId(filieres.get(3).getId());
        if (glModules.size() >= 3) {
            // Module 1 -> transmis au CF
            glModules.get(0).setStatut(ModuleStatut.TRANSMIS_CF);
            glModules.get(0).setDateTransmissionCF(LocalDateTime.of(2025, 3, 15, 10, 30));
            moduleRepository.save(glModules.get(0));

            // Module 2 -> transmis a la scolarite
            glModules.get(1).setStatut(ModuleStatut.TRANSMIS_SCO);
            glModules.get(1).setDateTransmissionCF(LocalDateTime.of(2025, 3, 10, 14, 0));
            glModules.get(1).setDateTransmissionSCO(LocalDateTime.of(2025, 3, 18, 9, 15));
            moduleRepository.save(glModules.get(1));

            // Module 3 -> cloture
            glModules.get(2).setStatut(ModuleStatut.CLOTURE);
            glModules.get(2).setDateTransmissionCF(LocalDateTime.of(2025, 3, 5, 11, 0));
            glModules.get(2).setDateTransmissionSCO(LocalDateTime.of(2025, 3, 12, 16, 45));
            moduleRepository.save(glModules.get(2));
        }

        // Transmettre 1 module de 2IA a la scolarite
        List<Module> iaModules = moduleRepository.findByFiliereId(filieres.get(0).getId());
        if (iaModules.size() >= 2) {
            iaModules.get(0).setStatut(ModuleStatut.TRANSMIS_SCO);
            iaModules.get(0).setDateTransmissionCF(LocalDateTime.of(2025, 3, 8, 9, 0));
            iaModules.get(0).setDateTransmissionSCO(LocalDateTime.of(2025, 3, 20, 11, 30));
            moduleRepository.save(iaModules.get(0));

            iaModules.get(1).setStatut(ModuleStatut.TRANSMIS_CF);
            iaModules.get(1).setDateTransmissionCF(LocalDateTime.of(2025, 3, 22, 14, 0));
            moduleRepository.save(iaModules.get(1));
        }

        log.info("  Modules GL: 1 TRANSMIS_CF, 1 TRANSMIS_SCO, 1 CLOTURE");
        log.info("  Modules 2IA: 1 TRANSMIS_SCO, 1 TRANSMIS_CF");
    }
}
