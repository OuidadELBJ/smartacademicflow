package ma.ensias.smartacademicflow.service;

import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.domain.entity.ElementModule;
import ma.ensias.smartacademicflow.domain.entity.Module;
import ma.ensias.smartacademicflow.domain.enums.ModuleStatut;
import ma.ensias.smartacademicflow.dto.DashboardDTO;
import ma.ensias.smartacademicflow.repository.ElementModuleRepository;
import ma.ensias.smartacademicflow.repository.ModuleRepository;
import ma.ensias.smartacademicflow.repository.NoteRepository;
import ma.ensias.smartacademicflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ModuleRepository moduleRepository;
    private final ElementModuleRepository elementModuleRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    /**
     * Dashboard pour le Responsable de Module
     */
    public DashboardDTO getDashboardRM(Long responsableId) {
        List<Module> modules = moduleRepository.findByResponsableId(responsableId);
        int totalModules = modules.size();
        int modulesEnCours = (int) modules.stream()
                .filter(m -> m.getStatut() == ModuleStatut.EN_COURS).count();
        int modulesClotures = (int) modules.stream()
                .filter(m -> m.getStatut() == ModuleStatut.CLOTURE).count();

        List<ElementModule> allElements = modules.stream()
                .flatMap(m -> elementModuleRepository.findByModuleId(m.getId()).stream())
                .collect(Collectors.toList());

        int totalElements = allElements.size();
        // On considere un element ayant des notes comme "avec notes"
        long totalStudents = userRepository.count(); // Simplifie

        List<DashboardDTO.ElementProgressDTO> elementsProgress = allElements.stream()
                .map(element -> {
                    long notesCount = noteRepository.countByElementModule(element.getId());
                    double progression = totalStudents > 0 ? (double) notesCount / totalStudents * 100 : 0;
                    return DashboardDTO.ElementProgressDTO.builder()
                            .elementId(element.getId())
                            .elementIntitule(element.getIntitule())
                            .enseignantNom(element.getEnseignant().getNom() + " " + element.getEnseignant().getPrenom())
                            .notesEnregistrees(notesCount)
                            .totalEtudiants(totalStudents)
                            .progression(Math.min(progression, 100))
                            .enRetard(progression < 50) // Seuil configurable
                            .build();
                })
                .collect(Collectors.toList());

        int elementsAvecNotes = (int) elementsProgress.stream()
                .filter(e -> e.getNotesEnregistrees() > 0).count();
        int elementsEnRetard = (int) elementsProgress.stream()
                .filter(DashboardDTO.ElementProgressDTO::isEnRetard).count();

        double progressionGlobale = elementsProgress.isEmpty() ? 0 :
                elementsProgress.stream().mapToDouble(DashboardDTO.ElementProgressDTO::getProgression).average().orElse(0);

        return DashboardDTO.builder()
                .totalModules(totalModules)
                .modulesEnCours(modulesEnCours)
                .modulesClotures(modulesClotures)
                .totalElements(totalElements)
                .elementsAvecNotes(elementsAvecNotes)
                .elementsEnRetard(elementsEnRetard)
                .progressionGlobale(progressionGlobale)
                .elementsProgress(elementsProgress)
                .build();
    }
}
