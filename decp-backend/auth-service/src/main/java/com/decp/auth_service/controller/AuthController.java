package com.decp.auth_service.controller;

import com.decp.auth_service.dto.*;
import com.decp.auth_service.service.AuthService;
import com.decp.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        authService.register(request);
        return "User registered successfully";
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/test")
    public String test() {
        return "Protected!";
    }

    @PutMapping("/admin/role")
    public ResponseEntity<?> assignRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RoleAssignmentRequest request) {

        // Extract and validate JWT token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        // Validate token
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid or expired token");
        }

        // Extract role from token
        String requesterRole;
        try {
            requesterRole = jwtUtil.extractRole(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Could not extract role from token");
        }

        // Check if requester is ADMIN
        if (requesterRole == null || !requesterRole.equals("ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only ADMIN users can assign roles");
        }

        // Extract requester email
        String requesterEmail;
        try {
            requesterEmail = jwtUtil.extractEmail(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Could not extract email from token");
        }

        // Assign role
        try {
            RoleAssignmentResponse response = authService.assignRole(requesterEmail, request.getEmail(), request.getRole());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(e.getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }
}
