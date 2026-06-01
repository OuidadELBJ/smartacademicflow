package ma.ensias.smartacademicflow.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensias.smartacademicflow.dto.AuthRequest;
import ma.ensias.smartacademicflow.dto.AuthResponse;
import ma.ensias.smartacademicflow.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}
