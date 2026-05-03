package com.decp.auth_service.service;

import com.decp.auth_service.client.UserServiceClient;
import com.decp.auth_service.dto.*;
import com.decp.auth_service.entity.User;
import com.decp.auth_service.repository.UserRepository;
import com.decp.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserServiceClient userServiceClient;
    private static final String[] ALLOWED_ROLES = {"STUDENT", "ALUMNI", "ADMIN"};

    public void register(RegisterRequest request) {
        String name = request.getName() != null ? request.getName() : request.getEmail();
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(name)
                .role("STUDENT")
                .build();

        userRepository.save(user);

        // Sync user to user-service
        CreateUserRequest createUserRequest = new CreateUserRequest(
                request.getEmail(),
                name,
                "STUDENT"
        );
        userServiceClient.createUser(createUserRequest);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return new AuthResponse(token);
    }

    public RoleAssignmentResponse assignRole(String requesterEmail, String targetEmail, String newRole) {
        // Validate the new role
        if (!isValidRole(newRole)) {
            throw new IllegalArgumentException("Invalid role: " + newRole + ". Allowed roles: STUDENT, ALUMNI, ADMIN");
        }

        // Prevent assigning ADMIN role if requester is not ADMIN
        if ("ADMIN".equals(newRole)) {
            throw new IllegalArgumentException("Only existing ADMIN users can assign ADMIN role");
        }

        // Prevent changing own role
        if (requesterEmail.equals(targetEmail)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        // Find and update the target user
        User targetUser = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + targetEmail));

        targetUser.setRole(newRole);
        User updatedUser = userRepository.save(targetUser);

        return new RoleAssignmentResponse(
                updatedUser.getId(),
                updatedUser.getEmail(),
                updatedUser.getRole(),
                "Role updated successfully"
        );
    }

    private boolean isValidRole(String role) {
        for (String allowedRole : ALLOWED_ROLES) {
            if (allowedRole.equals(role)) {
                return true;
            }
        }
        return false;
    }
}
