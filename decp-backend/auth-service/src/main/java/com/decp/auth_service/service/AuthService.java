package com.decp.auth_service.service;

import com.decp.auth_service.client.UserServiceClient;
import com.decp.auth_service.dto.*;
import com.decp.auth_service.entity.RefreshToken;
import com.decp.auth_service.entity.User;
import com.decp.auth_service.repository.RefreshTokenRepository;
import com.decp.auth_service.repository.UserRepository;
import com.decp.auth_service.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserServiceClient userServiceClient;
    private static final String[] ALLOWED_ROLES = {"STUDENT", "ALUMNI", "ADMIN"};
    private static final String TOKEN_TYPE = "Bearer";

    @Value("${jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Transactional
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

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        log.info("Login successful userEmail={} userRole={}", user.getEmail(), user.getRole());
        return issueTokenPair(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = getRefreshToken(request == null ? null : request.getRefreshToken());

        if (refreshToken.isRevoked()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has been revoked");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            revoke(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
        }

        User user = userRepository.findByEmail(refreshToken.getUserEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token user is invalid"));

        revoke(refreshToken);
        log.info("Refresh token rotated userEmail={}", user.getEmail());
        return issueTokenPair(user);
    }

    @Transactional
    public LogoutResponse logout(LogoutRequest request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            return new LogoutResponse("Logged out successfully");
        }

        refreshTokenRepository.findByTokenHash(hashToken(request.getRefreshToken()))
                .ifPresent(this::revoke);

        return new LogoutResponse("Logged out successfully");
    }

    @Transactional
    public LogoutResponse changePassword(String email, ChangePasswordRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password change request is required");
        }
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        revokeRefreshTokensForUser(user.getEmail());

        log.info("Password changed and refresh tokens revoked userEmail={}", user.getEmail());
        return new LogoutResponse("Password changed successfully. Please log in again.");
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

    private AuthResponse issueTokenPair(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken();
        LocalDateTime now = LocalDateTime.now();

        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(hashToken(refreshToken))
                .userEmail(user.getEmail())
                .expiresAt(now.plus(Duration.ofMillis(refreshTokenExpirationMs)))
                .revoked(false)
                .createdAt(now)
                .build());

        return new AuthResponse(accessToken, refreshToken, TOKEN_TYPE);
    }

    private RefreshToken getRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is required");
        }

        return refreshTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
    }

    private void revoke(RefreshToken refreshToken) {
        if (!refreshToken.isRevoked()) {
            refreshToken.setRevoked(true);
            refreshToken.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(refreshToken);
        }
    }

    private void revokeRefreshTokensForUser(String email) {
        refreshTokenRepository.findByUserEmailAndRevokedFalse(email)
                .forEach(this::revoke);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 hashing is not available", e);
        }
    }
}
