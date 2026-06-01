package ma.ensias.smartacademicflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SmartAcademicFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartAcademicFlowApplication.class, args);
    }
}
