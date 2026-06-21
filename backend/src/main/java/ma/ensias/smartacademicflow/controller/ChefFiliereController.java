package ma.ensias.smartacademicflow.controller;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.*;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.domain.enums.TypeEvaluation;
import ma.ensias.smartacademicflow.repository.*;
import ma.ensias.smartacademicflow.service.FiliereService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/cf")
@RequiredArgsConstructor
public class ChefFiliereController {

    private final FiliereService filiereService;
    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final FiliereRepository filiereRepository;

    @GetMapping("/filieres")
    public ResponseEntity<List<Filiere>> getMesFilieres(Authentication auth) {
        User cf = userRepository.findByEmail(auth.getName()).orElseThrow();
        return ResponseEntity.ok(filiereService.getFilieresByCF(cf.getId()));
    }

    @GetMapping("/filiere/{filiereId}/modules")
    public ResponseEntity<List<Module>> getModulesFiliere(@PathVariable Long filiereId) {
        return ResponseEntity.ok(moduleRepository.findByFiliereId(filiereId));
    }

    @PostMapping("/filiere/{filiereId}/valider-pv")
    public ResponseEntity<Map<String, String>> validerPV(
            @PathVariable Long filiereId,
            Authentication auth) {
        filiereService.validerPVSemestriel(filiereId, auth.getName());
        return ResponseEntity.ok(Map.of(
                "message", "PV Semestriel valide. Tous les modules sont desormais clotures."
        ));
    }

    /**
     * Dashboard du Chef de Filiere avec KPIs reels
     */
    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication auth) {
        User cf = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Filiere> filieres = filiereRepository.findByChefFiliereId(cf.getId());

        List<Map<String, Object>> filieresData = new ArrayList<>();
        int totalModules = 0;
        int modulesEnCours = 0;
        int modulesTransmisCF = 0;
        int modulesTransmisSCO = 0;
        int modulesClotures = 0;
        int totalNotesSaisies = 0;
        int totalNotesAttendues = 0;
        int totalEtudiants = 0;

        for (Filiere filiere : filieres) {
            List<Module> modules = moduleRepository.findByFiliereId(filiere.getId());
            totalModules += modules.size();

            int filiereEnCours = 0;
            int filiereTransmisCF = 0;
            int filiereTransmisSCO = 0;
            int filiereClotures = 0;
            int filiereNotesSaisies = 0;
            int filiereNotesAttendues = 0;

            // Compter etudiants de cette filiere
            String filiereCode = filiere.getCode().toLowerCase().replace("&", "");
            long nbEtudiants = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().startsWith(filiereCode + ".")).count();
            totalEtudiants += (int) nbEtudiants;

            List<Map<String, Object>> modulesDetails = new ArrayList<>();

            for (Module mod : modules) {
                switch (mod.getStatut()) {
                    case EN_COURS -> { modulesEnCours++; filiereEnCours++; }
                    case TRANSMIS_CF -> { modulesTransmisCF++; filiereTransmisCF++; }
                    case TRANSMIS_SCO -> { modulesTransmisSCO++; filiereTransmisSCO++; }
                    case CLOTURE -> { modulesClotures++; filiereClotures++; }
                }

                // Calculer progression du module
                List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());
                int modNotesSaisies = 0;
                int modNotesAttendues = 0;

                for (ElementModule el : elements) {
                    List<Note> notes = noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM);
                    modNotesSaisies += notes.size();
                    modNotesAttendues += (int) nbEtudiants;
                }

                filiereNotesSaisies += modNotesSaisies;
                filiereNotesAttendues += modNotesAttendues;
                totalNotesSaisies += modNotesSaisies;
                totalNotesAttendues += modNotesAttendues;

                double modProgression = modNotesAttendues > 0
                        ? Math.min(Math.round((double) modNotesSaisies / modNotesAttendues * 100), 100) : 0;

                Map<String, Object> modMap = new HashMap<>();
                modMap.put("moduleId", mod.getId());
                modMap.put("code", mod.getCode());
                modMap.put("intitule", mod.getIntitule());
                modMap.put("semestre", mod.getSemestre());
                modMap.put("statut", mod.getStatut().name());
                modMap.put("responsableNom", mod.getResponsable().getNom() + " " + mod.getResponsable().getPrenom());
                modMap.put("notesSaisies", modNotesSaisies);
                modMap.put("notesAttendues", modNotesAttendues);
                modMap.put("progression", modProgression);
                modMap.put("dateTransmissionCF", mod.getDateTransmissionCF() != null ? mod.getDateTransmissionCF().toString() : null);
                modMap.put("dateTransmissionSCO", mod.getDateTransmissionSCO() != null ? mod.getDateTransmissionSCO().toString() : null);
                modulesDetails.add(modMap);
            }

            double filiereProgression = filiereNotesAttendues > 0
                    ? Math.round((double) filiereNotesSaisies / filiereNotesAttendues * 100) : 0;

            Map<String, Object> filiereMap = new HashMap<>();
            filiereMap.put("filiereId", filiere.getId());
            filiereMap.put("code", filiere.getCode());
            filiereMap.put("intitule", filiere.getIntitule());
            filiereMap.put("totalModules", modules.size());
            filiereMap.put("modulesEnCours", filiereEnCours);
            filiereMap.put("modulesTransmisCF", filiereTransmisCF);
            filiereMap.put("modulesTransmisSCO", filiereTransmisSCO);
            filiereMap.put("modulesClotures", filiereClotures);
            filiereMap.put("progression", filiereProgression);
            filiereMap.put("nbEtudiants", nbEtudiants);
            filiereMap.put("modules", modulesDetails);
            filieresData.add(filiereMap);
        }

        double progressionGlobale = totalNotesAttendues > 0
                ? Math.round((double) totalNotesSaisies / totalNotesAttendues * 100) : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("totalFilieres", filieres.size());
        result.put("totalModules", totalModules);
        result.put("modulesEnCours", modulesEnCours);
        result.put("modulesTransmisCF", modulesTransmisCF);
        result.put("modulesTransmisSCO", modulesTransmisSCO);
        result.put("modulesClotures", modulesClotures);
        result.put("totalNotesSaisies", totalNotesSaisies);
        result.put("totalNotesAttendues", totalNotesAttendues);
        result.put("progressionGlobale", progressionGlobale);
        result.put("totalEtudiants", totalEtudiants);
        result.put("filieres", filieresData);

        return ResponseEntity.ok(result);
    }

    /**
     * Modules recus du RM (statut TRANSMIS_CF) - prets a etre transmis a la scolarite
     */
    @GetMapping("/modules-recus")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getModulesRecus(Authentication auth) {
        User cf = userRepository.findByEmail(auth.getName()).orElseThrow();
        List<Filiere> filieres = filiereRepository.findByChefFiliereId(cf.getId());

        List<Map<String, Object>> result = new ArrayList<>();

        for (Filiere filiere : filieres) {
            List<Module> modules = moduleRepository.findByFiliereIdAndStatut(filiere.getId(), ModuleStatut.TRANSMIS_CF);

            String filiereCode = filiere.getCode().toLowerCase().replace("&", "");
            long nbEtudiants = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().startsWith(filiereCode + ".")).count();

            for (Module mod : modules) {
                List<ElementModule> elements = elementModuleRepository.findByModuleId(mod.getId());
                int notesSaisies = 0;
                for (ElementModule el : elements) {
                    notesSaisies += noteRepository.findByElementModuleIdAndTypeEvaluation(el.getId(), TypeEvaluation.EXAM).size();
                }

                Map<String, Object> map = new HashMap<>();
                map.put("moduleId", mod.getId());
                map.put("code", mod.getCode());
                map.put("intitule", mod.getIntitule());
                map.put("semestre", mod.getSemestre());
                map.put("filiereCode", filiere.getCode());
                map.put("filiereIntitule", filiere.getIntitule());
                map.put("responsableNom", mod.getResponsable().getNom() + " " + mod.getResponsable().getPrenom());
                map.put("notesSaisies", notesSaisies);
                map.put("nbEtudiants", nbEtudiants);
                map.put("nbElements", elements.size());
                map.put("dateTransmissionCF", mod.getDateTransmissionCF() != null ? mod.getDateTransmissionCF().toString() : null);
                result.add(map);
            }
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Transmettre un module a la scolarite
     */
    @PostMapping("/transmettre-scolarite/{moduleId}")
    @Transactional
    public ResponseEntity<Map<String, String>> transmettreScolarite(
            @PathVariable Long moduleId, Authentication auth) {
        User cf = userRepository.findByEmail(auth.getName()).orElseThrow();
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module introuvable"));

        // Verifier que le module appartient a une filiere du CF
        List<Filiere> filieres = filiereRepository.findByChefFiliereId(cf.getId());
        boolean isOwner = filieres.stream().anyMatch(f -> f.getId().equals(module.getFiliere().getId()));
        if (!isOwner) {
            return ResponseEntity.status(403).body(Map.of("error", "Ce module n'appartient pas a votre filiere"));
        }

        // Verifier le statut
        if (module.getStatut() != ModuleStatut.TRANSMIS_CF) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ce module n'est pas encore transmis par le RM"));
        }

        module.setStatut(ModuleStatut.TRANSMIS_SCO);
        module.setDateTransmissionSCO(LocalDateTime.now());
        moduleRepository.save(module);

        return ResponseEntity.ok(Map.of("message", "Module \"" + module.getIntitule() + "\" transmis a la scolarite avec succes"));
    }
}
